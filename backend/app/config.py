import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "TalentGuard"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    
    FRONTEND_ORIGINS: str = "http://localhost:5173"
    
    SUPABASE_URL: str = Field(default="")
    SUPABASE_PUBLISHABLE_KEY: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="")
    SUPABASE_JWT_ISSUER: str = Field(default="")
    
    IBM_HR_DATASET_PATH: str = Field(default="data/WA_Fn-UseC_-HR-Employee-Attrition.csv")

    @property
    def cors_origins(self) -> List[str]:
        if not self.FRONTEND_ORIGINS:
            return ["http://localhost:5173"]
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    def get_dataset_abs_path(self) -> str:
        if os.path.isabs(self.IBM_HR_DATASET_PATH):
            return self.IBM_HR_DATASET_PATH
        backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(backend_root, self.IBM_HR_DATASET_PATH)


settings = Settings()
