-- Add subscription fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'subscription_created', 'invoice_paid', 'subscription_updated', 'subscription_canceled'
    subscription_id TEXT,
    invoice_id TEXT,
    amount INTEGER, -- in cents
    currency TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB
);

-- Create index on payment_history
CREATE INDEX IF NOT EXISTS payment_history_user_id_idx ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS payment_history_subscription_id_idx ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS payment_history_created_at_idx ON public.payment_history(created_at);

-- Enable Row Level Security on new table
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_history table
CREATE POLICY "Users can view their own payment history" ON public.payment_history
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Add plan limits to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS max_savings_goals INTEGER DEFAULT 3, -- Basic plan limit
ADD COLUMN IF NOT EXISTS has_advanced_reports BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_ai_insights BOOLEAN DEFAULT FALSE;
