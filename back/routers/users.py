from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from deps import get_current_admin_user, get_current_user
from security import verify_password, get_password_hash
from websockets_manager import manager

router = APIRouter(prefix="/users", tags=["users"])

def trigger_refresh():
    import asyncio
    asyncio.run(manager.broadcast("refresh"))

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/me/site", response_model=schemas.UserResponse)
def update_my_default_site(
    site: models.SiteEnum,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.default_site = site
    db.commit()
    db.refresh(current_user)
    background_tasks.add_task(trigger_refresh)
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_my_profile(
    user_update: schemas.UserUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.default_site is not None:
        current_user.default_site = user_update.default_site
    
    db.commit()
    db.refresh(current_user)
    background_tasks.add_task(trigger_refresh)
    return current_user

@router.put("/me/password", response_model=schemas.UserResponse)
def update_password(
    password_data: schemas.UserPasswordUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.force_password_change = 0
    db.commit()
    db.refresh(current_user)
    background_tasks.add_task(trigger_refresh)
    return current_user

@router.put("/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role: models.RoleEnum,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    db.refresh(user)
    background_tasks.add_task(trigger_refresh)
    return user

@router.put("/{user_id}/reset-password", response_model=schemas.UserResponse)
def reset_user_password(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Reset to default password
    user.hashed_password = get_password_hash("SafeSite2026")
    user.force_password_change = 1
    db.commit()
    db.refresh(user)
    background_tasks.add_task(trigger_refresh)
    return user
