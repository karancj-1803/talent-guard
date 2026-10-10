// Centralized mock data layer matching PRD integration contract

export const MOCK_CURRENT_USER = {
  id: "usr-a89b3f12-45e0-4781-a9c1-4209df349801",
  email: "elena.vance@technova.internal",
  display_name: "Elena Vance",
  role: "hr_manager",
  department: "People & Talent Operations",
  avatar_url: null,
}

export const MOCK_DATASET_SUMMARY = {
  name: "IBM HR Employee Attrition (Controlled Demonstration Source)",
  row_count: 1470,
  column_count: 35,
  attrition_yes: 237,
  attrition_no: 1233,
  attrition_rate: 0.1612,
  missing_values_count: 0,
  duplicate_records_count: 0,
  eligible_population: 1470,
  target_column: "Attrition",
  target_values: ["Yes", "No"]
}

export const MOCK_EXCLUDED_COLUMNS = [
  { name: "EmployeeNumber", reason: "Arbitrary identifier (zero predictive generalization)" },
  { name: "EmployeeCount", reason: "Zero variance constant column (value = 1 across all rows)" },
  { name: "StandardHours", reason: "Zero variance constant column (value = 80 across all rows)" },
  { name: "Over18", reason: "Zero variance constant column (value = 'Y' across all rows)" },
  { name: "Attrition", reason: "Target outcome label (excluded from predictors to prevent leakage)" }
]

export const MOCK_METRICS = {
  roc_auc: 0.8412,
  average_precision: 0.5934,
  precision_at_50: 0.6800,
  recall_at_50: 0.1435,
  test_size: 0.20,
  random_state: 42,
  train_rows: 1176,
  test_rows: 294,
  model_name: "Logistic Regression (Balanced Class Weight)",
  evaluation_date: "2026-10-10T04:30:00Z"
}

export const MOCK_RUNS = [
  {
    id: "b5c4214d-2ac8-4df4-aac5-c79bcf527c11",
    status: "completed",
    model_name: "logistic_regression",
    dataset_name: "WA_Fn-UseC_-HR-Employee-Attrition.csv",
    selected_count: 50,
    created_at: "2026-10-10T04:30:00Z",
    dataset_summary: MOCK_DATASET_SUMMARY,
    excluded_columns: MOCK_EXCLUDED_COLUMNS.map(c => c.name),
    metrics: MOCK_METRICS,
    validation_summary: {
      is_valid: true,
      validation_status: "passed",
      checks: [
        { check: "Required Target Column Present", status: "passed", details: "Attrition present in dataset" },
        { check: "Binary Target Validated", status: "passed", details: "Distinct values: ['Yes', 'No']" },
        { check: "Missing Values Check", status: "passed", details: "0 null cells across 1,470 rows" },
        { check: "Minimum Row Count (>= 500)", status: "passed", details: "1,470 records available" },
        { check: "Identifier Sanitization", status: "passed", details: "Excluded EmployeeNumber and 3 constant features" }
      ]
    }
  }
]

// Generate 50 realistic ranked employees
const ROLES = [
  "Research Scientist",
  "Sales Executive",
  "Laboratory Technician",
  "Manufacturing Director",
  "Healthcare Representative",
  "Manager",
  "Sales Representative",
  "Research Director",
  "Human Resources"
]

const DEPTS = [
  "Research & Development",
  "Sales",
  "Human Resources"
]

const SAMPLE_NAMES = [
  "Marcus Vance", "Sophia Chen", "Liam O'Connor", "Amina Patel", "Derrick Miller",
  "Isabella Rossi", "James Wilson", "Priya Sharma", "Tyler Brooks", "Camila Santos",
  "Ethan Walker", "Zoe Takahashi", "Lucas Meyer", "Fatima Al-Sayed", "Noah Becker",
  "Chloe Dupont", "Gabriel Souza", "Aaliyah Washington", "Mason Wright", "Harper Lee",
  "Leo Kim", "Grace Taylor", "Benjamin Scott", "Maya Lin", "Caleb Adams",
  "Hannah Abbott", "Julian Rivera", "Natalie Portman", "Adrian Brody", "Elena Rostova",
  "Oliver Queen", "Scarlett Johansen", "Sebastian Cruz", "Victoria Sterling", "Dominic Toretto",
  "Serena Williams", "Victor Frankenstein", "Clara Oswald", "Alexander Pierce", "Rachel Green",
  "David Tennant", "Eva Green", "Xavier Woods", "Diana Prince", "Bruce Wayne",
  "Natasha Romanoff", "Arthur Pendragon", "Guinevere Beck", "Thomas Shelby", "Grace Shelby"
]

const RECOMMENDATIONS_TEMPLATES = [
  {
    code: "workload_review",
    title: "Review Workload & Overtime Distribution",
    reason: "Consistent overtime hours recorded with high project density signaling burnout risk.",
    suggested_action: "Convene confidential workload review with department manager and redistribute non-critical tasks."
  },
  {
    code: "compensation_parity",
    title: "Compensation & Banding Benchmark Review",
    reason: "Current compensation index falls in the lowest quartile relative to peer seniority and market rates.",
    suggested_action: "Initiate off-cycle merit adjustment evaluation with People Operations / Total Rewards."
  },
  {
    code: "career_pathing",
    title: "Accelerated Career Progression Mapping",
    reason: "Tenure exceeding 2 years in current role without promotion milestone correlates strongly with disengagement.",
    suggested_action: "Schedule strategic career trajectory planning session with senior mentor and department VP."
  },
  {
    code: "manager_feedback",
    title: "Manager Alignment & Relationship Coaching",
    reason: "Environment satisfaction survey indicates friction or communication gap with immediate supervisor.",
    suggested_action: "Facilitate neutral 360-degree alignment feedback and offer leadership communication coaching."
  },
  {
    code: "flexible_work",
    title: "Flexible Hours / Hybrid Accommodation",
    reason: "Extended commute distance and poor work-life balance scores identified as key attrition drivers.",
    suggested_action: "Authorize flexible working hours or dedicated remote-work accommodation days."
  }
]

export function generateMockPriorities(runId = MOCK_RUNS[0].id) {
  const priorities = []
  
  for (let i = 1; i <= 50; i++) {
    // Probability gently decays from 0.88 down to 0.42
    const baseProb = Math.max(0.40, Number((0.895 - (i - 1) * 0.0097 + (Math.sin(i * 1.5) * 0.003)).toFixed(4)))
    const empKey = `EMP-${1000 + i * 17}`
    const name = SAMPLE_NAMES[i - 1] || `Employee ${empKey}`
    const dept = DEPTS[i % DEPTS.length]
    const role = ROLES[(i * 3) % ROLES.length]
    const overtime = i <= 24 ? "Yes" : (i % 3 === 0 ? "Yes" : "No")
    const jobSatisfaction = (i % 4) + 1
    const yearsAtCompany = Math.max(1, (i % 9) + 1)
    const monthlyIncome = Math.round(2400 + (14 - (i % 12)) * 650 + (i * 45))
    const workLifeBalance = (i % 3) + 1
    const totalWorkingYears = yearsAtCompany + (i % 6)

    // Explanations: 3 model-derived reasons
    const reasons = [
      {
        feature: overtime === "Yes" ? "OverTime_Yes" : "DistanceHoliday_High",
        label: overtime === "Yes" ? "Sustained Mandatory Overtime" : "Extended Commute Distance",
        observed_value: overtime === "Yes" ? "Yes (Active)" : "26 Miles",
        contribution: Number((0.38 - (i * 0.003)).toFixed(3)),
        direction: "increases"
      },
      {
        feature: "JobSatisfaction",
        label: jobSatisfaction <= 2 ? "Sub-par Job Satisfaction" : "Role Stagnation Index",
        observed_value: `${jobSatisfaction} / 4`,
        contribution: Number((0.24 - (i * 0.002)).toFixed(3)),
        direction: "increases"
      },
      {
        feature: "MonthlyIncome_Band",
        label: "Income Relative to Benchmark",
        observed_value: `$${monthlyIncome.toLocaleString()} / mo`,
        contribution: Number((0.15 - (i * 0.001)).toFixed(3)),
        direction: "increases"
      }
    ]

    // Recommendations only for Top 10 (Ranks 1..10)
    let recommendations = []
    if (i <= 10) {
      recommendations = [
        RECOMMENDATIONS_TEMPLATES[(i) % RECOMMENDATIONS_TEMPLATES.length],
        RECOMMENDATIONS_TEMPLATES[(i + 1) % RECOMMENDATIONS_TEMPLATES.length],
        RECOMMENDATIONS_TEMPLATES[(i + 2) % RECOMMENDATIONS_TEMPLATES.length]
      ]
    }

    // Default status
    let reviewStatus = "pending"
    let notes = null
    let updatedAt = null

    if (i === 1) {
      reviewStatus = "action_planned"
      notes = "Met with engineering director. Workload re-allocation requested for Q4 sprint cycle."
      updatedAt = "2026-10-10T05:12:00Z"
    } else if (i === 2) {
      reviewStatus = "reviewed"
      notes = "Reviewed flight-risk factors. Comp review scheduled with HR VP on Monday."
      updatedAt = "2026-10-10T05:25:00Z"
    }

    priorities.push({
      id: `emp-risk-${100 + i}-${runId.slice(0, 8)}`,
      run_id: runId,
      employee_key: empKey,
      employee_name: name,
      risk_rank: i,
      risk_probability: baseProb,
      department: dept,
      job_role: role,
      overtime: overtime,
      employee_attributes: {
        department: dept,
        job_role: role,
        overtime: overtime,
        years_at_company: yearsAtCompany,
        job_satisfaction: jobSatisfaction,
        monthly_income: monthlyIncome,
        work_life_balance: workLifeBalance,
        total_working_years: totalWorkingYears,
        environment_satisfaction: (i % 4) + 1,
        stock_option_level: i % 3
      },
      risk_reasons: reasons,
      recommendations: recommendations,
      review_status: reviewStatus,
      review: {
        status: reviewStatus,
        notes: notes,
        updated_at: updatedAt
      }
    })
  }

  return priorities
}

// In-memory / localStorage storage for mock persistence
const STORAGE_KEY_REVIEWS = "talentguard_mock_reviews"
const STORAGE_KEY_RUNS = "talentguard_mock_runs"

export function getStoredRuns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RUNS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn("Storage error", e)
  }
  return MOCK_RUNS
}

export function saveStoredRuns(runs) {
  try {
    localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runs))
  } catch (e) {
    console.warn("Storage error", e)
  }
}

export function getStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn("Storage error", e)
  }
  return {}
}

export function saveReviewLocal(employeeRiskId, status, notes) {
  const reviews = getStoredReviews()
  const record = {
    employee_risk_id: employeeRiskId,
    status,
    notes,
    updated_at: new Date().toISOString()
  }
  reviews[employeeRiskId] = record
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews))
  } catch (e) {
    console.warn("Storage error", e)
  }
  return record
}
