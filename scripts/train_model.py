"""
Standalone CLI Script to Train Flood Risk Random Forest Model
=============================================================
Usage:
    python scripts/train_model.py
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.ml.train import train_model

if __name__ == "__main__":
    train_model()
