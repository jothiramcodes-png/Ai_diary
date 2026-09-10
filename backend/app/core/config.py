import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LifeBook AI"
    API_V1_STR: str = "/api/v1"
    
    # Security & Auth
    SECRET_KEY: str = "lifebook-super-secret-jwt-key-for-hackathon-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Defaults to SQLite in local directory)
    DATABASE_URL: str = "sqlite:///./lifebook.db"
    
    # Storage
    STORAGE_DIR: str = "./storage"
    
    # AI Providers ("local", "openai", "gemini", "openrouter")
    AI_PROVIDER: str = "openrouter"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    STT_PROVIDER: str = "local"
    
    # Demo Seed Settings
    DEMO_NAME: str = "Jothiram"
    DEMO_EMAIL: str = "jothiram@lifebook.ai"
    DEMO_PASSWORD: str = "LifeBook2026!"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
