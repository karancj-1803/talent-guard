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

    # Special handling for development/demo test token
    if settings.DEBUG and token in ("mock_jwt_token_demo_hr_user", "test_token_valid"):
        return UserProfile(
            id="usr-a89b3f12-45e0-4781-a9c1-4209df349801",
            email="elena.vance@technova.internal",
            display_name="Elena Vance",
            role="hr_manager"
        )

    # Validate against Supabase
    client = get_supabase_client()
    if client:
        try:
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                return UserProfile(
                    id=str(u.id),
                    email=u.email,
                    display_name=u.user_metadata.get("display_name", u.email.split("@")[0] if u.email else "HR Manager"),
                    role=u.user_metadata.get("role", "hr_manager")
                )
        except Exception as e:
            # Token invalid according to Supabase
            pass

    # Fallback to local JWT decode if JWT secret is configured
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
                return UserProfile(
                    id=str(user_id),
                    email=payload.get("email"),
                    display_name=payload.get("user_metadata", {}).get("display_name"),
                    role=payload.get("user_metadata", {}).get("role", "hr_manager")
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
