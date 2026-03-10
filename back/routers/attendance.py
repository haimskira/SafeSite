from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

import models
import schemas
from database import get_db
from deps import get_current_user, get_current_admin_user
from websockets_manager import manager

router = APIRouter(prefix="/attendance", tags=["attendance"])

def trigger_refresh():
    import asyncio
    asyncio.run(manager.broadcast("refresh"))

@router.post("/check-in", response_model=schemas.AttendanceLogResponse)
def check_in(
    data: schemas.AttendanceCheckIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    log = models.AttendanceLog(
        user_id=current_user.id,
        action_type="CHECK_IN",
        site=data.site,
        status=data.status
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    background_tasks.add_task(trigger_refresh)
    return log

@router.post("/update-status", response_model=schemas.AttendanceLogResponse)
def update_status(
    data: schemas.AttendanceUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    log = models.AttendanceLog(
        user_id=current_user.id,
        action_type="STATUS_UPDATE",
        status=data.status
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    background_tasks.add_task(trigger_refresh)
    return log

@router.post("/check-out", response_model=schemas.AttendanceLogResponse)
def check_out(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    log = models.AttendanceLog(
        user_id=current_user.id,
        action_type="CHECK_OUT",
        status=models.StatusEnum.CHECKED_OUT
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    background_tasks.add_task(trigger_refresh)
    return log


@router.get("/logs", response_model=List[schemas.AttendanceLogResponse])
def read_attendance_logs(
    filter_date: Optional[date] = None,
    site: Optional[models.SiteEnum] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    query = db.query(models.AttendanceLog)
    if filter_date:
        query = query.filter(models.AttendanceLog.timestamp >= datetime.combine(filter_date, datetime.min.time()))
        query = query.filter(models.AttendanceLog.timestamp <= datetime.combine(filter_date, datetime.max.time()))
    if site:
        query = query.filter(models.AttendanceLog.site == site)
        
    logs = query.order_by(models.AttendanceLog.timestamp.desc()).all()
    return logs

@router.get("/active", response_model=List[schemas.AttendanceLogResponse])
def get_active_workers(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    subquery = db.query(
        models.AttendanceLog.user_id,
        func.max(models.AttendanceLog.timestamp).label("max_ts")
    ).group_by(models.AttendanceLog.user_id).subquery()
    
    query = db.query(models.AttendanceLog).join(
        subquery,
        (models.AttendanceLog.user_id == subquery.c.user_id) & (models.AttendanceLog.timestamp == subquery.c.max_ts)
    ).filter(models.AttendanceLog.status != models.StatusEnum.CHECKED_OUT)
    
    return query.all()

@router.get("/analytics")
def get_analytics(
    filter_date: Optional[date] = None,
    site: Optional[models.SiteEnum] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """
    Returns aggregated analytics for the given date (defaulting to today).
    It calculates the number of distinct users visiting each hour, total visitors, and peak load hour.
    """
    target_date = filter_date if filter_date else date.today()
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    # Base query for logs on this date
    query = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.timestamp >= start_of_day,
        models.AttendanceLog.timestamp <= end_of_day
    )
    
    if site:
        query = query.filter(models.AttendanceLog.site == site)
        
    logs = query.order_by(models.AttendanceLog.timestamp.asc()).all()
    
    # 1. Total distinct visitors
    distinct_users = set(log.user_id for log in logs)
    total_visitors = len(distinct_users)
    
    # 2. Hourly load (aggregate by hour of timestamp)
    hourly_counts = {hour: set() for hour in range(24)}
    
    for log in logs:
        # A check-in or status update in an hour means they were present.
        # This is a simple approximation where any logged action during an hour counts as presence.
        hour = log.timestamp.hour
        hourly_counts[hour].add(log.user_id)
        
    # Format for Recharts: [{hour: '08:00', count: 15}, ...]
    chart_data = []
    peak_hour = "N/A"
    max_count = 0
    
    for hour in range(24):
        count = len(hourly_counts[hour])
        chart_data.append({
            "hour": f"{hour:02d}:00",
            "count": count
        })
        if count > max_count:
            max_count = count
            peak_hour = f"{hour:02d}:00"
            
    # Also return the raw logs for the detailed table list
    # Re-use the response_model schema structure implicitly or use raw dicts
    detailed_logs = []
    for log in reversed(logs): # Latest first for the table
        detailed_logs.append({
            "id": log.id,
            "user_name": f"{log.user.first_name} {log.user.last_name}",
            "action_type": log.action_type,
            "site": log.site.value if log.site else None,
            "status": log.status.value if log.status else None,
            "timestamp": log.timestamp.isoformat()
        })
            
    return {
        "summary": {
            "total_visitors": total_visitors,
            "peak_hour": peak_hour,
            "peak_count": max_count
        },
        "chart_data": chart_data,
        "detailed_logs": detailed_logs
    }
