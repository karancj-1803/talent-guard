import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import health, auth, runs, priorities, reviews

app = FastAPI(
    title="TalentGuard API",
    description="Explainable Retention Command Center API with scikit-learn ML pipeline and Supabase integration.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# Standardized Error Handling Conforming to PRD 3.4
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    detail = exc.detail
    code = "HTTP_ERROR"
    message = str(detail)
    details = None

    if isinstance(detail, dict):
        code = detail.get("code", code)
        message = detail.get("message", message)
        details = detail.get("details")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "request_id": req_id
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters or payload format.",
                "details": exc.errors(),
                "request_id": req_id
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": str(exc) if settings.DEBUG else None,
                "request_id": req_id
            }
        }
    )


# Mount Routers under base prefix
api_v1 = settings.API_PREFIX  # /api/v1

app.include_router(health.router, prefix=api_v1)
app.include_router(health.router)  # Also available at /health root
app.include_router(auth.router, prefix=api_v1)
app.include_router(runs.router, prefix=api_v1)
app.include_router(priorities.router, prefix=api_v1)
app.include_router(reviews.router, prefix=api_v1)


@app.get("/")
async def root():
    return {
        "service": "TalentGuard API",
        "docs_url": "/docs",
        "health_check": f"{api_v1}/health",
        "version": "1.0.0"
    }
