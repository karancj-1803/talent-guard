import pytest
import numpy as np
import pandas as pd
from app.services.dataset_service import DatasetService
from app.services.model_service import ModelService
from app.services.explanation_service import ExplanationService
from app.services.recommendation_service import RecommendationService


def np_all_probs_valid(probs):
    return all(0.0 <= p <= 1.0 for p in probs)


def test_baseline_evaluation_separated_from_production():
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)

    # 1. Baseline evaluation
    metrics = ModelService.evaluate_baseline(
        X, y,
        test_size=0.20,
        random_state=42
    )

    assert "roc_auc" in metrics
    assert metrics["roc_auc"] > 0.70
    assert 0.0 <= metrics["roc_auc"] <= 1.0

    assert "average_precision" in metrics
    assert metrics["average_precision"] > 0.30

    assert "precision_at_50" in metrics
    assert 0.0 <= metrics["precision_at_50"] <= 1.0

    assert "recall_at_50" in metrics
    assert 0.0 <= metrics["recall_at_50"] <= 1.0

    assert metrics["positive_class"] == "Attrition=Yes"
    assert metrics["evaluation_population"] == "held_out_test_split"
    assert metrics["test_sample_count"] == 294

    # 2. Production model fitting
    prod_pipeline, full_probs = ModelService.fit_production_model(X, y, random_state=42)
    assert len(full_probs) == 1470
    assert np_all_probs_valid(full_probs)


def test_explanation_generation_and_exact_three_reasons():
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)
    pipeline, full_probs = ModelService.fit_production_model(X, y)

    # Test multiple diverse employee rows to guarantee exactly 3 reasons every time
    for idx in [0, 10, 50, 100, 500, 1000]:
        row = X.iloc[idx]
        explanations = ExplanationService.compute_employee_explanations(pipeline, row, top_k=3)

        assert len(explanations) == 3
        # Check all features are unique
        labels = [e["label"] for e in explanations]
        assert len(set(labels)) == 3

        for exp in explanations:
            assert "feature" in exp
            assert "label" in exp
            assert "observed_value" in exp
            assert "contribution" in exp
            assert exp["direction"] in ("increases", "decreases")


def test_explanation_alignment_after_sorting():
    """
    Regression test: Verifies that sorting does NOT cause employee-row misalignment.
    The explanation computed for a sorted candidate must match the candidate's actual features.
    """
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)
    pipeline, full_probs = ModelService.fit_production_model(X, y)

    df["predicted_probability"] = full_probs
    df["employee_key"] = df.apply(
        lambda r: f"EMP-{int(r.get('EmployeeNumber', r.name + 1000)):04d}",
        axis=1
    )
    df["_orig_idx"] = df.index

    # Sort descending
    sorted_df = df.sort_values(
        by=["predicted_probability", "employee_key"],
        ascending=[False, True]
    )

    top_emp = sorted_df.iloc[0]
    orig_idx = top_emp["_orig_idx"]
    row_predictors = X.loc[orig_idx]

    # Compute explanations from the correctly aligned predictors
    reasons = ExplanationService.compute_employee_explanations(pipeline, row_predictors, top_k=3)
    assert len(reasons) == 3

    # If the top employee works OverTime='Yes', overtime should be accurately reflected
    if top_emp["OverTime"] == "Yes":
        assert row_predictors["OverTime"] == "Yes"
        overtime_reason = next((r for r in reasons if r["feature"] == "OverTime_Yes"), None)
        if overtime_reason:
            assert overtime_reason["observed_value"] == "Yes"
            assert overtime_reason["direction"] == "increases"


def test_recommendation_rules():
    df = DatasetService.load_dataset()

    # Test Rule 1: Overtime
    overtime_row = df[df["OverTime"] == "Yes"].iloc[0]
    recs_rank_1 = RecommendationService.generate_recommendations(overtime_row, rank=1)
    assert len(recs_rank_1) == 3
    assert any(r["code"] == "workload_review" for r in recs_rank_1)

    # Test Rule 2: Low Job Satisfaction
    low_sat_row = df[df["JobSatisfaction"] <= 2].iloc[0]
    recs_sat = RecommendationService.generate_recommendations(low_sat_row, rank=2)
    assert len(recs_sat) == 3
    assert any(r["code"] == "engagement_dialogue" for r in recs_sat)

    # Test Rule 3: Low Monthly Income
    low_income_row = df[df["MonthlyIncome"] < 4500].iloc[0]
    recs_income = RecommendationService.generate_recommendations(low_income_row, rank=3)
    assert len(recs_income) == 3
    assert any(r["code"] == "compensation_parity" for r in recs_income)

    # Rank > 10 employee must receive empty list
    recs_rank_15 = RecommendationService.generate_recommendations(overtime_row, rank=15)
    assert len(recs_rank_15) == 0
