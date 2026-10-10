import os
import json
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from app.auth import get_supabase_client
from app.config import settings

# Local storage fallback directory for robust local testing & development
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


class PersistenceService:
    @staticmethod
    def create_model_run(run_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        client = get_supabase_client()
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

        # Try Supabase first
        if client:
            try:
                res = client.table("model_runs").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                # If table does not exist yet or connection fails, use local DB
                pass

        # Fallback to persistent local storage
        db = _load_local_db()
        db["model_runs"].insert(0, record)
        _save_local_db(db)
        return record

    @staticmethod
    def save_employee_risks(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("employee_risks").insert(records).execute()
                if res.data:
                    return res.data
            except Exception:
                pass

        # Local fallback
        db = _load_local_db()
        # Remove any existing with same run_id
        if records:
            run_id = records[0]["run_id"]
            db["employee_risks"] = [r for r in db["employee_risks"] if r.get("run_id") != run_id]
        db["employee_risks"].extend(records)
        _save_local_db(db)
        return records

    @staticmethod
    def list_runs(user_id: str) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("model_runs").select("*").eq("created_by", user_id).order("created_at", desc=True).execute()
                if res.data is not None:
                    return res.data
            except Exception:
                pass

        db = _load_local_db()
        runs = [r for r in db["model_runs"] if r.get("created_by") == user_id or settings.DEBUG]
        return runs

    @staticmethod
    def get_run(run_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("model_runs").select("*").eq("id", run_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception:
                pass

        db = _load_local_db()
        for r in db["model_runs"]:
            if r["id"] == run_id:
                return r
        return None

    @staticmethod
    def get_priorities(
        run_id: str,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        client = get_supabase_client()
        db = _load_local_db()

        # Gather employee risks
        risks = []
        if client:
            try:
                query = client.table("employee_risks").select("*, hr_reviews(*)").eq("run_id", run_id).order("risk_rank")
                res = query.execute()
                if res.data:
                    risks = res.data
            except Exception:
                risks = []

        if not risks:
            risks = [r for r in db["employee_risks"] if r.get("run_id") == run_id]
            # Attach local reviews
            reviews = db.get("hr_reviews", {})
            for r in risks:
                emp_id = r["id"]
                if emp_id in reviews:
                    r["review_status"] = reviews[emp_id].get("status", "pending")
                    r["review"] = reviews[emp_id]
                else:
                    r["review_status"] = r.get("review_status", "pending")
                    r["review"] = {"status": "pending", "notes": None, "updated_at": None}

        # Apply filtering in memory
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
    def get_employee_detail(run_id: str, employee_risk_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("employee_risks").select("*, hr_reviews(*)").eq("id", employee_risk_id).execute()
                if res.data and len(res.data) > 0:
                    emp = res.data[0]
                    # Parse review
                    revs = emp.get("hr_reviews")
                    if revs and len(revs) > 0:
                        emp["review"] = revs[0]
                    else:
                        emp["review"] = {"status": "pending", "notes": None, "updated_at": None}
                    return emp
            except Exception:
                pass

        db = _load_local_db()
        for emp in db["employee_risks"]:
            if emp["id"] == employee_risk_id or emp["employee_key"] == employee_risk_id:
                reviews = db.get("hr_reviews", {})
                emp_id = emp["id"]
                if emp_id in reviews:
                    emp["review"] = reviews[emp_id]
                else:
                    emp["review"] = {"status": "pending", "notes": None, "updated_at": None}
                return emp
        return None

    @staticmethod
    def upsert_review(employee_risk_id: str, reviewer_id: str, status: str, notes: Optional[str]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        record = {
            "employee_risk_id": employee_risk_id,
            "reviewer_id": reviewer_id,
            "status": status,
            "notes": notes,
            "updated_at": now_iso
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("hr_reviews").upsert(
                    record,
                    on_conflict="employee_risk_id"
                ).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception:
                pass

        # Local storage fallback
        db = _load_local_db()
        db["hr_reviews"][employee_risk_id] = record
        # Also update in employee_risks
        for emp in db["employee_risks"]:
            if emp["id"] == employee_risk_id:
                emp["review_status"] = status
                emp["review"] = record
                break
        _save_local_db(db)
        return record
