# ZipCheck 배포 가이드

> Railway (백엔드) + Vercel (프론트엔드) + Supabase (데이터베이스)

---

## 📋 사전 준비

### 필요한 것들
- [x] GitHub 계정
- [x] Railway 계정 (https://railway.app)
- [x] Vercel 계정 (https://vercel.com)
- [x] Supabase 프로젝트 (이미 완료)

---

## 🚂 Part 1: Railway 백엔드 배포

### 1. Railway CLI 설치

```bash
# npm으로 설치
npm install -g @railway/cli

# 로그인
railway login
```

### 2. 프로젝트 초기화

```bash
# 백엔드 폴더로 이동
cd backend

# Railway 프로젝트 생성
railway init

# 프로젝트 이름 입력: zipcheck-backend
# Region 선택: Tokyo (ap-northeast-1) 추천
```

### 3. 환경변수 설정

Railway 대시보드에서 또는 CLI로 설정:

```bash
# CLI로 환경변수 설정
railway variables set SUPABASE_URL="your-supabase-url"
railway variables set SUPABASE_ANON_KEY="your-anon-key"
railway variables set SUPABASE_SERVICE_KEY="your-service-key"
railway variables set CLAUDE_API_KEY="your-claude-key"
railway variables set ADMIN_PASSWORD="your-admin-password"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"

# 네이버 로그인 (나중에 설정)
railway variables set NAVER_CLIENT_ID="your-naver-client-id"
railway variables set NAVER_CLIENT_SECRET="your-naver-client-secret"
railway variables set NAVER_CALLBACK_URL="https://your-domain.com/auth/naver/callback"

# 프론트엔드 URL (Vercel 배포 후 설정)
railway variables set FRONTEND_URL="https://your-vercel-app.vercel.app"
```

### 4. railway.json 설정 파일 생성

`backend/railway.json` 파일 생성:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. package.json 스크립트 확인

`backend/package.json`에 다음 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 6. 배포 실행

```bash
# 첫 배포
railway up

# 배포 상태 확인
railway status

# 로그 확인
railway logs

# 대시보드 열기
railway open
```

### 7. 도메인 설정

Railway 대시보드에서:
1. **Settings** → **Domains**
2. **Generate Domain** 클릭
3. 생성된 URL 복사 (예: `zipcheck-backend.up.railway.app`)

---

## ▲ Part 2: Vercel 프론트엔드 배포

### 1. GitHub 저장소 준비

```bash
# Git 초기화 (아직 안했다면)
cd F:\GOI
git init
git add .
git commit -m "Initial commit: ZipCheck project"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/your-username/zipcheck.git
git push -u origin main
```

### 2. Vercel CLI 설치 (선택사항)

```bash
npm install -g vercel

# 로그인
vercel login
```

### 3. Vercel 대시보드에서 배포

1. https://vercel.com 접속
2. **Add New** → **Project**
3. GitHub 저장소 연결
4. **Root Directory** 설정: `openui/frontend`
5. **Framework Preset**: Vite 자동 감지
6. **Environment Variables** 설정:
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app
   ```
7. **Deploy** 클릭

### 4. CLI로 배포 (대안)

```bash
cd openui/frontend

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 5. 환경변수 설정

Vercel 대시보드에서:
1. **Settings** → **Environment Variables**
2. 다음 변수 추가:
   ```
   VITE_API_URL = https://zipcheck-backend.up.railway.app
   ```

### 6. 도메인 설정 (선택)

Vercel 대시보드에서:
1. **Settings** → **Domains**
2. 커스텀 도메인 추가 또는 Vercel 제공 도메인 사용

---

## 🔄 Part 3: CORS 및 환경변수 업데이트

### Railway 백엔드 환경변수 업데이트

```bash
# Vercel 도메인으로 FRONTEND_URL 업데이트
railway variables set FRONTEND_URL="https://your-vercel-app.vercel.app"

# 재배포
railway up
```

### 네이버 로그인 콜백 URL 업데이트

네이버 개발자센터에서:
1. **내 애플리케이션** → **API 설정**
2. **Callback URL** 추가:
   ```
   https://your-vercel-app.vercel.app/auth/naver/callback
   ```

---

## ✅ Part 4: 배포 확인

### 1. 백엔드 헬스체크

```bash
curl https://zipcheck-backend.up.railway.app/health
```

예상 응답:
```json
{"status":"ok","timestamp":"2025-01-10T..."}
```

### 2. 프론트엔드 접속

브라우저에서 Vercel 도메인 열기:
```
https://your-vercel-app.vercel.app
```

### 3. API 연결 테스트

프론트엔드에서:
1. 커뮤니티 페이지 접속
2. 후기 목록 로딩 확인
3. 네트워크 탭에서 API 호출 확인

---

## 🔧 Railway CLI 주요 명령어

```bash
# 프로젝트 목록
railway list

# 현재 프로젝트 정보
railway status

# 실시간 로그 확인
railway logs

# 환경변수 확인
railway variables

# 환경변수 설정
railway variables set KEY=VALUE

# 대시보드 열기
railway open

# 배포
railway up

# 로컬 개발 환경에서 Railway 환경변수 사용
railway run npm run dev

# 프로젝트 연결 (다른 컴퓨터에서)
railway link
```

---

## 📊 Vercel CLI 주요 명령어

```bash
# 배포 (프리뷰)
vercel

# 프로덕션 배포
vercel --prod

# 환경변수 추가
vercel env add VITE_API_URL

# 환경변수 확인
vercel env ls

# 로그 확인
vercel logs

# 프로젝트 정보
vercel inspect

# 배포 목록
vercel ls
```

---

## 🚨 문제 해결

### Railway 빌드 실패

```bash
# 로그 확인
railway logs

# 빌드 로그 상세 확인
railway logs --build
```

**일반적인 문제:**
- Node.js 버전 불일치 → `package.json`에 `engines` 추가
- 환경변수 누락 → `railway variables` 확인
- TypeScript 컴파일 오류 → 로컬에서 `npm run build` 테스트

### Vercel 빌드 실패

**일반적인 문제:**
- Root Directory 잘못 설정 → `openui/frontend` 확인
- 환경변수 누락 → Vercel 대시보드에서 확인
- Build Command 오류 → `npm run build` 로컬 테스트

### CORS 오류

Railway 백엔드 `src/index.ts`에서 CORS 설정 확인:

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
)
```

---

## 🔐 보안 체크리스트

- [ ] `.env` 파일 Git에 커밋 안됨 확인 (`.gitignore`)
- [ ] 모든 Secret 환경변수로 설정
- [ ] CORS 설정 확인
- [ ] JWT_SECRET 강력한 키 사용
- [ ] ADMIN_PASSWORD 복잡한 비밀번호 사용
- [ ] Supabase RLS 정책 확인 (필요시)

---

## 📈 모니터링

### Railway
- **Metrics** 탭: CPU, 메모리, 네트워크 사용량
- **Logs** 탭: 실시간 로그
- **Deployments** 탭: 배포 히스토리

### Vercel
- **Analytics** 탭: 트래픽, 성능
- **Logs** 탭: 함수 로그
- **Deployments** 탭: 배포 히스토리

---

## 🔄 업데이트 배포

### 백엔드 업데이트

```bash
cd backend
git add .
git commit -m "Update backend"
git push

# Railway 자동 배포 (GitHub 연동시)
# 또는 수동 배포:
railway up
```

### 프론트엔드 업데이트

```bash
cd openui/frontend
git add .
git commit -m "Update frontend"
git push

# Vercel 자동 배포 (GitHub 연동시)
```

---

## 💰 비용

### Railway
- **Free Tier**: $5 월간 크레딧
- **Developer Plan**: $5/월 (더 많은 크레딧)
- 예상 비용: 소규모 프로젝트 $0-10/월

### Vercel
- **Hobby (Free)**: 개인 프로젝트 무료
- **Pro**: $20/월 (상업용)
- 예상 비용: Hobby 플랜으로 충분

### Supabase
- **Free Tier**: 500MB 데이터베이스
- **Pro**: $25/월
- 예상 비용: Free Tier로 시작 가능

---

## 📞 지원

- Railway 문서: https://docs.railway.app
- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs

---

**작성일**: 2025-01-10
**버전**: 1.0
**다음 업데이트**: 네이버 로그인 설정 추가 예정
