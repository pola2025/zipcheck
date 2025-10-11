-- Add validation_status and validation_notes columns to quote_requests table
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'under_review')),
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_validation_status ON public.quote_requests(validation_status);

-- Add comments
COMMENT ON COLUMN public.quote_requests.validation_status IS '견적서 검증 상태 (pending/approved/rejected/under_review)';
COMMENT ON COLUMN public.quote_requests.validation_notes IS '검증 관련 메모';
