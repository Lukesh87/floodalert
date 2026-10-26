import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.api.v1.endpoints.admin import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
