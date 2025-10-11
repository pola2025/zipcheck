-- Add group_id and sequence_in_group columns to quote_requests table
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.quote_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sequence_in_group INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_group_id ON public.quote_requests(group_id);

-- Add comments
COMMENT ON COLUMN public.quote_requests.group_id IS '견적 비교 그룹 ID';
COMMENT ON COLUMN public.quote_requests.sequence_in_group IS '그룹 내 순서 (1, 2, 3)';
