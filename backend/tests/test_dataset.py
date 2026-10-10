import pytest
import pandas as pd
from app.services.dataset_service import DatasetService, DatasetValidationError


def test_dataset_loading_and_shape():
    df = DatasetService.load_dataset()
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1470
    assert "Attrition" in df.columns


def test_dataset_validation_success():
    df = DatasetService.load_dataset()
    X, y, summary, excluded = DatasetService.validate_and_prepare(df)
    
    assert summary["is_valid"] is True
    assert summary["row_count"] == 1470
    assert summary["attrition_yes"] == 237
    assert summary["attrition_no"] == 1233
    assert y.sum() == 237
    
    # Check that required columns were excluded
    for col in ["EmployeeNumber", "EmployeeCount", "StandardHours", "Over18", "Attrition"]:
        assert col in excluded
        assert col not in X.columns


def test_dataset_validation_missing_target():
    df = pd.DataFrame({"Age": [30, 40], "DailyRate": [100, 200]})
    with pytest.raises(DatasetValidationError) as exc:
        DatasetService.validate_and_prepare(df)
    assert "Missing required target column" in str(exc.value)


def test_dataset_validation_low_row_count():
    df = pd.DataFrame({"Attrition": ["Yes", "No"], "Age": [30, 40]})
    with pytest.raises(DatasetValidationError) as exc:
        DatasetService.validate_and_prepare(df)
    assert "below the required minimum" in str(exc.value)
