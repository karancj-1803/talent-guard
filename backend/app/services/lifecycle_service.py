import os
import json
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline

from app.config import settings
from app.services.dataset_service import DatasetService
from app.services.model_service import ModelService
from app.services.explanation_service import ExplanationService
from app.services.recommendation_service import RecommendationService
from app.services.persistence_service import PersistenceService

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_DIR = os.path.join(BACKEND_ROOT, "artifacts")
MODEL_FILE = os.path.join(ARTIFACTS_DIR, "model_pipeline.joblib")
METADATA_FILE = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
ARTIFACT_VERSION = "1.0.0"

_cached_model: Optional[Pipeline] = None
_cached_metadata: Optional[Dict[str, Any]] = None
_model_status: str = "uninitialized"
_model_error: Optional[str] = None


class LifecycleService:
    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        global _cached_model, _cached_metadata, _model_status, _model_error
        is_ready = _cached_model is not None and _model_status == "ready"
        return {
            "ready": is_ready,
            "status": _model_status,
            "version": ARTIFACT_VERSION,
            "run_id": _cached_metadata.get("run_id") if _cached_metadata else None,
            "metadata": _cached_metadata,
            "error": _model_error
        }

    @classmethod
    def get_loaded_pipeline(cls) -> Optional[Pipeline]:
        global _cached_model
        return _cached_model

    @classmethod
    def get_loaded_metadata(cls) -> Optional[Dict[str, Any]]:
        global _cached_metadata
        return _cached_metadata

    @classmethod
    def load_artifact(cls) -> Dict[str, Any]:
        """
        Loads the saved model artifact and metadata into memory without retraining.
        Reports missing or incompatible artifacts cleanly.
        """
        global _cached_model, _cached_metadata, _model_status, _model_error

        if not os.path.exists(MODEL_FILE) or not os.path.exists(METADATA_FILE):
            _cached_model = None
            _cached_metadata = None
            _model_status = "missing_artifact"
            _model_error = f"Model artifact files missing at {ARTIFACTS_DIR}. Run offline preparation first."
            return cls.get_status()

        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                meta = json.load(f)

            if meta.get("artifact_version") != ARTIFACT_VERSION:
                _cached_model = None
                _cached_metadata = meta
                _model_status = "incompatible_artifact"
                _model_error = f"Artifact version {meta.get('artifact_version')} is incompatible with engine version {ARTIFACT_VERSION}."
                return cls.get_status()

            pipeline = joblib.load(MODEL_FILE)
            if not hasattr(pipeline, "predict_proba"):
                _cached_model = None
                _cached_metadata = meta
                _model_status = "incompatible_artifact"
                _model_error = "Loaded model artifact does not implement predict_proba interface."
                return cls.get_status()

            _cached_model = pipeline
            _cached_metadata = meta
            _model_status = "ready"
            _model_error = None
            return cls.get_status()

        except Exception as e:
            _cached_model = None
            _cached_metadata = None
            _model_status = "load_error"
            _model_error = f"Failed to load model artifact: {str(e)}"
            return cls.get_status()

    @classmethod
    def prepare(
        cls,
        user_id: Optional[str] = None,
        test_size: float = 0.20,
        random_state: int = 42
    ) -> Dict[str, Any]:
        """
        Offline backend preparation entry point:
        1. Validates dataset
        2. Evaluates baseline model on stratified held-out split
        3. Fits production pipeline
        4. Generates Top-50 ranking and aligned employee explanations
        5. Persists run and employee records
        6. Saves versioned model artifact and metadata
        """
        global _cached_model, _cached_metadata, _model_status, _model_error
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)

        target_user_id = user_id or settings.DEFAULT_USER_ID

        # 1. Load and validate dataset
        raw_df = DatasetService.load_dataset()
        X, y, summary, excluded_cols = DatasetService.validate_and_prepare(raw_df)

        # 2. Evaluate baseline on held-out split
        metrics = ModelService.evaluate_baseline(
            X, y,
            test_size=test_size,
            random_state=random_state
        )

        # 3. Fit production pipeline
        pipeline, probabilities = ModelService.fit_production_model(
            X, y,
            random_state=random_state
        )

        # 4. Generate deterministic ranking & aligned employee records
        run_id = str(uuid.uuid4())
        raw_df["predicted_probability"] = probabilities
        raw_df["employee_key"] = raw_df.apply(
            lambda r: f"EMP-{int(r.get('EmployeeNumber', r.name + 1000)):04d}",
            axis=1
        )
        # Store original index to guarantee explanation alignment with X
        raw_df["_orig_idx"] = raw_df.index

        # Deterministic sort: descending probability, ascending employee key
        sorted_df = raw_df.sort_values(
            by=["predicted_probability", "employee_key"],
            ascending=[False, True]
        )
        top_50_df = sorted_df.head(50)

        employee_risk_records = []
        for rank_idx, (_, row) in enumerate(top_50_df.iterrows(), start=1):
            emp_key = row["employee_key"]
            emp_prob = float(row["predicted_probability"])
            emp_risk_id = str(uuid.uuid4())
            orig_idx = row["_orig_idx"]

            # Explanations: 3 model-derived reasons computed from the EXACT employee row
            row_predictors = X.loc[orig_idx]
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
                "stock_option_level": int(row.get("StockOptionLevel", 0)),
                "years_in_current_role": int(row.get("YearsInCurrentRole", 1)),
                "employee_name": f"Employee {emp_key}"
            }

            employee_risk_records.append({
                "id": emp_risk_id,
                "run_id": run_id,
                "employee_key": emp_key,
                "employee_name": attributes["employee_name"],
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

        # 5. Persist run and employee risks
        dataset_name = os.path.basename(settings.IBM_HR_DATASET_PATH)
        run_record = {
            "id": run_id,
            "dataset_name": dataset_name,
            "dataset_row_count": summary["row_count"],
            "dataset_column_count": summary["column_count"],
            "model_name": "logistic_regression",
            "status": "completed",
            "metrics": metrics,
            "validation_summary": summary,
            "excluded_columns": excluded_cols,
            "random_state": random_state,
            "test_size": test_size,
        }

        saved_run = PersistenceService.create_model_run(run_record, user_id=target_user_id)
        PersistenceService.save_employee_risks(employee_risk_records)

        # 6. Save model artifact and metadata
        joblib.dump(pipeline, MODEL_FILE)

        metadata = {
            "artifact_version": ARTIFACT_VERSION,
            "model_name": "logistic_regression",
            "run_id": run_id,
            "created_by": target_user_id,
            "created_at": saved_run.get("created_at", datetime.now(timezone.utc).isoformat()),
            "dataset_name": dataset_name,
            "dataset_summary": summary,
            "excluded_columns": excluded_cols,
            "metrics": metrics,
            "selected_count": len(employee_risk_records)
        }

        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        _cached_model = pipeline
        _cached_metadata = metadata
        _model_status = "ready"
        _model_error = None

        return {
            "status": "completed",
            "run_id": run_id,
            "metrics": metrics,
            "selected_count": len(employee_risk_records),
            "artifact_path": MODEL_FILE,
            "metadata_path": METADATA_FILE
        }
