from typing import Optional
from fastapi import Header, HTTPException, status
import jwt
from supabase import create_client, Client
from app.config import settings
from app.schemas import UserProfile

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is None and settings.SUPABASE_URL and (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY):
        key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, key)
        except Exception as e:
            print(f"Supabase client initialization warning: {e}")
    return _supabase_client


async def verify_supabase_token(authorization: Optional[str] = Header(None)) -> UserProfile:
    """
    Verifies the Supabase JWT token from Authorization header and extracts user identity.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "MISSING_TOKEN",
                "message": "Authorization header is required."
            }
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN_FORMAT",
                "message": "Authorization header must be in format 'Bearer <token>'."
            }
        )

    token = parts[1]

    # Validate against Supabase Auth
    client = get_supabase_client()
    if client:
        try:
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                user_id = str(u.id)
                email = u.email
                meta = u.user_metadata or {}
                display_name = meta.get("display_name", email.split("@")[0] if email else "HR Manager")
                role = meta.get("role", "hr_manager")

                # Ensure profile exists in public.profiles table
                try:
                    client.table("profiles").upsert({
                        "id": user_id,
                        "display_name": display_name,
                        "role": role
                    }).execute()
                except Exception:
                    pass

                return UserProfile(
                    id=user_id,
                    email=email,
                    display_name=display_name,
                    role=role
                )
        except Exception:
            # Token invalid according to Supabase
            pass

    # Fallback to backend JWT verification if secret key is configured
    if settings.SUPABASE_SECRET_KEY:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_SECRET_KEY,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            user_id = payload.get("sub")
            if user_id:
                meta = payload.get("user_metadata") or {}
                return UserProfile(
                    id=str(user_id),
                    email=payload.get("email"),
                    display_name=meta.get("display_name"),
                    role=meta.get("role", "hr_manager")
                )
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_CREDENTIALS",
            "message": "Provided access token is invalid or expired."
        }
    )
