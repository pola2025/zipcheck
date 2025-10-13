# 배포 단계별 가이드

## 현재 상황
- ✅ 프론트엔드: Vercel 배포 완료 (https://frontend-omega-ten-49.vercel.app/)
- ❌ 백엔드: Railway 배포 필요
- ❌ 환경 변수 설정 필요

## 문제 해결 완료
1. ✅ 보안 가이드라인 문서 작성 (.claude/SECURITY_GUIDELINES.md)
2. ✅ .gitignore 파일 업데이트 (환경 변수 파일 제외)
3. ✅ 프론트엔드 API URL 환경 변수화 (하드코딩 제거)
4. ✅ 관리자 대시보드 페이지 생성 (/admin 경로)
5. ✅ .env.example 템플릿 파일 생성

---

## Step 1: Railway 백엔드 배포

### 1-1. Railway 프로젝트 연결
```bash
cd F:\GOI\backend
railway link
```
- 프롬프트에서 **zipcheck** 프로젝트 선택
- workspace 선택

### 1-2. 환경 변수 설정
Railway 대시보드에서 설정하거나, CLI로 설정:

```bash
# 현재 .env 파일의 값들을 Railway에 설정
railway variables set SUPABASE_URL="https://qfnqxzabcuzhkwptfnpa.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="your_service_key"
railway variables set SUPABASE_ANON_KEY="your_anon_key"
railway variables set ADMIN_PASSWORD="wlqcprwlqcprwlqcpr8282"
railway variables set JWT_SECRET="zipcheck_jwt_secret_key_2025_production"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set CLAUDE_API_KEY="your_claude_api_key"
railway variables set OPENAI_API_KEY="your_openai_api_key"
railway variables set GOOGLE_CLOUD_API_KEY="your_google_cloud_api_key"
```

**중요:** FRONTEND_URL은 나중에 Vercel URL로 업데이트

### 1-3. Railway 배포
```bash
railway up
```

배포 완료 후 로그 확인:
```bash
railway logs
```

### 1-4. 도메인 생성
1. Railway 대시보드 열기: `railway open`
2. **Settings** → **Networking** → **Generate Domain**
3. 생성된 URL 복사 (예: `zipcheck-backend.up.railway.app`)

---

## Step 2: Vercel 프론트엔드 환경 변수 설정

### 2-1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2-2. 프로젝트 설정
1. 프론트엔드 프로젝트 선택
2. **Settings** → **Environment Variables**

### 2-3. 환경 변수 추가
| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-railway-url.up.railway.app` | Production |

**중요:** Railway에서 생성한 도메인 URL을 사용

---

## Step 3: Railway FRONTEND_URL 업데이트

### 3-1. Railway 환경 변수 업데이트
```bash
cd F:\GOI\backend
railway variables set FRONTEND_URL="https://frontend-omega-ten-49.vercel.app"
```

### 3-2. 재배포
```bash
railway up
```

---

## Step 4: Vercel 프론트엔드 재배포

### 방법 1: Git Push (권장)
```bash
cd F:\GOI\openui\frontend
git add .
git commit -m "Add admin dashboard and environment variable support"
git push
```
Vercel이 자동으로 재배포합니다.

### 방법 2: Vercel CLI
```bash
cd F:\GOI\openui\frontend
vercel --prod
```

---

## Step 5: 배포 확인

### 5-1. 백엔드 Health Check
```bash
curl https://your-railway-url.up.railway.app/health
```

예상 응답:
```json
{"status":"ok","timestamp":"2025-01-10T..."}
```

### 5-2. 프론트엔드 접속
https://frontend-omega-ten-49.vercel.app/admin/login

1. 관리자 비밀번호 입력: `wlqcprwlqcprwlqcpr8282`
2. 로그인 성공 후 `/admin` 대시보드로 리다이렉트 확인

### 5-3. API 연결 테스트
대시보드에서 통계가 제대로 로드되는지 확인

---

## 문제 해결

### "Failed to fetch" 오류
- Railway 백엔드가 배포되었는지 확인
- Vercel 환경 변수 `VITE_API_URL`이 올바른지 확인
- Railway CORS 설정 (`FRONTEND_URL`) 확인

### 로그인 실패
- Railway 환경 변수 `ADMIN_PASSWORD` 확인
- Railway 로그 확인: `railway logs`

### 빌드 실패
- Railway: `railway logs` 확인
- Vercel: Vercel 대시보드에서 빌드 로그 확인

---

## 보안 체크리스트

배포 전 확인:
- [ ] .env 파일이 Git에 커밋되지 않았는가?
- [ ] 환경 변수가 Railway/Vercel에 올바르게 설정되었는가?
- [ ] ADMIN_PASSWORD가 안전한가?
- [ ] JWT_SECRET이 충분히 복잡한가?
- [ ] API 키들이 노출되지 않았는가?

---

## 다음 단계

배포 완료 후:
1. [ ] 백엔드 Railway URL 확인
2. [ ] Vercel 환경 변수 설정
3. [ ] Railway FRONTEND_URL 업데이트
4. [ ] Vercel 재배포
5. [ ] 관리자 대시보드 접속 테스트
6. [ ] 견적 요청 기능 테스트

---

**Last Updated:** 2025-10-12
**Status:** Ready for Deployment
