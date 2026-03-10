from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models
from routers import auth, users, attendance, requests
from websockets_manager import manager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Employee Management & Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(requests.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Employee Management System API"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't really expect to receive data here, but handle the loop
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
