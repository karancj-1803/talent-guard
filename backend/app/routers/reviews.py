from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.schemas import ReviewRequest, ReviewResponse, UserProfile
from app.services.persistence_service import PersistenceService

router = APIRouter(tags=["HR Reviews"])


@router.put("/employee-risks/{employee_risk_id}/review", response_model=ReviewResponse)
async def update_hr_review(
    employee_risk_id: str,
    payload: ReviewRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    # Save review record bound to verified reviewer identity
    result = PersistenceService.upsert_review(
        employee_risk_id=employee_risk_id,
        reviewer_id=current_user.id,
        status=payload.status,
        notes=payload.notes
    )

    return ReviewResponse(
        employee_risk_id=employee_risk_id,
        status=result["status"],
        notes=result.get("notes"),
        updated_at=result["updated_at"]
    )
