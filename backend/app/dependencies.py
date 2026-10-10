from fastapi import Depends
from app.auth import verify_supabase_token, get_supabase_client
from app.schemas import UserProfile
from supabase import Client


async def get_current_user(user: UserProfile = Depends(verify_supabase_token)) -> UserProfile:
    return user


def get_db() -> Client:
    return get_supabase_client()
