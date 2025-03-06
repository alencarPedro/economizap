-- Create schema for EconomiZap
CREATE SCHEMA IF NOT EXISTS public;

-- Enable Row Level Security
ALTER SCHEMA public OWNER TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Income Table
CREATE TABLE IF NOT EXISTS public.income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0,
    target_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Budget Categories Table
CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    monthly_limit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, name)
);

-- Function to update user balance
CREATE OR REPLACE FUNCTION public.update_user_balance(user_id_param UUID, amount_param DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET balance = balance + amount_param,
        updated_at = now()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Create policies for expenses table
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Create policies for income table
CREATE POLICY "Users can view their own income" ON public.income
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own income" ON public.income
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own income" ON public.income
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own income" ON public.income
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Create policies for savings_goals table
CREATE POLICY "Users can view their own savings goals" ON public.savings_goals
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own savings goals" ON public.savings_goals
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own savings goals" ON public.savings_goals
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own savings goals" ON public.savings_goals
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Create policies for budget_categories table
CREATE POLICY "Users can view their own budget categories" ON public.budget_categories
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own budget categories" ON public.budget_categories
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own budget categories" ON public.budget_categories
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own budget categories" ON public.budget_categories
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON public.expenses(created_at);

CREATE INDEX IF NOT EXISTS income_user_id_idx ON public.income(user_id);
CREATE INDEX IF NOT EXISTS income_source_idx ON public.income(source);
CREATE INDEX IF NOT EXISTS income_created_at_idx ON public.income(created_at);

CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS budget_categories_user_id_idx ON public.budget_categories(user_id);
