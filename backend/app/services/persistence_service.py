import os
import json
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from app.auth import get_supabase_client
from app.config import settings

# Local storage fallback directory for explicit local testing & development only
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage_data")
os.makedirs(STORAGE_DIR, exist_ok=True)
LOCAL_DB_FILE = os.path.join(STORAGE_DIR, "local_db.json")


def _load_local_db() -> Dict[str, Any]:
    if os.path.exists(LOCAL_DB_FILE):
        try:
            with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "model_runs": [],
        "employee_risks": [],
        "hr_reviews": {}
    }


def _save_local_db(data: Dict[str, Any]):
    try:
        with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Local storage save error: {e}")


def _format_risk_record(emp: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures workforce attributes are populated from employee_attributes if needed."""
    formatted = dict(emp)
    attrs = formatted.get("employee_attributes") or {}
    if not isinstance(attrs, dict):
        attrs = {}
    formatted["employee_attributes"] = attrs
    formatted["department"] = formatted.get("department") or attrs.get("department", "General")
    formatted["job_role"] = formatted.get("job_role") or attrs.get("job_role", "Specialist")
    formatted["overtime"] = formatted.get("overtime") or attrs.get("overtime", "No")
    formatted["employee_name"] = formatted.get("employee_name") or attrs.get("employee_name", f"Employee {formatted['employee_key']}")
    return formatted


class PersistenceService:
    @staticmethod
    def create_model_run(run_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        run_id = run_data.get("id") or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        record = {
            "id": run_id,
            "created_by": user_id,
            "dataset_name": run_data["dataset_name"],
            "dataset_row_count": run_data["dataset_row_count"],
            "dataset_column_count": run_data["dataset_column_count"],
            "model_name": run_data.get("model_name", "logistic_regression"),
            "status": run_data.get("status", "completed"),
            "metrics": run_data.get("metrics", {}),
            "validation_summary": run_data.get("validation_summary", {}),
            "excluded_columns": run_data.get("excluded_columns", []),
            "random_state": run_data.get("random_state", 42),
            "test_size": run_data.get("test_size", 0.2),
            "error_message": run_data.get("error_message"),
            "created_at": now_iso
        }

        # Use Supabase by default unless explicitly configured for local storage
        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                res = client.table("model_runs").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                raise RuntimeError("Supabase model_runs insert returned empty data.")
            except Exception as e:
                raise RuntimeError(f"Supabase model_runs creation failed: {e}")

        # Explicit local storage
        db = _load_local_db()
        db["model_runs"].insert(0, record)
        _save_local_db(db)
        return record

    @staticmethod
    def save_employee_risks(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not records:
            return []

        # Prepare records conforming strictly to public.employee_risks schema
        clean_records = []
        for r in records:
            attrs = dict(r.get("employee_attributes") or {})
            if "department" in r and "department" not in attrs:
                attrs["department"] = r["department"]
            if "job_role" in r and "job_role" not in attrs:
                attrs["job_role"] = r["job_role"]
            if "overtime" in r and "overtime" not in attrs:
                attrs["overtime"] = r["overtime"]
            if "employee_name" in r and "employee_name" not in attrs:
                attrs["employee_name"] = r["employee_name"]

            clean_records.append({
                "id": r.get("id") or str(uuid.uuid4()),
                "run_id": r["run_id"],
                "employee_key": r["employee_key"],
                "risk_rank": r["risk_rank"],
                "risk_probability": float(r["risk_probability"]),
                "employee_attributes": attrs,
                "risk_reasons": r.get("risk_reasons", []),
                "recommendations": r.get("recommendations", [])
            })

        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                # Delete existing risks for this run if any to prevent duplicate rank collisions
                run_id = clean_records[0]["run_id"]
                try:
                    client.table("employee_risks").delete().eq("run_id", run_id).execute()
                except Exception:
                    pass

                res = client.table("employee_risks").insert(clean_records).execute()
                if res.data:
                    return [_format_risk_record(rec) for rec in res.data]
                return [_format_risk_record(rec) for rec in clean_records]
            except Exception as e:
                raise RuntimeError(f"Supabase employee_risks persistence failed: {e}")

        # Explicit local storage fallback
        db = _load_local_db()
        run_id = clean_records[0]["run_id"]
        db["employee_risks"] = [r for r in db["employee_risks"] if r.get("run_id") != run_id]
        db["employee_risks"].extend(clean_records)
        _save_local_db(db)
        return [_format_risk_record(rec) for rec in clean_records]

    @staticmethod
    def list_runs(user_id: str) -> List[Dict[str, Any]]:
        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                res = client.table("model_runs").select("*").eq("created_by", user_id).order("created_at", desc=True).execute()
                if res.data is not None:
                    return res.data
                return []
            except Exception as e:
                raise RuntimeError(f"Supabase list_runs failed: {e}")

        db = _load_local_db()
        runs = [r for r in db["model_runs"] if r.get("created_by") == user_id]
        return runs

    @staticmethod
    def get_run(run_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                res = client.table("model_runs").select("*").eq("id", run_id).eq("created_by", user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                raise RuntimeError(f"Supabase get_run failed: {e}")

        db = _load_local_db()
        for r in db["model_runs"]:
            if r["id"] == run_id and r.get("created_by") == user_id:
                return r
        return None

    @staticmethod
    def get_priorities(
        run_id: str,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        # Enforce run ownership before returning priorities
        run = PersistenceService.get_run(run_id=run_id, user_id=user_id)
        if not run:
            return [], 0

        risks = []
        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                query = client.table("employee_risks").select("*, hr_reviews(*)").eq("run_id", run_id).order("risk_rank")
                res = query.execute()
                if res.data:
                    for row in res.data:
                        formatted = _format_risk_record(row)
                        revs = row.get("hr_reviews")
                        if revs and len(revs) > 0:
                            formatted["review_status"] = revs[0].get("status", "pending")
                            formatted["review"] = revs[0]
                        else:
                            formatted["review_status"] = "pending"
                            formatted["review"] = {"status": "pending", "notes": None, "updated_at": None}
                        risks.append(formatted)
            except Exception as e:
                raise RuntimeError(f"Supabase get_priorities failed: {e}")
        else:
            db = _load_local_db()
            raw_risks = [r for r in db["employee_risks"] if r.get("run_id") == run_id]
            reviews = db.get("hr_reviews", {})
            for r in raw_risks:
                formatted = _format_risk_record(r)
                emp_id = formatted["id"]
                if emp_id in reviews:
                    formatted["review_status"] = reviews[emp_id].get("status", "pending")
                    formatted["review"] = reviews[emp_id]
                else:
                    formatted["review_status"] = "pending"
                    formatted["review"] = {"status": "pending", "notes": None, "updated_at": None}
                risks.append(formatted)

        # In-memory filtering
        if search and search.strip():
            q = search.lower().strip()
            risks = [
                r for r in risks if
                q in r.get("employee_key", "").lower() or
                q in r.get("employee_name", "").lower() or
                q in r.get("job_role", "").lower() or
                q in r.get("department", "").lower()
            ]

        if department and department != "all":
            risks = [r for r in risks if r.get("department") == department]

        if status and status != "all":
            risks = [r for r in risks if r.get("review_status") == status]

        total = len(risks)
        paged = risks[offset : offset + limit]
        return paged, total

    @staticmethod
    def get_employee_detail(
        run_id: Optional[str],
        employee_risk_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        emp = None
        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                # Query by id or employee_key
                query = client.table("employee_risks").select("*, hr_reviews(*)").eq("id", employee_risk_id)
                res = query.execute()
                if not res.data:
                    query = client.table("employee_risks").select("*, hr_reviews(*)").eq("employee_key", employee_risk_id)
                    res = query.execute()

                if res.data and len(res.data) > 0:
                    emp = _format_risk_record(res.data[0])
                    revs = emp.get("hr_reviews")
                    if revs and len(revs) > 0:
                        emp["review"] = revs[0]
                    else:
                        emp["review"] = {"status": "pending", "notes": None, "updated_at": None}
            except Exception as e:
                raise RuntimeError(f"Supabase get_employee_detail failed: {e}")
        else:
            db = _load_local_db()
            for r in db["employee_risks"]:
                if r["id"] == employee_risk_id or r["employee_key"] == employee_risk_id:
                    emp = _format_risk_record(r)
                    reviews = db.get("hr_reviews", {})
                    emp_id = emp["id"]
                    if emp_id in reviews:
                        emp["review"] = reviews[emp_id]
                    else:
                        emp["review"] = {"status": "pending", "notes": None, "updated_at": None}
                    break

        if not emp:
            return None

        # Verify ownership: check that the employee's run is owned by user_id
        emp_run_id = emp.get("run_id")
        run = PersistenceService.get_run(run_id=emp_run_id, user_id=user_id)
        if not run:
            return None

        return emp

    @staticmethod
    def upsert_review(
        employee_risk_id: str,
        reviewer_id: str,
        status: str,
        notes: Optional[str]
    ) -> Dict[str, Any]:
        # Enforce authorization: verify that employee_risk exists and belongs to a run owned by reviewer_id
        emp = PersistenceService.get_employee_detail(
            run_id=None,
            employee_risk_id=employee_risk_id,
            user_id=reviewer_id
        )
        if not emp:
            raise PermissionError("Employee risk record not found or not owned by authenticated user.")

        actual_emp_id = emp["id"]
        now_iso = datetime.now(timezone.utc).isoformat()
        record = {
            "employee_risk_id": actual_emp_id,
            "reviewer_id": reviewer_id,
            "status": status,
            "notes": notes,
            "updated_at": now_iso
        }

        if not settings.USE_LOCAL_STORAGE:
            client = get_supabase_client()
            if not client:
                raise RuntimeError("Supabase client is not configured or unavailable.")
            try:
                res = client.table("hr_reviews").upsert(
                    record,
                    on_conflict="employee_risk_id"
                ).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return record
            except Exception as e:
                raise RuntimeError(f"Supabase hr_reviews upsert failed: {e}")

        # Explicit local storage
        db = _load_local_db()
        db["hr_reviews"][actual_emp_id] = record
        for e in db["employee_risks"]:
            if e["id"] == actual_emp_id:
                e["review_status"] = status
                e["review"] = record
                break
        _save_local_db(db)
        return record
