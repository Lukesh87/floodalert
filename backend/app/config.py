import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Urban Flood Nowcasting & Early Warning System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super_secret_urban_flood_key_2026_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite fallback for easy college student setup; PostgreSQL supported when set in env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./urban_flood.db")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    class Config:
        case_sensitive = True

settings = Settings()
