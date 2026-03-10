# SafeSite

Full-stack Employee Management & Attendance System

## Technologies
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite, JWT, bcrypt
- **Frontend:** React, Vite, Vanilla CSS with Glassmorphism, Context API

## Setup

### Backend
Navigate to the `back` directory:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python seed_admin.py   # To create the initial admin user (admin / admin123)
uvicorn main:app --reload
```

### Frontend
Navigate to the `front` directory:
```bash
npm install
npm run dev
```
