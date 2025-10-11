-- 사용자 및 관리자 인증 스키마

-- 1. 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 네이버 로그인 정보
    naver_id TEXT UNIQUE NOT NULL, -- 네이버 고유 ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    profile_image TEXT, -- 프로필 이미지 URL

    -- 권한 관리
    role TEXT NOT NULL DEFAULT 'user', -- user, admin

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_users_naver_id ON users(naver_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 정보만 조회 가능
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (id::text = current_setting('app.user_id', true));

-- 관리자는 모든 사용자 정보 조회 가능
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = current_setting('app.user_id', true)
            AND role = 'admin'
        )
    );

-- 업데이트 타임스탬프 자동 갱신
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_timestamp();

-- 2. 관리자 권한 업데이트를 위한 함수 (관리자만 실행 가능)
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 현재 사용자가 관리자인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id::text = current_setting('app.user_id', true)
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;

    -- 역할 업데이트
    UPDATE users
    SET role = new_role
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 초기 관리자 설정 (네이버 로그인 후 해당 이메일을 관리자로 승격)
-- 실제 사용 시: 첫 로그인 후 해당 이메일로 수동 업데이트 필요
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@naver.com';
