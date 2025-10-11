-- Add expert item notes field to quote_requests table
-- This allows experts to add special observations for specific items

ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS expert_item_notes JSONB DEFAULT '{}';

COMMENT ON COLUMN quote_requests.expert_item_notes IS
'Expert notes for specific items in the quote.
Format: { "category-item": "expert note", ... }
Example: { "주방-싱크대": "싱크대 자재가 고급 자재로 적절하게 선정되었습니다." }';

-- Add validation to ensure minimum item detail requirements
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

COMMENT ON COLUMN quote_requests.validation_status IS
'Validation status: pending, approved, rejected_insufficient_detail, rejected_other';

COMMENT ON COLUMN quote_requests.validation_notes IS
'Admin notes about why a quote was rejected or any validation concerns';

-- Update existing records to have approved status if they were already processed
UPDATE quote_requests
SET validation_status = 'approved'
WHERE status IN ('analyzing', 'completed');
