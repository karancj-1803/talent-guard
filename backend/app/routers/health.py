import os
from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse
from app.services.lifecycle_service import LifecycleService

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    dataset_path = settings.get_dataset_abs_path()
    status_info = LifecycleService.get_status()

    return HealthResponse(
        status="ok" if status_info["ready"] else "degraded",
        service="TalentGuard API",
        version="1.0.0",
        environment=settings.APP_ENV,
        dataset_available=os.path.exists(dataset_path),
        model_ready=status_info["ready"],
        model_status=status_info["status"],
        active_run_id=status_info.get("run_id"),
        artifact_version=status_info.get("version")
    )
