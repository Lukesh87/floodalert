"""
Standalone CLI Script to Seed Database
======================================
Usage:
    python scripts/seed_database.py
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.api.v1.endpoints.admin import seed_database
from app.db.session import Base, SessionLocal, engine

if __name__ == "__main__":
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding Coimbatore stations and verified historical flood incidents...")
        res = seed_database(db)
        print(f"Done: {res}")
    finally:
        db.close()
