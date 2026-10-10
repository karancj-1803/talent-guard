    -- ==============================================================================
    -- TalentGuard: Retention Command Center
    -- Migration 001: Initial Schema, Constraints, Indexes & RLS Policies
    -- ==============================================================================

    -- 1. Enable UUID Extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 2. Profiles Table
    CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name TEXT,
        role TEXT NOT NULL DEFAULT 'hr_manager' CHECK (role IN ('hr_manager', 'admin', 'analyst')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 3. Model Runs Table
    CREATE TABLE IF NOT EXISTS public.model_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        dataset_name TEXT NOT NULL,
        dataset_row_count INTEGER NOT NULL CHECK (dataset_row_count > 0),
        dataset_column_count INTEGER NOT NULL CHECK (dataset_column_count > 0),
        model_name TEXT NOT NULL DEFAULT 'logistic_regression',
        status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
        metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        excluded_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
        random_state INTEGER NOT NULL DEFAULT 42,
        test_size NUMERIC(4, 3) NOT NULL DEFAULT 0.200 CHECK (test_size > 0 AND test_size < 1),
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4. Employee Risks Table
    CREATE TABLE IF NOT EXISTS public.employee_risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES public.model_runs(id) ON DELETE CASCADE,
        employee_key TEXT NOT NULL,
        risk_rank INTEGER NOT NULL CHECK (risk_rank > 0),
        risk_probability DOUBLE PRECISION NOT NULL CHECK (risk_probability >= 0.0 AND risk_probability <= 1.0),
        employee_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
        recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_employee_risks_run_key UNIQUE (run_id, employee_key),
        CONSTRAINT uq_employee_risks_run_rank UNIQUE (run_id, risk_rank)
    );

    -- 5. HR Reviews Table
    CREATE TABLE IF NOT EXISTS public.hr_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_risk_id UUID NOT NULL REFERENCES public.employee_risks(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_planned', 'closed')),
        notes TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_hr_reviews_employee_risk UNIQUE (employee_risk_id)
    );

    -- 6. Trigger for hr_reviews.updated_at
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_hr_reviews_updated_at ON public.hr_reviews;
    CREATE TRIGGER trigger_hr_reviews_updated_at
        BEFORE UPDATE ON public.hr_reviews
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();

    -- 7. Query Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_model_runs_created_by ON public.model_runs(created_by, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_employee_risks_run_rank ON public.employee_risks(run_id, risk_rank);
    CREATE INDEX IF NOT EXISTS idx_employee_risks_run_prob ON public.employee_risks(run_id, risk_probability DESC);
    CREATE INDEX IF NOT EXISTS idx_hr_reviews_reviewer ON public.hr_reviews(reviewer_id, updated_at DESC);

    -- 8. Row Level Security (RLS)
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.model_runs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.employee_risks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.hr_reviews ENABLE ROW LEVEL SECURITY;

    -- Profiles Policies
    CREATE POLICY "Users can read own profile" ON public.profiles
        FOR SELECT TO authenticated
        USING (auth.uid() = id);

    CREATE POLICY "Users can update own display name" ON public.profiles
        FOR UPDATE TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

    -- Model Runs Policies
    CREATE POLICY "Users can view own runs" ON public.model_runs
        FOR SELECT TO authenticated
        USING (created_by = auth.uid());

    CREATE POLICY "Users can create own runs" ON public.model_runs
        FOR INSERT TO authenticated
        WITH CHECK (created_by = auth.uid());

    -- Employee Risks Policies (Cascade through run ownership)
    CREATE POLICY "Users can view risks for own runs" ON public.employee_risks
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.model_runs
                WHERE model_runs.id = employee_risks.run_id
                AND model_runs.created_by = auth.uid()
            )
        );

    CREATE POLICY "Users can insert risks for own runs" ON public.employee_risks
        FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.model_runs
                WHERE model_runs.id = employee_risks.run_id
                AND model_runs.created_by = auth.uid()
            )
        );

    -- HR Reviews Policies
    CREATE POLICY "Users can view reviews for own runs" ON public.hr_reviews
        FOR SELECT TO authenticated
        USING (
            reviewer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.employee_risks
                JOIN public.model_runs ON model_runs.id = employee_risks.run_id
                WHERE employee_risks.id = hr_reviews.employee_risk_id
                AND model_runs.created_by = auth.uid()
            )
        );

    CREATE POLICY "Users can upsert own reviews" ON public.hr_reviews
        FOR ALL TO authenticated
        USING (reviewer_id = auth.uid())
        WITH CHECK (reviewer_id = auth.uid());
