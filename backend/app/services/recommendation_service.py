from typing import List, Dict, Any
import pandas as pd


class RecommendationService:
    @staticmethod
    def generate_recommendations(employee_row: pd.Series, rank: int) -> List[Dict[str, Any]]:
        """
        Generates exactly three rule-based recommendations for Top-10 employees (ranks 1-10).
        Returns empty list for employees ranked 11-50.
        """
        if rank > 10:
            return []

        rules = []

        # Rule 1: Overtime
        if str(employee_row.get("OverTime", "")).lower() == "yes":
            rules.append({
                "code": "workload_review",
                "title": "Review Workload & Overtime Distribution",
                "reason": "Recorded overtime hours indicate a pattern of high project density that correlates strongly with fatigue.",
                "suggested_action": "Convene confidential workload balancing session with department lead and redistribute non-critical tasks."
            })

        # Rule 2: Job Satisfaction
        job_sat = employee_row.get("JobSatisfaction", 3)
        if isinstance(job_sat, (int, float)) and job_sat <= 2:
            rules.append({
                "code": "engagement_dialogue",
                "title": "Role Alignment & Stay-Interview",
                "reason": f"Observed job satisfaction score ({job_sat}/4) signals acute friction with daily responsibilities or tooling.",
                "suggested_action": "Schedule a dedicated stay-interview to identify day-to-day roadblocks and restore engagement."
            })

        # Rule 3: Compensation
        monthly_income = employee_row.get("MonthlyIncome", 6000)
        if isinstance(monthly_income, (int, float)) and monthly_income < 4500:
            rules.append({
                "code": "compensation_parity",
                "title": "Evaluate Compensation Market Parity",
                "reason": f"Current monthly income (${int(monthly_income):,}) falls below competitive median for this role band.",
                "suggested_action": "Submit an off-cycle salary benchmarking request to Total Rewards."
            })

        # Rule 4: Work-Life Balance
        wlb = employee_row.get("WorkLifeBalance", 3)
        if isinstance(wlb, (int, float)) and wlb <= 2:
            rules.append({
                "code": "flexible_accommodation",
                "title": "Flexible Hours / Commute Accommodation",
                "reason": "Low work-life balance scores combined with commute strain increase attrition vulnerability.",
                "suggested_action": "Offer hybrid working days or core-hours flexibility to alleviate schedule pressure."
            })

        # Rule 5: Early Tenure
        tenure = employee_row.get("YearsAtCompany", 5)
        if isinstance(tenure, (int, float)) and tenure <= 2:
            rules.append({
                "code": "mentorship_sponsor",
                "title": "Assign Senior Technical Sponsor",
                "reason": "Tenure under 2 years is a vulnerable window where social integration and early recognition are vital.",
                "suggested_action": "Pair with a senior department sponsor and chart a 12-month career development trajectory."
            })

        # Rule 6: Role Stagnation
        years_in_role = employee_row.get("YearsInCurrentRole", 2)
        if isinstance(years_in_role, (int, float)) and years_in_role >= 3:
            rules.append({
                "code": "internal_mobility",
                "title": "Internal Mobility & Role Progression",
                "reason": "Extended time in current role without milestone progression increases likelihood of external job search.",
                "suggested_action": "Explore stretch projects, high-impact rotations, or target timeline for upcoming promotion."
            })

        # Default fallback recommendations to guarantee exactly 3 distinct entries
        fallbacks = [
            {
                "code": "executive_checkin",
                "title": "Leadership Retention Discussion",
                "reason": "Identified in the top cohort of flight-risk predictions for this capacity cycle.",
                "suggested_action": "Conduct informal 1-on-1 check-in with department director to assess long-term career aspirations."
            },
            {
                "code": "skill_growth_stipend",
                "title": "Professional Development & Training Path",
                "reason": "Continuous learning investments significantly improve retention among key technical contributors.",
                "suggested_action": "Allocate professional development stipend for advanced certifications or executive coaching."
            },
            {
                "code": "recognition_review",
                "title": "Performance Recognition Review",
                "reason": "Review recent contributions to ensure compensation and public praise reflect business impact.",
                "suggested_action": "Highlight recent project milestones in upcoming all-hands and evaluate merit bonus eligibility."
            }
        ]

        # Combine and deduplicate
        seen_codes = set()
        final_recs = []
        for r in rules + fallbacks:
            if r["code"] not in seen_codes:
                seen_codes.add(r["code"])
                final_recs.append(r)
            if len(final_recs) == 3:
                break

        return final_recs
