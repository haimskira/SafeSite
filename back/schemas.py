from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from models import RoleEnum, StatusEnum, SiteEnum, RequestStatusEnum

# User schemas
class UserCreate(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    department: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    default_site: Optional[SiteEnum] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    department: Optional[str] = None
    role: RoleEnum
    default_site: Optional[SiteEnum] = None
    force_password_change: int = 0

    class Config:
        from_attributes = True

# JWT schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None

# Attendance Schemas
class AttendanceCheckIn(BaseModel):
    site: SiteEnum
    status: Optional[StatusEnum] = StatusEnum.WORKING

class AttendanceUpdate(BaseModel):
    status: StatusEnum

class AttendanceLogResponse(BaseModel):
    id: int
    user_id: int
    timestamp: datetime
    action_type: str
    site: Optional[SiteEnum] = None
    status: Optional[StatusEnum] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Request Schemas
class ArrivalRequestCreate(BaseModel):
    date: date
    start_time: time
    end_time: time

class ArrivalRequestResponse(BaseModel):
    id: int
    user_id: int
    date: date
    start_time: time
    end_time: time
    status: RequestStatusEnum

    class Config:
        from_attributes = True
