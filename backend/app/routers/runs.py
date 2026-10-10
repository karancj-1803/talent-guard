    
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
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
from app.services.dataset_service import DatasetService, DatasetValidationError
from app.services.model_service import ModelService
from app.services.explanation_service import ExplanationService
from app.services.recommendation_service import RecommendationService
from app.services.persistence_service import PersistenceService

router = APIRouter(prefix="/runs", tags=["Model Runs"])


@router.post("", response_model=RunDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_model_run(
    payload: CreateRunRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    try:
        # 1. Load and validate dataset
        raw_df = DatasetService.load_dataset()
        X, y, summary, excluded_cols = DatasetService.validate_and_prepare(raw_df)

        # 2. Train and evaluate Logistic Regression model
        pipeline, metrics, probabilities, X_clean = ModelService.train_and_evaluate(
            X, y,
            test_size=payload.test_size,
            random_state=payload.random_state
        )

        run_id = str(uuid.uuid4())

        # 3. Score, rank, and select exactly Top 50
        raw_df["predicted_probability"] = probabilities
        # Create deterministic employee key
        raw_df["employee_key"] = raw_df.apply(
            lambda r: f"EMP-{int(r.get('EmployeeNumber', r.name + 1000)):04d}",
            axis=1
        )

        # Sort descending by probability with deterministic tie-breaker
        sorted_df = raw_df.sort_values(
            by=["predicted_probability", "employee_key"],
            ascending=[False, True]
        ).reset_index(drop=True)

        top_50_df = sorted_df.head(50)

        # Generate employee risk records
        employee_risk_records = []
        for rank_idx, (_, row) in enumerate(top_50_df.iterrows(), start=1):
            emp_key = row["employee_key"]
            emp_prob = float(row["predicted_probability"])
            emp_risk_id = str(uuid.uuid4())

            # Explanations: 3 model-derived reasons
            row_predictors = X_clean.loc[row.name] if row.name in X_clean.index else X_clean.iloc[rank_idx - 1]
            reasons = ExplanationService.compute_employee_explanations(pipeline, row_predictors, top_k=3)

            # Recommendations: 3 rules for ranks 1-10
            recommendations = RecommendationService.generate_recommendations(row, rank=rank_idx)

            attributes = {
                "department": str(row.get("Department", "General")),
                "job_role": str(row.get("JobRole", "Specialist")),
                "overtime": str(row.get("OverTime", "No")),
                "years_at_company": int(row.get("YearsAtCompany", 1)),
                "job_satisfaction": int(row.get("JobSatisfaction", 3)),
                "monthly_income": int(row.get("MonthlyIncome", 5000)),
                "work_life_balance": int(row.get("WorkLifeBalance", 3)),
                "environment_satisfaction": int(row.get("EnvironmentSatisfaction", 3)),
                "total_working_years": int(row.get("TotalWorkingYears", 5)),
                "stock_option_level": int(row.get("StockOptionLevel", 0))
            }

            employee_risk_records.append({
                "id": emp_risk_id,
                "run_id": run_id,
                "employee_key": emp_key,
                "employee_name": f"Employee {emp_key}",
                "risk_rank": rank_idx,
                "risk_probability": round(emp_prob, 4),
                "department": attributes["department"],
                "job_role": attributes["job_role"],
                "overtime": attributes["overtime"],
                "employee_attributes": attributes,
                "risk_reasons": reasons,
                "recommendations": recommendations,
                "review_status": "pending"
            })

        # 4. Persist run and risks
        run_record = {
            "id": run_id,
            "dataset_name": payload.dataset_source,
            "dataset_row_count": summary["row_count"],
            "dataset_column_count": summary["column_count"],
            "model_name": "logistic_regression",
            "status": "completed",
            "metrics": metrics,
            "validation_summary": summary,
            "excluded_columns": excluded_cols,
            "random_state": payload.random_state,
            "test_size": payload.test_size,
        }

        saved_run = PersistenceService.create_model_run(run_record, user_id=current_user.id)
        PersistenceService.save_employee_risks(employee_risk_records)

        return RunDetailResponse(
            id=saved_run["id"],
            status=saved_run["status"],
            dataset_summary=DatasetSummary(
                row_count=summary["row_count"],
                column_count=summary["column_count"],
                attrition_yes=summary["attrition_yes"],
                attrition_no=summary["attrition_no"]
            ),
            excluded_columns=saved_run["excluded_columns"],
            metrics=ModelMetrics(**saved_run["metrics"]),
            selected_count=len(employee_risk_records),
            created_at=saved_run["created_at"],
            validation_summary=saved_run.get("validation_summary")
        )

    except DatasetValidationError as dve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": dve.message,
                "details": dve.details
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PIPELINE_ERROR",
                "message": f"ML pipeline execution encountered an unexpected error: {str(e)}"
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
    run = PersistenceService.get_run(run_id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "RUN_NOT_FOUND",
                "message": f"Model run with ID '{run_id}' was not found."
            }
        )

    val_summary = run.get("validation_summary", {})
    return RunDetailResponse(
        id=run["id"],
        status=run["status"],
        dataset_summary=DatasetSummary(
            row_count=run.get("dataset_row_count", val_summary.get("row_count", 1470)),
            column_count=run.get("dataset_column_count", val_summary.get("column_count", 35)),
            attrition_yes=val_summary.get("attrition_yes", 237),
            attrition_no=val_summary.get("attrition_no", 1233)
        ),
        excluded_columns=run.get("excluded_columns", []),
        metrics=ModelMetrics(**run.get("metrics", {})),
        selected_count=50,
        created_at=run["created_at"],
        validation_summary=val_summary
    )
