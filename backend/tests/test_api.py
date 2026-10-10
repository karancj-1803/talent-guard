import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user
from app.schemas import UserProfile
from app.services.lifecycle_service import LifecycleService
from app.services.persistence_service import PersistenceService

# Test users
USER_A = UserProfile(
    id="0b491252-0c4a-44d8-870e-306ce3bbd6d8",
    email="elena.vance@technova.internal",
    display_name="Elena Vance",
    role="hr_manager"
)

USER_B = UserProfile(
    id="3a935cbb-8a67-40f6-a6c5-7b6cc06364cc",
    email="chandrabosekaran@gmail.com",
    display_name="Chandra Bose Karan",
    role="admin"
)

USER_UNAUTHORIZED = UserProfile(
    id="e9999999-9999-9999-9999-999999999999",
    email="unauthorized.user@technova.internal",
    display_name="Unauthorized User",
    role="hr_manager"
)


@pytest.fixture(autouse=True)
def ensure_prepared_model():
    """Ensures model artifact and database records are prepared before running tests."""
    LifecycleService.load_artifact()
    if not LifecycleService.get_status()["ready"]:
        LifecycleService.prepare(user_id=USER_A.id)


def test_health_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["dataset_available"] is True
        assert data["model_ready"] is True
        assert data["model_status"] == "ready"


def test_unauthenticated_request_rejected():
    with TestClient(app) as client:
        res = client.get("/api/v1/runs")
        assert res.status_code == 401
        err = res.json()["error"]
        assert err["code"] == "MISSING_TOKEN"


def test_invalid_token_rejected():
    with TestClient(app) as client:
        res = client.get("/api/v1/runs", headers={"Authorization": "Bearer definitely_invalid_token"})
        assert res.status_code == 401
        err = res.json()["error"]
        assert err["code"] == "INVALID_CREDENTIALS"


def test_mock_token_rejected():
    """Mock tokens must be rejected now that mock authentication fallbacks are removed."""
    with TestClient(app) as client:
        res = client.get("/api/v1/runs", headers={"Authorization": "Bearer mock_jwt_token_demo_hr_user"})
        assert res.status_code == 401
        err = res.json()["error"]
        assert err["code"] == "INVALID_CREDENTIALS"


def test_training_disabled_in_normal_hr_workflow():
    """Verify that POST /runs is disabled and does not retrain the model."""
    app.dependency_overrides[get_current_user] = lambda: USER_A
    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/v1/runs",
                json={"dataset_source": "bundled_ibm_hr", "test_size": 0.2, "random_state": 42}
            )
            assert res.status_code == 403
            err = res.json()["error"]
            assert err["code"] == "TRAINING_DISABLED"
    finally:
        app.dependency_overrides.clear()


def test_hr_workflow_flow():
    app.dependency_overrides[get_current_user] = lambda: USER_A
    try:
        with TestClient(app) as client:
            # 1. List runs
            list_res = client.get("/api/v1/runs")
            assert list_res.status_code == 200
            runs_data = list_res.json()
            assert runs_data["total"] >= 1
            run_id = runs_data["items"][0]["id"]

            # 2. Get run details
            detail_res = client.get(f"/api/v1/runs/{run_id}")
            assert detail_res.status_code == 200
            detail = detail_res.json()
            assert detail["id"] == run_id
            assert detail["selected_count"] == 50
            assert detail["metrics"]["roc_auc"] > 0.70

            # 3. Get Top-50 priorities
            prio_res = client.get(f"/api/v1/runs/{run_id}/priorities")
            assert prio_res.status_code == 200
            priorities = prio_res.json()["items"]
            assert len(priorities) == 50

            # Strictly descending probability check
            probs = [p["risk_probability"] for p in priorities]
            assert probs == sorted(probs, reverse=True)

            # Check top employee has exactly 3 reasons and rank 1
            top_emp = priorities[0]
            assert top_emp["risk_rank"] == 1
            assert len(top_emp["risk_reasons"]) == 3

            # 4. Get employee detail using direct /employees/{id} endpoint without run_id
            emp_res = client.get(f"/api/v1/employees/{top_emp['id']}")
            assert emp_res.status_code == 200
            emp_detail = emp_res.json()
            assert emp_detail["id"] == top_emp["id"]
            assert len(emp_detail["risk_reasons"]) == 3
            assert len(emp_detail["recommendations"]) == 3  # Rank 1 gets 3 recommendations

            # 5. Save HR review
            review_res = client.put(
                f"/api/v1/employee-risks/{top_emp['id']}/review",
                json={"status": "action_planned", "notes": "Retention conversation scheduled with VP."}
            )
            assert review_res.status_code == 200
            review_data = review_res.json()
            assert review_data["status"] == "action_planned"
            assert review_data["employee_risk_id"] == top_emp["id"]

            # 6. Reject invalid review status
            invalid_res = client.put(
                f"/api/v1/employee-risks/{top_emp['id']}/review",
                json={"status": "invalid_status", "notes": "Test"}
            )
            assert invalid_res.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_authorization_ownership_enforcement():
    """Verify that a user cannot access another user's runs, employee records, or reviews."""
    app.dependency_overrides[get_current_user] = lambda: USER_UNAUTHORIZED
    try:
        with TestClient(app) as client:
            # Unauthorized user should see 0 runs
            res = client.get("/api/v1/runs")
            assert res.status_code == 200
            assert res.json()["total"] == 0

            # Unauthorized user querying non-owned run priorities gets 404
            fake_or_other_run = "686afc60-18dc-416a-ac72-3180ceb1cf9d"
            res = client.get(f"/api/v1/runs/{fake_or_other_run}/priorities")
            assert res.status_code == 404
            assert res.json()["error"]["code"] == "RUN_NOT_FOUND"

            # Unauthorized user reviewing an employee gets 404
            res = client.put(
                "/api/v1/employee-risks/b0000000-0000-0000-0000-000000000001/review",
                json={"status": "reviewed", "notes": "Unauthorized attempt"}
            )
            assert res.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_supabase_unavailable_does_not_silently_fallback(monkeypatch):
    """
    Verify that when Supabase fails and USE_LOCAL_STORAGE=False,
    the system raises an explicit database error rather than silently saving to local JSON.
    """
    # Simulate Supabase client failing or missing
    monkeypatch.setattr("app.services.persistence_service.get_supabase_client", lambda: None)
    monkeypatch.setattr("app.services.persistence_service.settings.USE_LOCAL_STORAGE", False)

    with pytest.raises(RuntimeError) as exc_info:
        PersistenceService.create_model_run({
            "id": "test-failure-run",
            "dataset_name": "test.csv",
            "dataset_row_count": 100,
            "dataset_column_count": 10
        }, user_id=USER_A.id)

    assert "Supabase client is not configured or unavailable" in str(exc_info.value)

