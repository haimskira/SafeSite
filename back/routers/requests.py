from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from deps import get_current_user, get_current_admin_user
from websockets_manager import manager

router = APIRouter(prefix="/requests", tags=["requests"])

def trigger_refresh():
    import asyncio
    asyncio.run(manager.broadcast("refresh"))

@router.post("/", response_model=schemas.ArrivalRequestResponse)
def create_request(
    req: schemas.ArrivalRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_req = models.ArrivalRequest(
        user_id=current_user.id,
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        status=models.RequestStatusEnum.PENDING
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    background_tasks.add_task(trigger_refresh)
    return new_req

@router.get("/my", response_model=List[schemas.ArrivalRequestResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ArrivalRequest).filter(models.ArrivalRequest.user_id == current_user.id).all()

@router.get("/all", response_model=List[schemas.ArrivalRequestResponse])
def get_all_requests(
    status: Optional[models.RequestStatusEnum] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    query = db.query(models.ArrivalRequest)
    if status is not None:
        query = query.filter(models.ArrivalRequest.status == status)
    return query.all()

@router.put("/{req_id}/status", response_model=schemas.ArrivalRequestResponse)
def update_request_status(
    req_id: int,
    status: models.RequestStatusEnum,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    req = db.query(models.ArrivalRequest).filter(models.ArrivalRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = status
    db.commit()
    db.refresh(req)
    background_tasks.add_task(trigger_refresh)
    return req
