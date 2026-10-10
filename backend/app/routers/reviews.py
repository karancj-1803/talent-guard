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
    try:
        # Save review record bound strictly to verified reviewer identity and verified ownership
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
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EMPLOYEE_NOT_FOUND",
                "message": str(pe)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DATABASE_ERROR",
                "message": f"Failed to save HR review: {str(e)}"
            }
        )
