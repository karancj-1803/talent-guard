import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"
FRONTEND_URL = "http://localhost:5173"
TOKEN = "mock_jwt_token_demo_hr_user"

def get_headers():
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

def test_api():
    results = {}
    
    # 1. Frontend
    try:
        req = urllib.request.urlopen(FRONTEND_URL, timeout=5)
        html = req.read().decode('utf-8')
        results['frontend_html'] = f"HTTP {req.getcode()} (length: {len(html)} bytes, contains 'TalentGuard': {'TalentGuard' in html})"
    except Exception as e:
        results['frontend_html'] = f"FAILED: {e}"

    # 2. Health
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/health", timeout=5)
        results['health'] = json.loads(req.read().decode('utf-8'))
    except Exception as e:
        results['health'] = f"FAILED: {e}"

    # 3. Auth Me
    try:
        r = urllib.request.Request(f"{BASE_URL}/auth/me", headers=get_headers())
        req = urllib.request.urlopen(r, timeout=5)
        results['auth_me'] = json.loads(req.read().decode('utf-8'))
    except Exception as e:
        results['auth_me'] = f"FAILED: {e}"

    # 4. List runs
    run_id = None
    try:
        r = urllib.request.Request(f"{BASE_URL}/runs", headers=get_headers())
        req = urllib.request.urlopen(r, timeout=5)
        runs_data = json.loads(req.read().decode('utf-8'))
        items = runs_data.get('items', [])
        results['runs_count'] = len(items)
        if items:
            run_id = items[0]['id']
            results['latest_run_summary'] = {
                'id': items[0]['id'],
                'model_name': items[0].get('model_name'),
                'status': items[0].get('status'),
                'selected_count': items[0].get('selected_count'),
                'created_at': items[0].get('created_at')
            }
    except Exception as e:
        results['runs'] = f"FAILED: {e}"

    # 5. Run details
    if run_id:
        try:
            r = urllib.request.Request(f"{BASE_URL}/runs/{run_id}", headers=get_headers())
            req = urllib.request.urlopen(r, timeout=5)
            run_detail = json.loads(req.read().decode('utf-8'))
            results['run_detail'] = {
                'id': run_detail.get('id'),
                'status': run_detail.get('status'),
                'metrics': run_detail.get('metrics'),
                'dataset_summary': run_detail.get('dataset_summary'),
                'excluded_columns': run_detail.get('excluded_columns')
            }
        except Exception as e:
            results['run_detail'] = f"FAILED: {e}"

    # 6. Priorities
    employee_id = None
    if run_id:
        try:
            r = urllib.request.Request(f"{BASE_URL}/runs/{run_id}/priorities?limit=10", headers=get_headers())
            req = urllib.request.urlopen(r, timeout=10)
            priorities = json.loads(req.read().decode('utf-8'))
            results['priorities_count'] = len(priorities.get('items', []))
            results['priorities_total'] = priorities.get('total')
            if priorities.get('items'):
                first_emp = priorities['items'][0]
                employee_id = first_emp['id']
                results['sample_priority_employee'] = {
                    'id': first_emp['id'],
                    'employee_key': first_emp.get('employee_key'),
                    'employee_name': first_emp.get('employee_name'),
                    'risk_rank': first_emp.get('risk_rank'),
                    'risk_probability': first_emp.get('risk_probability'),
                    'department': first_emp.get('department'),
                    'job_role': first_emp.get('job_role'),
                    'overtime': first_emp.get('overtime'),
                    'reasons_count': len(first_emp.get('risk_reasons', []))
                }
        except Exception as e:
            results['priorities'] = f"FAILED: {e}"

    # 7. Employee detail
    if run_id and employee_id:
        try:
            r = urllib.request.Request(f"{BASE_URL}/runs/{run_id}/employees/{employee_id}", headers=get_headers())
            req = urllib.request.urlopen(r, timeout=10)
            emp = json.loads(req.read().decode('utf-8'))
            results['employee_detail'] = {
                'id': emp.get('id'),
                'employee_key': emp.get('employee_key'),
                'risk_rank': emp.get('risk_rank'),
                'risk_probability': emp.get('risk_probability'),
                'department': emp.get('department'),
                'job_role': emp.get('job_role'),
                'overtime': emp.get('overtime'),
                'reasons_count': len(emp.get('risk_reasons', [])),
                'recommendations_count': len(emp.get('recommendations', [])),
                'review': emp.get('review')
            }
        except Exception as e:
            results['employee_detail'] = f"FAILED: {e}"

        # 8. Review update
        try:
            review_payload = json.dumps({
                "status": "reviewed",
                "notes": "Automated verification note: retention outreach scheduled"
            }).encode('utf-8')
            req = urllib.request.Request(
                f"{BASE_URL}/employee-risks/{employee_id}/review",
                data=review_payload,
                headers=get_headers(),
                method='PUT'
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                review_resp = json.loads(resp.read().decode('utf-8'))
                results['review_update'] = {
                    'employee_risk_id': review_resp.get('employee_risk_id'),
                    'status': review_resp.get('status'),
                    'notes': review_resp.get('notes'),
                    'updated_at': review_resp.get('updated_at')
                }
        except Exception as e:
            results['review_update'] = f"FAILED: {e}"

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    test_api()
