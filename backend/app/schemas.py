from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# Standard API Error Schema
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None
    request_id: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# Health & Auth Me Schemas
class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "TalentGuard API"
    version: str = "1.0.0"
    environment: str
    dataset_available: bool
    model_ready: bool = False
    model_status: str = "unknown"
    active_run_id: Optional[str] = None
    artifact_version: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str = "hr_manager"


# Run Creation & Summary Schemas
class CreateRunRequest(BaseModel):
    dataset_source: str = "bundled_ibm_hr"
    test_size: float = Field(default=0.20, gt=0.0, lt=1.0)
    random_state: int = Field(default=42)


class DatasetSummary(BaseModel):
    row_count: int
    column_count: int
    attrition_yes: int
    attrition_no: int


class ModelMetrics(BaseModel):
    roc_auc: Optional[float] = None
    average_precision: Optional[float] = None
    precision_at_50: Optional[float] = None
    recall_at_50: Optional[float] = None


class RunSummaryItem(BaseModel):
    id: str
    status: str
    model_name: str
    selected_count: int
    created_at: str


class ListRunsResponse(BaseModel):
    items: List[RunSummaryItem]
    total: int


class RunDetailResponse(BaseModel):
    id: str
    status: str
    dataset_summary: DatasetSummary
    excluded_columns: List[str]
    metrics: ModelMetrics
    selected_count: int
    created_at: str
    validation_summary: Optional[Dict[str, Any]] = None


# Explanations & Recommendations Schemas
class RiskReason(BaseModel):
    feature: str
    label: str
    observed_value: Any
    contribution: float
    direction: str = "increases"


class Recommendation(BaseModel):
    code: str
    title: str
    reason: str
    suggested_action: str


# Priorities & Employee Detail Schemas
class PriorityItem(BaseModel):
    id: str
    employee_key: str
    employee_name: Optional[str] = None
    risk_rank: int
    risk_probability: float
    department: str
    job_role: str
    overtime: str
    risk_reasons: List[RiskReason]
    review_status: str = "pending"


class PrioritiesResponse(BaseModel):
    run_id: str
    items: List[PriorityItem]
    total: int
    limit: int
    offset: int


class ReviewDetail(BaseModel):
    status: str = "pending"
    notes: Optional[str] = None
    updated_at: Optional[str] = None


class EmployeeDetailResponse(BaseModel):
    id: str
    run_id: str
    employee_key: str
    employee_name: Optional[str] = None
    risk_rank: int
    risk_probability: float
    department: str
    job_role: str
    overtime: str
    employee_attributes: Dict[str, Any]
    risk_reasons: List[RiskReason]
    recommendations: List[Recommendation] = []
    review: ReviewDetail


# HR Review Submission Schemas
class ReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|reviewed|action_planned|closed)$")
    notes: Optional[str] = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    employee_risk_id: str
    status: str
    notes: Optional[str] = None
    updated_at: str
