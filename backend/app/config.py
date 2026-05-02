from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET: str = "change-me-in-production-min-32-chars"
    ALERT_THRESHOLD_DAYS: int = 3
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()