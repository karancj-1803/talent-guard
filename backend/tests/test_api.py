import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

AUTH_HEADER = {"Authorization": "Bearer mock_jwt_token_demo_hr_user"}


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["dataset_available"] is True


def test_unauthenticated_request_rejected():
    res = client.get("/api/v1/runs")
    assert res.status_code == 401
    err = res.json()["error"]
    assert err["code"] == "MISSING_TOKEN"


def test_invalid_token_rejected():
    res = client.get("/api/v1/runs", headers={"Authorization": "Bearer definitely_invalid_token"})
    assert res.status_code == 401
    err = res.json()["error"]
    assert err["code"] == "INVALID_CREDENTIALS"


def test_create_and_query_run_flow():
    # 1. Create a run
    res = client.post(
        "/api/v1/runs",
        headers=AUTH_HEADER,
        json={"dataset_source": "bundled_ibm_hr", "test_size": 0.2, "random_state": 42}
    )
    assert res.status_code == 201
    run_data = res.json()
    assert "id" in run_data
    run_id = run_data["id"]
    assert run_data["status"] == "completed"
    assert run_data["selected_count"] == 50
    assert run_data["metrics"]["roc_auc"] > 0.70

    # 2. List runs
    list_res = client.get("/api/v1/runs", headers=AUTH_HEADER)
    assert list_res.status_code == 200
    runs = list_res.json()["items"]
    assert any(r["id"] == run_id for r in runs)

    # 3. Get run details
    detail_res = client.get(f"/api/v1/runs/{run_id}", headers=AUTH_HEADER)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == run_id

    # 4. Get priorities
    prio_res = client.get(f"/api/v1/runs/{run_id}/priorities", headers=AUTH_HEADER)
    assert prio_res.status_code == 200
    priorities = prio_res.json()["items"]
    assert len(priorities) == 50
    # Check strictly descending probability
    probs = [p["risk_probability"] for p in priorities]
    assert probs == sorted(probs, reverse=True)

    # Check top employee has 3 reasons
    top_emp = priorities[0]
    assert len(top_emp["risk_reasons"]) == 3
    assert top_emp["risk_rank"] == 1

    # 5. Get employee detail
    emp_res = client.get(f"/api/v1/runs/{run_id}/employees/{top_emp['id']}", headers=AUTH_HEADER)
    assert emp_res.status_code == 200
    emp_detail = emp_res.json()
    assert len(emp_detail["recommendations"]) == 3
    assert len(emp_detail["risk_reasons"]) == 3

    # 6. Save HR review
    review_res = client.put(
        f"/api/v1/employee-risks/{top_emp['id']}/review",
        headers=AUTH_HEADER,
        json={"status": "action_planned", "notes": "Initiated stay interview with department director."}
    )
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["status"] == "action_planned"
    assert rev_data["employee_risk_id"] == top_emp["id"]

    # 7. Invalid review status rejected
    invalid_res = client.put(
        f"/api/v1/employee-risks/{top_emp['id']}/review",
        headers=AUTH_HEADER,
        json={"status": "invalid_status", "notes": "Test note"}
    )
    assert invalid_res.status_code == 422
