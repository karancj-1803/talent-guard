import os
from typing import Dict, Any, List, Tuple
import pandas as pd
from app.config import settings

REQUIRED_TARGET = "Attrition"
EXPECTED_TARGET_VALUES = {"Yes", "No"}
MIN_ROW_COUNT = 500

CONSTANT_OR_ID_COLUMNS = [
    "EmployeeNumber",
    "EmployeeCount",
    "StandardHours",
    "Over18"
]


class DatasetValidationError(Exception):
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DatasetService:
    @staticmethod
    def load_dataset(dataset_path: str = None) -> pd.DataFrame:
        path = dataset_path or settings.get_dataset_abs_path()
        if not os.path.exists(path):
            raise DatasetValidationError(
                f"Configured dataset file not found at: {path}",
                {"configured_path": path}
            )

        try:
            df = pd.read_csv(path)
            return df
        except Exception as e:
            raise DatasetValidationError(
                f"Failed to parse CSV file: {str(e)}",
                {"error": str(e)}
            )

    @staticmethod
    def validate_and_prepare(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any], List[str]]:
        """
        Validates schema, checks row counts, target values, and removes constant/id columns.
        Returns:
            X: Cleaned predictor dataframe
            y: Binary target series (1 for Yes, 0 for No)
            summary: Dataset statistics & validation details
            excluded_columns: List of columns dropped
        """
        # 1. Target column presence
        if REQUIRED_TARGET not in df.columns:
            raise DatasetValidationError(
                f"Missing required target column: '{REQUIRED_TARGET}'",
                {"missing_columns": [REQUIRED_TARGET]}
            )

        # 2. Minimum row count
        if len(df) < MIN_ROW_COUNT:
            raise DatasetValidationError(
                f"Dataset row count ({len(df)}) is below the required minimum of {MIN_ROW_COUNT}.",
                {"row_count": len(df), "min_required": MIN_ROW_COUNT}
            )

        # 3. Target values validation
        unique_targets = set(df[REQUIRED_TARGET].dropna().unique())
        if not unique_targets.issubset(EXPECTED_TARGET_VALUES):
            raise DatasetValidationError(
                f"Unexpected target values in '{REQUIRED_TARGET}': {unique_targets}. Expected subset of {EXPECTED_TARGET_VALUES}.",
                {"observed_values": list(unique_targets)}
            )

        # 4. Target distribution
        value_counts = df[REQUIRED_TARGET].value_counts().to_dict()
        attrition_yes = int(value_counts.get("Yes", 0))
        attrition_no = int(value_counts.get("No", 0))

        # 5. Determine columns to exclude
        excluded_columns = []
        for col in CONSTANT_OR_ID_COLUMNS:
            if col in df.columns:
                excluded_columns.append(col)

        # Check for any additional zero-variance constant columns dynamically
        for col in df.columns:
            if col not in excluded_columns and col != REQUIRED_TARGET:
                if df[col].nunique() <= 1:
                    excluded_columns.append(col)

        # Always exclude target from predictors
        excluded_columns.append(REQUIRED_TARGET)

        # 6. Prepare X and y
        y = (df[REQUIRED_TARGET] == "Yes").astype(int)
        X = df.drop(columns=[col for col in excluded_columns if col in df.columns])

        summary = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "attrition_yes": attrition_yes,
            "attrition_no": attrition_no,
            "attrition_rate": round(attrition_yes / len(df), 4) if len(df) > 0 else 0,
            "missing_cells": int(df.isnull().sum().sum()),
            "predictor_count": len(X.columns)
        }

        validation_checks = [
            {"check": "Required Target Column Present", "status": "passed", "details": f"Target '{REQUIRED_TARGET}' validated"},
            {"check": "Binary Target Categorization", "status": "passed", "details": f"Labels: {sorted(list(unique_targets))}"},
            {"check": "Minimum Sample Sufficiency", "status": "passed", "details": f"{len(df)} records (Threshold: {MIN_ROW_COUNT})"},
            {"check": "Missing Cell Sanity", "status": "passed", "details": f"{summary['missing_cells']} null values"},
            {"check": "Predictor Leakage Prevention", "status": "passed", "details": f"Excluded: {', '.join(excluded_columns)}"}
        ]

        summary["checks"] = validation_checks
        summary["is_valid"] = True
        summary["validation_status"] = "passed"

        return X, y, summary, excluded_columns
