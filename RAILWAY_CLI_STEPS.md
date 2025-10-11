# Railway CLI 배포 단계별 가이드

> 터미널에서 직접 실행하세요 (PowerShell 또는 CMD)

---

## ✅ Step 1: Railway 로그인

```bash
railway login
```

- 브라우저가 자동으로 열림
- Railway 계정으로 로그인
- "Authentication Successful" 메시지 확인

---

## ✅ Step 2: 백엔드 폴더로 이동

```bash
cd F:\GOI\backend
```

---

## ✅ Step 3: Railway 프로젝트 생성

```bash
railway init
```

**프롬프트 응답:**
- Project name: `zipcheck-backend` 입력
- Region: `Tokyo (ap-northeast-1)` 선택 (화살표 키로 이동)

---

## ✅ Step 4: 환경변수 설정

하나씩 실행:

```bash
# Supabase 설정
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_ANON_KEY="your_anon_key"
railway variables set SUPABASE_SERVICE_KEY="your_service_key"

# Claude API
railway variables set CLAUDE_API_KEY="your_claude_api_key"

# 관리자
railway variables set ADMIN_PASSWORD="your_admin_password"

# JWT Secret (랜덤 문자열)
railway variables set JWT_SECRET="your_jwt_secret_key"

# Node 환경
railway variables set NODE_ENV="production"

# 포트
railway variables set PORT="3001"

# 네이버 로그인 (나중에 설정)
railway variables set NAVER_CLIENT_ID=""
railway variables set NAVER_CLIENT_SECRET=""
railway variables set NAVER_CALLBACK_URL=""

# 프론트엔드 URL (Vercel 배포 후 업데이트)
railway variables set FRONTEND_URL=""
```

---

## ✅ Step 5: 배포 실행

```bash
railway up
```

**기대 출력:**
```
Building...
Deploying...
Deployment successful!
```

---

## ✅ Step 6: 도메인 생성 및 확인

```bash
# 대시보드 열기
railway open
```

**Railway 대시보드에서:**
1. **Settings** → **Networking** 클릭
2. **Public Networking** 섹션
3. **Generate Domain** 클릭
4. 생성된 URL 복사 (예: `zipcheck-backend-production.up.railway.app`)

---

## ✅ Step 7: 배포 확인

### 로그 확인
```bash
railway logs
```

**성공 로그 예시:**
```
🚀 ZipCheck Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3001
🗄️  Database: Supabase
🔍 Environment: production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 헬스체크
브라우저 또는 터미널에서:
```bash
curl https://your-railway-url.up.railway.app/health
```

**예상 응답:**
```json
{"status":"ok","timestamp":"2025-01-10T..."}
```

---

## 📝 환경변수 값 가져오는 곳

### Supabase
1. Supabase 대시보드: https://supabase.com/dashboard
2. **프로젝트 클릭** → **Settings** → **API**
3. 복사:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: anon public
   - `SUPABASE_SERVICE_KEY`: service_role (⚠️ 비밀로 유지)

### Claude API
1. https://console.anthropic.com
2. **API Keys** 섹션
3. **Create Key** → 이름 입력 → 생성
4. API Key 복사 (한 번만 표시됨)

### JWT Secret
랜덤 문자열 생성:
```bash
# PowerShell에서
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object {[char]((65..90)+(97..122) | Get-Random)})))
```

또는 온라인 생성기:
- https://generate-secret.vercel.app/32

---

## 🚨 문제 해결

### 빌드 실패 - "Cannot find module"
```bash
# 로컬에서 테스트
cd F:\GOI\backend
npm install
npm run build
```

### 환경변수 확인
```bash
railway variables
```

### 재배포
```bash
railway up --detach
```

### 프로젝트 상태
```bash
railway status
```

---

## 📊 주요 명령어

```bash
# 프로젝트 목록
railway list

# 환경변수 확인
railway variables

# 실시간 로그
railway logs

# 대시보드 열기
railway open

# 배포
railway up

# 배포 (백그라운드)
railway up --detach

# 프로젝트 정보
railway status
```

---

## ✅ 완료 후 다음 단계

1. ✅ Railway 도메인 URL 복사
2. ➡️ Vercel 프론트엔드 배포
3. ➡️ Vercel에 `VITE_API_URL` 환경변수 추가
4. ➡️ Railway에 `FRONTEND_URL` 업데이트
5. ➡️ 통합 테스트

---

**Railway 도메인을 확인하면 다음 단계로 진행하겠습니다!** 🚀
