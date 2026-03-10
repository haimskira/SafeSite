from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from deps import get_current_user
from websockets_manager import manager

router = APIRouter(prefix="/auth", tags=["auth"])

def trigger_refresh():
    import asyncio
    asyncio.run(manager.broadcast("refresh"))

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> Any:
    # Check if user exists
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # Check if this is the first user. If so, make them ADMIN
    is_first = db.query(models.User).count() == 0
    role = models.RoleEnum.ADMIN if is_first else models.RoleEnum.USER
    
    user = models.User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        department=user_in.department,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    background_tasks.add_task(trigger_refresh)
    return user

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}, expires_delta=access_token_expires
    )
    background_tasks.add_task(trigger_refresh)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
