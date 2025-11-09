/**
 * Fix analysis_jobs foreign key type
 *
 * quote_requests.id is UUID, so quote_request_id should also be UUID
 */

-- Drop existing table if it exists (from failed migration)
DROP TABLE IF EXISTS analysis_job_outputs CASCADE;
DROP TABLE IF EXISTS analysis_job_usage CASCADE;
DROP TABLE IF EXISTS analysis_job_inputs CASCADE;
DROP TABLE IF EXISTS analysis_jobs CASCADE;

-- 작업(견적 종합 분석) 단위
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idem_key TEXT UNIQUE NOT NULL,                    -- 중복 요청 차단 (hash of userId + docsetHash + params)
  user_id TEXT,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,  -- Fixed: INTEGER → UUID

  -- 상태 관리
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','timeout','canceled','duplicate')) DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- 토큰/비용 예산
  input_token_budget INTEGER NOT NULL DEFAULT 50000,    -- 총 토큰 예산(입/출 합)
  max_output_tokens INTEGER NOT NULL DEFAULT 3000,
  actual_tokens_used INTEGER DEFAULT 0,
  actual_cost_usd NUMERIC(10,4) DEFAULT 0,

  -- 실행 제어
  stop_sequence TEXT DEFAULT E'\nEND',
  max_steps INTEGER NOT NULL DEFAULT 6,
  timeout_ms INTEGER NOT NULL DEFAULT 90000,

  -- 결과/에러
  reason TEXT,                               -- 실패/중단 사유
  error_message TEXT,
  error_stack TEXT,

  -- 메타데이터
  model TEXT DEFAULT 'gpt-5-pro',
  client_ip TEXT,
  abort_requested BOOLEAN DEFAULT false
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_quote_request_id ON analysis_jobs(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON analysis_jobs(user_id);

-- 문서/데이터 입력 묶음
CREATE TABLE IF NOT EXISTS analysis_job_inputs (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,          -- 'floor_plan','quote_items','base_costs','market_prices','construction_records'
  pointer TEXT NOT NULL,              -- S3 키, 파일ID, 또는 벡터 컬렉션ID 등
  tokens_estimate INTEGER,            -- 사전 추정 토큰
  metadata JSONB,                     -- 추가 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_inputs_job_id ON analysis_job_inputs(job_id);

-- 사용량/비용 로깅 (step별)
CREATE TABLE IF NOT EXISTS analysis_job_usage (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  usd_input NUMERIC(10,4) NOT NULL DEFAULT 0,
  usd_output NUMERIC(10,4) NOT NULL DEFAULT 0,
  usd_total NUMERIC(10,4) NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_usage_job_id ON analysis_job_usage(job_id);
CREATE INDEX IF NOT EXISTS idx_job_usage_created_at ON analysis_job_usage(created_at DESC);

-- 출력 결과 (부분/최종)
CREATE TABLE IF NOT EXISTS analysis_job_outputs (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  content JSONB NOT NULL,             -- JSON 스키마에 맞춘 결과
  content_hash TEXT,                  -- 중복 출력 차단용
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_outputs_job_id ON analysis_job_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_outputs_done ON analysis_job_outputs(job_id, done);

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_analysis_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analysis_jobs_updated_at ON analysis_jobs;
CREATE TRIGGER trigger_update_analysis_jobs_updated_at
  BEFORE UPDATE ON analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_jobs_updated_at();

-- 통계 뷰 (모니터링용)
CREATE OR REPLACE VIEW analysis_job_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  status,
  COUNT(*) as count,
  AVG(actual_tokens_used) as avg_tokens,
  MAX(actual_tokens_used) as max_tokens,
  AVG(actual_cost_usd) as avg_cost_usd,
  SUM(actual_cost_usd) as total_cost_usd
FROM analysis_jobs
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY date DESC, status;

COMMENT ON TABLE analysis_jobs IS 'GPT-5 Pro 종합 분석 작업 추적 (무한루프/토큰/타임아웃 방지)';
COMMENT ON COLUMN analysis_jobs.idem_key IS 'Idempotency key: hash(userId + quoteRequestId + params) - 중복 요청 차단';
COMMENT ON COLUMN analysis_jobs.input_token_budget IS '총 토큰 예산 (입력+출력 합산, 기본 50,000)';
COMMENT ON COLUMN analysis_jobs.max_output_tokens IS '출력 토큰 상한 (기본 3,000, 범위: 2,000~4,000)';
COMMENT ON COLUMN analysis_jobs.max_steps IS '최대 스텝 수 (무한루프 방지, 기본 6)';
COMMENT ON COLUMN analysis_jobs.abort_requested IS '클라이언트가 취소를 요청했는지 여부';
