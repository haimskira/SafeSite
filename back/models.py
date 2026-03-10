from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Date, Time
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class StatusEnum(str, enum.Enum):
    IN_PROTECTED_AREA = "IN_PROTECTED_AREA"
    AT_HOME = "AT_HOME"
    ON_MY_WAY = "ON_MY_WAY"
    WORKING = "WORKING"
    CHECKED_OUT = "CHECKED_OUT"

class SiteEnum(str, enum.Enum):
    NORTH = "NORTH"
    SOUTH = "SOUTH"

class RequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True, nullable=False)
    last_name = Column(String, index=True, nullable=False)
    department = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    default_site = Column(Enum(SiteEnum), nullable=True)
    force_password_change = Column(Integer, default=0, nullable=False)

    attendance_logs = relationship("AttendanceLog", back_populates="user")
    requests = relationship("ArrivalRequest", back_populates="user")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action_type = Column(String, nullable=False) # e.g., 'CHECK_IN', 'CHECK_OUT', 'STATUS_UPDATE'
    site = Column(Enum(SiteEnum), nullable=True)
    status = Column(Enum(StatusEnum), nullable=True)

    user = relationship("User", back_populates="attendance_logs")

class ArrivalRequest(Base):
    __tablename__ = "arrival_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(RequestStatusEnum), default=RequestStatusEnum.PENDING, nullable=False)

    user = relationship("User", back_populates="requests")
