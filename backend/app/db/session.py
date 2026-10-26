"""
SQLAlchemy Database Engine & Session Management
===============================================
Supports SQLite for portable local development and PostgreSQL (+ PostGIS) for production.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# If using SQLite, check_same_thread=False is required for FastAPI multithreaded requests
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session lifetime management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
