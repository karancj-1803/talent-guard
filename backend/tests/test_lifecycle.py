import os
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.lifecycle_service import (
    LifecycleService,
    MODEL_FILE,
    METADATA_FILE,
    ARTIFACT_VERSION
)


def test_lifecycle_offline_preparation_and_load():
    # Execute preparation
    prep_result = LifecycleService.prepare()
    assert prep_result["status"] == "completed"
    assert os.path.exists(MODEL_FILE)
    assert os.path.exists(METADATA_FILE)

    # Load artifact
    status = LifecycleService.load_artifact()
    assert status["ready"] is True
    assert status["status"] == "ready"
    assert status["version"] == ARTIFACT_VERSION
    assert status["run_id"] == prep_result["run_id"]


def test_missing_artifact_state(monkeypatch):
    # Temporarily point to a non-existent artifact path
    fake_path = "artifacts_non_existent/fake_model.joblib"
    monkeypatch.setattr("app.services.lifecycle_service.MODEL_FILE", fake_path)

    status = LifecycleService.load_artifact()
    assert status["ready"] is False
    assert status["status"] == "missing_artifact"
    assert "missing" in status["error"].lower()

    # Health check should report degraded
    with TestClient(app) as client:
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "degraded"
        assert data["model_ready"] is False
        assert data["model_status"] == "missing_artifact"


def test_incompatible_artifact_state(monkeypatch, tmp_path):
    # Create an incompatible metadata file with wrong version
    bad_meta_file = str(tmp_path / "bad_metadata.json")
    with open(bad_meta_file, "w", encoding="utf-8") as f:
        json.dump({"artifact_version": "99.0.0", "model_name": "legacy"}, f)

    monkeypatch.setattr("app.services.lifecycle_service.METADATA_FILE", bad_meta_file)

    status = LifecycleService.load_artifact()
    assert status["ready"] is False
    assert status["status"] == "incompatible_artifact"
