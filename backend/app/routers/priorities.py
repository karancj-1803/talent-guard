from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas import (
    PrioritiesResponse,
    PriorityItem,
    EmployeeDetailResponse,
    RiskReason,
    Recommendation,
    ReviewDetail,
    UserProfile
)
from app.services.persistence_service import PersistenceService

router = APIRouter(tags=["Priorities & Employees"])


@router.get("/runs/{run_id}/priorities", response_model=PrioritiesResponse)
async def get_run_priorities(
    run_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: UserProfile = Depends(get_current_user)
):
    # Resolve 'default' or 'latest' run ID
    if run_id in ("default", "latest"):
        runs = PersistenceService.list_runs(user_id=current_user.id)
        if not runs:
            return PrioritiesResponse(
                run_id="none",
                items=[],
                total=0,
                limit=limit,
                offset=offset
            )
        run_id = runs[0]["id"]

    # Verify run exists
    run = PersistenceService.get_run(run_id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "RUN_NOT_FOUND",
                "message": f"Run with ID '{run_id}' not found."
            }
        )

    records, total = PersistenceService.get_priorities(
        run_id=run_id,
        limit=limit,
        offset=offset,
        search=search,
        department=department,
        status=status
    )

    items = []
    for r in records:
        reasons = [RiskReason(**reason) for reason in r.get("risk_reasons", [])]
        items.append(PriorityItem(
            id=r["id"],
            employee_key=r["employee_key"],
            employee_name=r.get("employee_name", f"Employee {r['employee_key']}"),
            risk_rank=r["risk_rank"],
            risk_probability=r["risk_probability"],
            department=r["department"],
            job_role=r["job_role"],
            overtime=r["overtime"],
            risk_reasons=reasons,
            review_status=r.get("review_status", "pending")
        ))

    return PrioritiesResponse(
        run_id=run_id,
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/runs/{run_id}/employees/{employee_risk_id}", response_model=EmployeeDetailResponse)
@router.get("/employees/{employee_risk_id}", response_model=EmployeeDetailResponse)
async def get_employee_detail(
    employee_risk_id: str,
    run_id: Optional[str] = "default",
    current_user: UserProfile = Depends(get_current_user)
):
    if run_id in ("default", "latest"):
        runs = PersistenceService.list_runs(user_id=current_user.id)
        if runs:
            run_id = runs[0]["id"]

    emp = PersistenceService.get_employee_detail(run_id=run_id, employee_risk_id=employee_risk_id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EMPLOYEE_NOT_FOUND",
                "message": f"Employee record '{employee_risk_id}' not found."
            }
        )

    reasons = [RiskReason(**reason) for reason in emp.get("risk_reasons", [])]
    recommendations = [Recommendation(**rec) for rec in emp.get("recommendations", [])]
    review_raw = emp.get("review", {})

    return EmployeeDetailResponse(
        id=emp["id"],
        run_id=emp["run_id"],
        employee_key=emp["employee_key"],
        employee_name=emp.get("employee_name", f"Employee {emp['employee_key']}"),
        risk_rank=emp["risk_rank"],
        risk_probability=emp["risk_probability"],
        department=emp["department"],
        job_role=emp["job_role"],
        overtime=emp["overtime"],
        employee_attributes=emp.get("employee_attributes", {}),
        risk_reasons=reasons,
        recommendations=recommendations,
        review=ReviewDetail(
            status=review_raw.get("status", "pending"),
            notes=review_raw.get("notes"),
            updated_at=review_raw.get("updated_at")
        )
    )
