from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, average_precision_score


class ModelService:
    @staticmethod
    def train_and_evaluate(
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.20,
        random_state: int = 42
    ) -> Tuple[Pipeline, Dict[str, Any], np.ndarray, pd.DataFrame]:
        """
        Fits Logistic Regression on train split, evaluates on stratified test split,
        and generates full population attrition probabilities.
        """
        numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
        categorical_cols = [c for c in X.columns if c not in numeric_cols]

        # Build column transformer
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), numeric_cols),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols)
            ]
        )

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                random_state=random_state,
                solver="lbfgs"
            ))
        ])

        # Stratified Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            stratify=y,
            random_state=random_state
        )

        # Fit strictly on train split
        pipeline.fit(X_train, y_train)

        # Held-out evaluation
        test_probs = pipeline.predict_proba(X_test)[:, 1]
        roc_auc = float(roc_auc_score(y_test, test_probs))
        avg_precision = float(average_precision_score(y_test, test_probs))

        # Precision@50 and Recall@50 on held-out test cohort
        # If test set has >= 50 samples, evaluate top 50 in test split
        k = min(50, len(test_probs))
        top_k_indices = np.argsort(test_probs)[::-1][:k]
        top_k_actuals = y_test.iloc[top_k_indices]
        precision_at_k = float(top_k_actuals.sum() / k)
        total_positives = float(y_test.sum())
        recall_at_k = float(top_k_actuals.sum() / total_positives) if total_positives > 0 else 0.0

        metrics = {
            "roc_auc": round(roc_auc, 4),
            "average_precision": round(avg_precision, 4),
            "precision_at_50": round(precision_at_k, 4),
            "recall_at_50": round(recall_at_k, 4),
            "test_size": test_size,
            "random_state": random_state,
            "train_sample_count": len(X_train),
            "test_sample_count": len(X_test)
        }

        # Predict probabilities on full eligible population
        full_probabilities = pipeline.predict_proba(X)[:, 1]

        return pipeline, metrics, full_probabilities, X
