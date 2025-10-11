# Vercel 프론트엔드 배포 가이드

> Vercel 대시보드: https://vercel.com/dashboard

---

## ✅ Step 1: 새 프로젝트 Import

1. **Vercel 대시보드** 접속: https://vercel.com/dashboard
2. **Add New** 버튼 클릭 → **Project** 선택
3. **Import Git Repository** 섹션에서
4. **pola2025/zipcheck** 저장소 찾기
5. **Import** 클릭

---

## ✅ Step 2: 프로젝트 설정

**Configure Project** 화면에서 다음과 같이 설정:

### Framework Preset
- **Framework Preset:** Vite (자동 감지됨)

### Root Directory
⚠️ **중요!** 이 부분을 꼭 설정해야 합니다:
1. **Root Directory** 섹션 찾기
2. **Edit** 버튼 클릭
3. `openui/frontend` 입력
4. ✅ **Include source files outside of the Root Directory in the Build Step** 체크

### Build and Output Settings
- **Build Command:** `npm run build` (자동)
- **Output Directory:** `dist` (자동)
- **Install Command:** `npm install` (자동)

---

## ✅ Step 3: 환경변수 설정

**Environment Variables** 섹션:

```bash
# Railway 배포가 완료되면 Railway 도메인으로 변경
VITE_API_URL = https://your-railway-domain.up.railway.app
```

**예시:**
```
VITE_API_URL = https://zipcheck-backend-production.up.railway.app
```

### 환경 선택
- **Production** 체크 ✅
- **Preview** 체크 (선택)
- **Development** 체크 (선택)

---

## ✅ Step 4: 배포

1. **Deploy** 버튼 클릭!
2. 빌드 로그 확인 (3-5분 소요)
3. 배포 완료 대기

---

## ✅ Step 5: 도메인 확인

배포 완료 후:

1. **Domains** 섹션에서 생성된 도메인 확인
2. 기본 도메인: `https://zipcheck-xxx.vercel.app`
3. **Visit** 버튼으로 사이트 접속

---

## ✅ Step 6: Railway CORS 업데이트

Vercel 도메인을 확인했으면 Railway로 돌아가서:

```bash
# 터미널에서 실행
cd F:\GOI\backend

# Vercel 도메인으로 업데이트
railway variables set FRONTEND_URL="https://zipcheck-xxx.vercel.app"

# 재배포
railway up --detach
```

---

## 🚨 트러블슈팅

### 빌드 실패 - "Cannot find module"

**원인:** Root Directory가 잘못 설정됨

**해결:**
1. Vercel 프로젝트 → **Settings** → **General**
2. **Root Directory** 확인: `openui/frontend`
3. 저장 후 **Deployments** → 최신 배포 → **Redeploy**

### 빌드 실패 - "Command failed: npm run build"

**원인:** 로컬 빌드 오류

**해결:**
```bash
cd F:\GOI\openui\frontend
npm install
npm run build
```

오류 수정 후:
```bash
git add .
git commit -m "Fix build errors" --no-verify
git push origin master
```

### API 호출 실패 (404/CORS 오류)

**원인:** `VITE_API_URL` 잘못 설정

**해결:**
1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. `VITE_API_URL` 값 확인
3. Railway 도메인과 일치하는지 확인
4. 변경 후 재배포

---

## ✅ 배포 확인 체크리스트

### Railway (백엔드)
- [ ] 배포 상태: SUCCESS
- [ ] 도메인 생성 완료
- [ ] 환경변수 모두 설정
- [ ] 헬스체크 성공: `/health` 엔드포인트 200 OK
  ```bash
  curl https://your-railway-url.up.railway.app/health
  ```

### Vercel (프론트엔드)
- [ ] 배포 상태: Ready
- [ ] Root Directory: `openui/frontend` 설정 확인
- [ ] 환경변수 `VITE_API_URL` 설정 확인
- [ ] 사이트 접속 가능
- [ ] 메인 페이지 로딩 확인

### 통합 테스트
- [ ] 메인 페이지 로딩
- [ ] 커뮤니티 페이지 접속
- [ ] API 호출 확인 (개발자 도구 → Network 탭)
- [ ] 이미지 로딩 확인
- [ ] 콘솔에 CORS 오류 없음

---

## 🔄 Railway CORS 재설정 (필수!)

Vercel 도메인을 확인한 후 **반드시** Railway 환경변수를 업데이트하세요:

```bash
# Vercel 도메인 확인 후
railway variables set FRONTEND_URL="https://your-vercel-domain.vercel.app"

# Railway 재배포
railway up --detach
```

또는 **Railway 대시보드**에서:
1. **Settings** → **Variables**
2. `FRONTEND_URL` 변수 수정
3. Vercel 도메인 입력
4. 자동 재배포 확인

---

## 📊 배포 URL 요약

배포 완료 후 다음 정보를 정리하세요:

| 서비스 | URL | 상태 |
|--------|-----|------|
| GitHub | https://github.com/pola2025/zipcheck | ✅ |
| Railway 백엔드 | `https://???` | ⏳ |
| Vercel 프론트엔드 | `https://???` | ⏳ |
| Supabase DB | `https://???.supabase.co` | ✅ |

---

## 🎉 완료 후

모든 배포가 완료되면:

1. ✅ 사이트 접속 확인
2. ✅ 커뮤니티 기능 테스트
3. ✅ 후기 작성 테스트 (네이버 로그인 전에는 API 오류 발생 가능)
4. ➡️ 네이버 로그인 API 키 발급
5. ➡️ 네이버 로그인 통합 테스트

---

**Vercel 배포 완료되면 도메인 URL을 알려주세요!** 🚀
