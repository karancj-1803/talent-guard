import pytest
from app.services.dataset_service import DatasetService
from app.services.model_service import ModelService
from app.services.explanation_service import ExplanationService
from app.services.recommendation_service import RecommendationService


def test_model_training_and_metrics():
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)

    pipeline, metrics, full_probs, X_clean = ModelService.train_and_evaluate(
        X, y,
        test_size=0.20,
        random_state=42
    )

    # Validate metric bounds and calculation
    assert "roc_auc" in metrics
    assert metrics["roc_auc"] > 0.70  # Baseline should comfortably beat chance
    assert 0.0 <= metrics["roc_auc"] <= 1.0

    assert "average_precision" in metrics
    assert metrics["average_precision"] > 0.30

    assert "precision_at_50" in metrics
    assert 0.0 <= metrics["precision_at_50"] <= 1.0

    assert "recall_at_50" in metrics
    assert 0.0 <= metrics["recall_at_50"] <= 1.0

    assert len(full_probs) == 1470
    assert np_all_probs_valid(full_probs)


def np_all_probs_valid(probs):
    return all(0.0 <= p <= 1.0 for p in probs)


def test_explanation_generation():
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)
    pipeline, _, _, X_clean = ModelService.train_and_evaluate(X, y)

    first_row = X_clean.iloc[0]
    explanations = ExplanationService.compute_employee_explanations(pipeline, first_row, top_k=3)

    assert len(explanations) == 3
    for exp in explanations:
        assert "feature" in exp
        assert "label" in exp
        assert "observed_value" in exp
        assert "contribution" in exp
        assert exp["direction"] in ("increases", "decreases")


def test_recommendation_rules():
    df = DatasetService.load_dataset()
    overtime_row = df[df["OverTime"] == "Yes"].iloc[0]

    # Rank 1 employee must receive exactly 3 recommendations
    recs_rank_1 = RecommendationService.generate_recommendations(overtime_row, rank=1)
    assert len(recs_rank_1) == 3
    assert any(r["code"] == "workload_review" for r in recs_rank_1)

    # Rank 15 employee must receive empty list
    recs_rank_15 = RecommendationService.generate_recommendations(overtime_row, rank=15)
    assert len(recs_rank_15) == 0
