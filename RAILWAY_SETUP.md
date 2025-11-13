# Railway 백엔드 배포 상세 가이드

> GitHub: https://github.com/pola2025/zipcheck

---

## 📋 Step 1: Root Directory 설정

Railway 대시보드에서:

1. **프로젝트 클릭** (zipcheck)
2. **Service 클릭** (서비스 카드)
3. **Settings** 탭
4. **Service** 섹션 → **Root Directory** 찾기
5. 입력: `backend`
6. **Save** 또는 자동 저장 확인

**중요:** 이 설정이 없으면 Railway가 프로젝트 루트에서 빌드를 시도해서 실패합니다!

---

## 🔐 Step 2: 환경변수 설정

**Settings** → **Variables** 탭에서 **+ New Variable** 클릭 후 하나씩 추가:

### 필수 환경변수

```bash
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_KEY=<your-supabase-service-key>

# Claude API (견적 분석)
CLAUDE_API_KEY=<your-claude-api-key>

# OpenAI & Google Vision
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_API_KEY=AIza...

# Slack notifications (optional)
ENABLE_SLACK_NOTIFICATIONS=false
SLACK_DEV_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/DEV/WEBHOOK
SLACK_ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/ADMIN/WEBHOOK

# Notion 데이터베이스
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_log_db_id
NOTION_CUSTOMER_REQUEST_DB_ID=your_notion_customer_request_db_id

# 관리자 비밀번호
ADMIN_PASSWORD=your_secure_admin_password

# JWT Secret (무작위 문자열)
JWT_SECRET=your_very_long_random_secret_key_here

# Node 환경
NODE_ENV=production

# 포트 (Railway 자동 할당됨이지만 명시)
PORT=3001
```

### 선택 환경변수 (나중에 추가 가능)

```bash
# 네이버 로그인 (API 키 발급 후)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=https://your-vercel-app.vercel.app/auth/naver/callback

# CORS (Vercel 배포 후 업데이트)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**환경변수 가져오는 곳:**
- Supabase: 대시보드 → Settings → API
- Claude API: https://console.anthropic.com
- JWT_SECRET: 랜덤 문자열 (예: openssl rand -base64 32)

---

## 🌐 Step 3: 도메인 생성

1. **Settings** → **Networking** 탭
2. **Public Networking** 섹션
3. **Generate Domain** 클릭
4. 생성된 URL 복사 (예: `zipcheck-backend-production.up.railway.app`)

**이 URL을 나중에 Vercel에서 사용합니다!**

---

## 🚀 Step 4: 배포 확인

### 배포 상태 확인

1. **Deployments** 탭 클릭
2. 최신 배포 확인:
   - ✅ **SUCCESS** - 배포 성공!
   - 🔄 **BUILDING** - 빌드 중... (3-5분)
   - ❌ **FAILED** - 로그 확인 필요

### 로그 확인

배포 클릭 → **View Logs**
- Build Logs: 빌드 과정
- Deploy Logs: 서버 실행 로그

**성공 로그 예시:**
```
🚀 ZipCheck Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3001
🗄️  Database: Supabase
🔍 Environment: production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Step 5: 헬스체크

터미널에서 또는 브라우저에서:

```bash
curl https://your-railway-url.up.railway.app/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-10T..."
}
```

또는 브라우저에서:
```
https://your-railway-url.up.railway.app
```

**예상 화면:**
```
🚀 ZipCheck Backend Server
Status: Running
```

---

## 🚨 트러블슈팅

### 1. 빌드 실패 - "Cannot find package.json"

**원인:** Root Directory가 설정되지 않음

**해결:**
1. Settings → Root Directory = `backend`
2. Redeploy

### 2. 빌드 실패 - "TypeScript errors"

**로그 예시:**
```
error TS2305: Module '"@supabase/supabase-js"' has no exported member...
```

**해결:**
1. 로컬에서 테스트:
   ```bash
   cd backend
   npm run build
   ```
2. 오류 수정 후 git push

### 3. 실행 실패 - "Cannot find module"

**원인:** dependencies vs devDependencies

**해결:**
`backend/package.json` 확인:
- `typescript`, `tsx` → devDependencies ✅
- `express`, `@supabase/supabase-js` → dependencies ✅

### 4. 환경변수 오류

**로그 예시:**
```
Error: SUPABASE_URL is required
```

**해결:**
1. Settings → Variables 확인
2. 누락된 변수 추가
3. Redeploy

### 5. 서버 시작 실패 - "Port already in use"

**원인:** PORT 환경변수 문제

**해결:**
Railway는 자동으로 PORT를 할당하므로:
- Variables에서 PORT 제거 또는
- `backend/src/index.ts`에서 `process.env.PORT || 3001` 확인

---

## 📊 비용 모니터링

1. **Dashboard** → **Usage** 탭
2. **Current Usage** 확인:
   - $X.XX / $5.00 used
   - XX days remaining

**예상 비용 (소규모 앱):**
- 하루: ~$0.15
- 한 달: ~$4.50
- 30일 무료 크레딧으로 충분!

**트래픽 증가 시:**
- CPU: 더 많은 요청 처리 시
- Memory: 파일 업로드 많을 때
- Network: 이미지 전송 많을 때

---

## 🔄 업데이트 방법

코드 변경 후:

```bash
git add .
git commit -m "Update backend"
git push
```

**Railway가 자동으로:**
1. GitHub push 감지
2. 빌드 시작
3. 배포 완료
4. 서비스 재시작

**Deployments 탭에서 확인 가능**

---

## 📝 다음 단계

Railway 배포 완료 후:

1. ✅ 도메인 URL 복사
2. ➡️ Vercel 프론트엔드 배포
3. ➡️ Vercel에 `VITE_API_URL` 설정
4. ➡️ Railway에 `FRONTEND_URL` 업데이트
5. ➡️ 통합 테스트

---

**배포 완료되면 Railway URL을 알려주세요!** 🚀
