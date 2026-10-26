"""
Application Configuration Settings
==================================
Manages environment variables, database URLs, CORS origins, and system parameters.
"""

from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Urban Flood Nowcasting System (Coimbatore)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "dev-secret-key-urban-flood-nowcasting-coimbatore-2026"

    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @field_validator("ALLOWED_ORIGINS")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Database
    DATABASE_URL: str = "sqlite:///./urban_flood.db"

    # Open-Meteo & Weather
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    WEATHER_CACHE_TTL_SECONDS: int = 900

    # Real-Time Weather API Providers & Keys
    OPENWEATHERMAP_API_KEY: Optional[str] = None
    WEATHERAPI_KEY: Optional[str] = None
    WEATHER_PROVIDER: str = "auto"  # auto, openweathermap, weatherapi, openmeteo

    # Target default coordinates (Coimbatore city center)
    DEFAULT_LATITUDE: float = 11.0168
    DEFAULT_LONGITUDE: float = 76.9558

    # Alert cooldown & expiry
    ALERT_COOLDOWN_MINUTES: int = 60
    ALERT_EXPIRY_HOURS: int = 6

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
