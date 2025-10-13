# Railway CLI 다시 설정 가이드

> PowerShell/CMD에서 실행

---

## Step 1: 현재 링크 해제

```bash
# F:\GOI 디렉토리에서
cd F:\GOI
railway unlink
```

---

## Step 2: Backend 폴더로 이동

```bash
cd backend
```

---

## Step 3: Railway 프로젝트 연결

이미 생성한 프로젝트가 있으므로:

```bash
railway link
```

**프롬프트 응답:**
- 화살표 키로 **zipcheck** 프로젝트 선택
- Enter

또는 새로 생성하려면:
```bash
railway init
```

**프롬프트 응답:**
- Project name: `zipcheck-backend`
- Region: `Tokyo (ap-northeast-1)` 선택

---

## Step 4: 환경변수 설정

Supabase 값을 실제 값으로 교체하세요:

```bash
# Supabase
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_ANON_KEY="your_anon_key_here"
railway variables set SUPABASE_SERVICE_KEY="your_service_key_here"
```

```bash
# Claude API
railway variables set CLAUDE_API_KEY="your_claude_api_key"
```

```bash
# 관리자
railway variables set ADMIN_PASSWORD="your_secure_password"
```

```bash
# JWT Secret (랜덤 문자열)
railway variables set JWT_SECRET="your_random_secret_key_at_least_32_chars"
```

```bash
# Node 환경
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
```

```bash
# 네이버 로그인 (빈 값으로 설정, 나중에 업데이트)
railway variables set NAVER_CLIENT_ID=""
railway variables set NAVER_CLIENT_SECRET=""
railway variables set NAVER_CALLBACK_URL=""
```

```bash
# CORS (빈 값으로 설정, Vercel 배포 후 업데이트)
railway variables set FRONTEND_URL=""
```

---

## Step 5: 환경변수 확인

```bash
railway variables
```

모든 변수가 설정되었는지 확인하세요.

---

## Step 6: 배포

```bash
railway up
```

**빌드 과정 출력:**
```
Uploading files...
Building...
Deploying...
Deployment successful!
```

---

## Step 7: 도메인 생성

### CLI에서 확인 (실험적 기능)
```bash
railway status
```

### 대시보드에서 확인 (권장)
```bash
railway open
```

**Railway 대시보드:**
1. **Settings** → **Networking**
2. **Public Networking** → **Generate Domain** (아직 없다면)
3. 생성된 URL 복사

---

## Step 8: 배포 확인

```bash
# 로그 확인
railway logs
```

성공 로그:
```
🚀 ZipCheck Backend Server Started!
📡 Server running on: http://localhost:3001
🗄️  Database: Supabase
🔍 Environment: production
```

---

## Step 9: 헬스체크

브라우저나 curl로:
```bash
curl https://your-railway-domain.up.railway.app/health
```

예상 응답:
```json
{"status":"ok","timestamp":"2025-01-10T..."}
```

---

## 완료! ✅

**Railway 도메인을 복사해두세요:**
```
https://zipcheck-backend-production-xxx.up.railway.app
```

이 URL을 Vercel 환경변수 `VITE_API_URL`에 사용합니다.

---

## 트러블슈팅

### 환경변수 누락 오류
```bash
railway variables
```
로 모두 설정되었는지 확인

### 빌드 실패
```bash
# 로컬 테스트
npm install
npm run build
```

### 재배포
```bash
railway up --detach
```

---

**완료되면 Railway 도메인 URL을 알려주세요!** 🚀
