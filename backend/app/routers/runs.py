import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.config import settings
from app.dependencies import get_current_user
from app.schemas import (
    CreateRunRequest,
    RunDetailResponse,
    ListRunsResponse,
    RunSummaryItem,
    DatasetSummary,
    ModelMetrics,
    UserProfile
)
from app.services.persistence_service import PersistenceService

router = APIRouter(prefix="/runs", tags=["Model Runs"])


@router.post("", response_model=RunDetailResponse, status_code=status.HTTP_403_FORBIDDEN)
async def create_model_run(
    payload: CreateRunRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Model training is removed from the normal HR-facing API workflow.
    Pre-trained artifacts and initial rankings must be prepared offline.
    """
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "TRAINING_DISABLED",
            "message": "Model training is disabled in the HR application workflow. Models and priority rankings must be prepared through the offline lifecycle pipeline."
        }
    )


@router.get("", response_model=ListRunsResponse)
async def list_runs(current_user: UserProfile = Depends(get_current_user)):
    runs = PersistenceService.list_runs(user_id=current_user.id)
    items = [
        RunSummaryItem(
            id=r["id"],
            status=r["status"],
            model_name=r.get("model_name", "logistic_regression"),
            selected_count=50,
            created_at=r["created_at"]
        )
        for r in runs
    ]
    return ListRunsResponse(items=items, total=len(items))


@router.get("/{run_id}", response_model=RunDetailResponse)
async def get_run_detail(run_id: str, current_user: UserProfile = Depends(get_current_user)):
    # Support 'latest' or 'default' run aliases
    if run_id in ("default", "latest"):
        runs = PersistenceService.list_runs(user_id=current_user.id)
        if not runs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RUN_NOT_FOUND",
                    "message": "No model run found for the authenticated user."
                }
            )
        run_id = runs[0]["id"]

    run = PersistenceService.get_run(run_id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "RUN_NOT_FOUND",
                "message": f"Model run with ID '{run_id}' was not found."
            }
        )

    val_summary = run.get("validation_summary") or {}
    metrics = run.get("metrics") or {}
    dataset_summary = run.get("dataset_summary") or {}

    return RunDetailResponse(
        id=run["id"],
        status=run["status"],
        dataset_summary=DatasetSummary(
            row_count=run.get("dataset_row_count", dataset_summary.get("row_count", val_summary.get("row_count", 1470))),
            column_count=run.get("dataset_column_count", dataset_summary.get("column_count", val_summary.get("column_count", 35))),
            attrition_yes=dataset_summary.get("attrition_yes", val_summary.get("attrition_yes", 237)),
            attrition_no=dataset_summary.get("attrition_no", val_summary.get("attrition_no", 1233))
        ),
        excluded_columns=run.get("excluded_columns", []),
        metrics=ModelMetrics(**metrics),
        selected_count=50,
        created_at=run["created_at"],
        validation_summary=val_summary
    )
