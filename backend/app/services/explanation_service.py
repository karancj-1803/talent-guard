from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline


FEATURE_LABELS = {
    "OverTime": "Frequent Overtime",
    "JobSatisfaction": "Job Satisfaction",
    "YearsAtCompany": "Tenure at Company",
    "MonthlyIncome": "Monthly Income Level",
    "DistanceFromHome": "Commute Distance",
    "WorkLifeBalance": "Work-Life Balance Score",
    "EnvironmentSatisfaction": "Workplace Environment Satisfaction",
    "Age": "Employee Age",
    "TotalWorkingYears": "Total Career Experience",
    "StockOptionLevel": "Equity Incentive Level",
    "JobInvolvement": "Job Involvement Level",
    "YearsInCurrentRole": "Time in Current Role",
    "YearsWithCurrManager": "Tenure with Immediate Manager",
    "NumCompaniesWorked": "Prior Company History",
    "MaritalStatus": "Marital Status",
    "BusinessTravel": "Travel Frequency",
    "Department": "Department",
    "JobRole": "Job Role"
}


class ExplanationService:
    @staticmethod
    def get_feature_names(pipeline: Pipeline) -> List[str]:
        preprocessor = pipeline.named_steps["preprocessor"]
        return list(preprocessor.get_feature_names_out())

    @staticmethod
    def compute_employee_explanations(
        pipeline: Pipeline,
        X_employee_row: pd.Series,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Computes the top_k feature contributions (beta_j * x_j) that increase attrition probability.
        """
        preprocessor = pipeline.named_steps["preprocessor"]
        classifier = pipeline.named_steps["classifier"]
        
        feature_names = preprocessor.get_feature_names_out()
        coefficients = classifier.coef_[0]

        # Transform single row
        row_df = pd.DataFrame([X_employee_row])
        transformed_row = preprocessor.transform(row_df)[0]

        # Calculate contributions
        contributions = coefficients * transformed_row

        # Find features that increase risk (positive contribution to log-odds)
        indices = np.argsort(contributions)[::-1]

        reasons = []
        for idx in indices:
            raw_feat_name = feature_names[idx]
            contrib_val = float(contributions[idx])
            
            # Map back to raw column name and observed value
            # e.g., 'cat__OverTime_Yes' -> 'OverTime', 'num__MonthlyIncome' -> 'MonthlyIncome'
            clean_name = raw_feat_name
            if "__" in clean_name:
                clean_name = clean_name.split("__", 1)[1]

            base_col = clean_name
            if "_" in clean_name and any(col in clean_name for col in X_employee_row.index):
                for orig in X_employee_row.index:
                    if clean_name.startswith(orig):
                        base_col = orig
                        break

            observed_val = X_employee_row.get(base_col, "Observed")
            # Format display value
            if isinstance(observed_val, float):
                disp_val = round(observed_val, 2)
            elif isinstance(observed_val, int):
                disp_val = observed_val
            else:
                disp_val = str(observed_val)

            label = FEATURE_LABELS.get(base_col, base_col.replace("_", " "))

            # Direction is 'increases' if contrib_val > 0 else 'decreases'
            direction = "increases" if contrib_val >= 0 else "decreases"

            # Avoid duplicates of the same base column in top 3
            if not any(r["feature"] == clean_name or r["label"] == label for r in reasons):
                reasons.append({
                    "feature": clean_name,
                    "label": label,
                    "observed_value": disp_val,
                    "contribution": round(contrib_val, 3),
                    "direction": direction
                })

            if len(reasons) >= top_k:
                break

        # If fewer than top_k positive, fill with highest magnitude
        if len(reasons) < top_k:
            for idx in np.argsort(np.abs(contributions))[::-1]:
                raw_feat_name = feature_names[idx]
                contrib_val = float(contributions[idx])
                clean_name = raw_feat_name.split("__", 1)[1] if "__" in raw_feat_name else raw_feat_name
                base_col = clean_name
                for orig in X_employee_row.index:
                    if clean_name.startswith(orig):
                        base_col = orig
                        break
                label = FEATURE_LABELS.get(base_col, base_col)
                if not any(r["label"] == label for r in reasons):
                    reasons.append({
                        "feature": clean_name,
                        "label": label,
                        "observed_value": str(X_employee_row.get(base_col, "Observed")),
                        "contribution": round(contrib_val, 3),
                        "direction": "increases" if contrib_val >= 0 else "decreases"
                    })
                if len(reasons) >= top_k:
                    break

        return reasons[:top_k]
