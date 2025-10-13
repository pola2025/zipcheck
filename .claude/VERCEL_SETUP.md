# Vercel 환경 변수 설정 및 배포

## 현재 상황
- ✅ Railway 백엔드 배포 완료: `https://zipcheck-production.up.railway.app/`
- ✅ 백엔드 Health Check 정상
- ❌ Vercel 환경 변수 미설정 (프론트엔드가 localhost:3001로 요청 중)

---

## Step 1: Railway FRONTEND_URL 설정

Railway 대시보드에서 환경 변수 추가:

1. https://railway.app/project/zipcheck 접속
2. 백엔드 서비스 선택
3. **Variables** 탭 클릭
4. **New Variable** 클릭
5. 추가:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://frontend-omega-ten-49.vercel.app`
6. **Deploy** (자동 재배포됨)

---

## Step 2: Vercel 환경 변수 설정

### 방법 1: Vercel 대시보드 (권장)

1. https://vercel.com/dashboard 접속
2. 프론트엔드 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. **Add New** 클릭
5. 추가:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://zipcheck-production.up.railway.app`
   - **Environment**: **Production** 선택
6. **Save** 클릭

### 방법 2: Vercel CLI

```bash
cd F:\GOI\openui\frontend
vercel env add VITE_API_URL production
# 프롬프트에서 입력: https://zipcheck-production.up.railway.app
```

---

## Step 3: 프론트엔드 재배포

### 자동 배포 (Git Push)

```bash
cd F:\GOI\openui\frontend
git add .
git commit -m "Add admin dashboard and configure API URL"
git push
```

Vercel이 자동으로 감지하고 재배포합니다.

### 수동 배포 (Vercel CLI)

```bash
cd F:\GOI\openui\frontend
vercel --prod
```

---

## Step 4: 배포 확인

### 4-1. 빌드 로그 확인
Vercel 대시보드에서:
1. **Deployments** 탭
2. 최신 배포 클릭
3. **Build Logs** 확인

### 4-2. 배포 완료 후 테스트
1. https://frontend-omega-ten-49.vercel.app/admin/login 접속
2. 비밀번호 입력: `wlqcprwlqcprwlqcpr8282`
3. 로그인 성공 확인
4. `/admin` 대시보드로 리다이렉트 확인
5. 통계 데이터 로딩 확인

### 4-3. Network 탭 확인
브라우저 개발자 도구에서:
- **Network** 탭 열기
- 로그인 시도
- 요청 URL이 `https://zipcheck-production.up.railway.app/api/auth/admin/login`인지 확인
- ❌ `localhost:3001`로 요청하면 안됨!

---

## 문제 해결

### "Failed to fetch" 에러
**원인**: Vercel 환경 변수가 설정되지 않았거나, 재배포가 안됨

**해결**:
1. Vercel 대시보드 → Settings → Environment Variables 확인
2. `VITE_API_URL`이 있는지 확인
3. 없으면 추가 후 재배포
4. 있으면 **Redeploy** 클릭

### CORS 에러
**원인**: Railway `FRONTEND_URL` 환경 변수가 설정되지 않음

**해결**:
1. Railway 대시보드 → Variables 확인
2. `FRONTEND_URL=https://frontend-omega-ten-49.vercel.app` 추가
3. 재배포

### 로그인 실패 (401 Unauthorized)
**원인**: Railway `ADMIN_PASSWORD` 환경 변수가 다름

**해결**:
1. Railway 대시보드 → Variables 확인
2. `ADMIN_PASSWORD` 값이 정확한지 확인
3. Railway 로그 확인: `railway logs`

---

## 환경 변수 체크리스트

### Railway (백엔드)
- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_KEY`
- [x] `SUPABASE_ANON_KEY`
- [x] `ADMIN_PASSWORD`
- [x] `JWT_SECRET`
- [x] `NODE_ENV=production`
- [x] `PORT=3001`
- [ ] `FRONTEND_URL=https://frontend-omega-ten-49.vercel.app` ⬅️ **설정 필요**

### Vercel (프론트엔드)
- [ ] `VITE_API_URL=https://zipcheck-production.up.railway.app` ⬅️ **설정 필요**

---

## 다음 단계

1. [ ] Railway `FRONTEND_URL` 설정
2. [ ] Vercel `VITE_API_URL` 설정
3. [ ] 프론트엔드 재배포
4. [ ] 관리자 로그인 테스트
5. [ ] 대시보드 기능 테스트

---

**준비 완료!** Railway와 Vercel 대시보드에서 환경 변수를 설정하고 재배포하면 됩니다.
