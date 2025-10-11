-- Create quote_groups table
CREATE TABLE IF NOT EXISTS public.quote_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Group Info
  group_name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  property_size NUMERIC,
  region TEXT NOT NULL,
  address TEXT,

  -- Status & Pricing
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  quote_count INTEGER NOT NULL DEFAULT 1 CHECK (quote_count >= 1 AND quote_count <= 3),
  total_price INTEGER NOT NULL DEFAULT 30000,

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_quote_groups_customer_phone ON public.quote_groups(customer_phone);
CREATE INDEX idx_quote_groups_status ON public.quote_groups(status);
CREATE INDEX idx_quote_groups_expires_at ON public.quote_groups(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quote_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (users can view their own groups)
CREATE POLICY "Users can view their own quote groups"
  ON public.quote_groups
  FOR SELECT
  USING (true); -- Or add: customer_phone = current_setting('request.jwt.claims')::json->>'phone' if you have auth

-- Create policy for public insert (users can create groups)
CREATE POLICY "Users can create quote groups"
  ON public.quote_groups
  FOR INSERT
  WITH CHECK (true);

-- Create policy for public update (users can update their own groups)
CREATE POLICY "Users can update their own quote groups"
  ON public.quote_groups
  FOR UPDATE
  USING (true);

-- Add comment
COMMENT ON TABLE public.quote_groups IS '견적 비교 그룹 테이블 - 48시간 내 최대 3개 견적 비교 가능';
