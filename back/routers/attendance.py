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
