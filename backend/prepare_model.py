"""
TalentGuard Offline Preparation Entry Point
Executes full dataset validation, held-out baseline evaluation, production pipeline fitting,
Top-50 ranking generation, aligned explanation computation, persistence, and artifact export.
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.lifecycle_service import LifecycleService
from app.config import settings

def main():
    print(f"[*] Starting TalentGuard offline model preparation...")
    print(f"[*] Dataset: {settings.IBM_HR_DATASET_PATH}")
    print(f"[*] Storage Mode: {'Local Storage' if settings.USE_LOCAL_STORAGE else 'Supabase PostgreSQL'}")
    
    try:
        result = LifecycleService.prepare(user_id=settings.DEFAULT_USER_ID)
        print("\n[SUCCESS] Model lifecycle preparation complete!")
        print(f"  - Run ID: {result['run_id']}")
        print(f"  - Selected Top-50 Cohort: {result['selected_count']} employees")
        print(f"  - Held-out ROC-AUC: {result['metrics']['roc_auc']}")
        print(f"  - Held-out Precision@50: {result['metrics']['precision_at_50']}")
        print(f"  - Held-out Recall@50: {result['metrics']['recall_at_50']}")
        print(f"  - Artifact Saved: {result['artifact_path']}")
        print(f"  - Metadata Saved: {result['metadata_path']}")
    except Exception as e:
        print(f"\n[ERROR] Preparation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
