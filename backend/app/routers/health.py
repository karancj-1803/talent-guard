import os
from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    dataset_path = settings.get_dataset_abs_path()
    return HealthResponse(
        status="ok",
        service="TalentGuard API",
        version="1.0.0",
        environment=settings.APP_ENV,
        dataset_available=os.path.exists(dataset_path)
    )
