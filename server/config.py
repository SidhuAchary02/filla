from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    
    # Database
    database_url: str
    
    # App
    app_name: str = "Filla API"
    debug: bool = False
    
    # CORS
    frontend_url: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
