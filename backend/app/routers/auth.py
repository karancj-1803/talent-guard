from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas import UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: UserProfile = Depends(get_current_user)):
    return current_user
