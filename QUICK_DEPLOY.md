# ZipCheck 빠른 배포 가이드

> GitHub 저장소: https://github.com/pola2025/zipcheck

---

## 🚂 Railway 백엔드 배포 (5분)

### 1. Railway 대시보드 접속
https://railway.app/dashboard

### 2. 새 프로젝트 생성
1. **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. **Configure GitHub App** → pola2025/zipcheck 저장소 선택
4. **Deploy** 클릭

### 3. Root Directory 설정
1. 배포된 프로젝트 클릭
2. **Settings** 탭
3. **Service** → **Root Directory** 설정: `backend`
4. **Save Changes**

### 4. 환경변수 설정
**Settings** → **Variables** 탭에서 다음 추가:

```bash
# 필수 환경변수
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
CLAUDE_API_KEY=your_claude_api_key
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=3001

# 네이버 로그인 (나중에 설정)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_secret
NAVER_CALLBACK_URL=https://your-vercel-app.vercel.app/auth/naver/callback

# CORS (Vercel 배포 후 업데이트)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Environment 선택:** Production (또는 모든 환경)

### 5. 도메인 확인
1. **Settings** → **Networking** → **Public Networking**
2. **Generate Domain** 클릭 (아직 없다면)
3. 생성된 URL 복사: `https://zipcheck-backend-production.up.railway.app`

### 6. 배포 확인
**Deployments** 탭에서 배포 상태 확인:
- ✅ **SUCCESS** - 배포 완료
- ⏳ **BUILDING** - 빌드 중
- ❌ **FAILED** - 로그 확인 필요

**헬스체크:**
```bash
curl https://your-railway-url.up.railway.app/health
```

---

## ▲ Vercel 프론트엔드 배포 (5분)

### 1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2. 새 프로젝트 Import
1. **Add New** → **Project** 클릭
2. **Import Git Repository**
3. `pola2025/zipcheck` 검색 및 선택
4. **Import** 클릭

### 3. 프로젝트 설정
**Configure Project** 화면에서:

- **Framework Preset:** Vite (자동 감지)
- **Root Directory:** `openui/frontend` (← 중요!)
- **Build Command:** `npm run build` (자동)
- **Output Directory:** `dist` (자동)

### 4. 환경변수 설정
**Environment Variables** 섹션에서:

```bash
VITE_API_URL=https://zipcheck-backend-production.up.railway.app
```

(Railway에서 생성된 URL 입력)

### 5. 배포
**Deploy** 클릭!

### 6. 도메인 확인
배포 완료 후:
- Vercel 도메인: `https://zipcheck-xxx.vercel.app`
- **Visit** 버튼으로 사이트 확인

---

## 🔄 Railway CORS 업데이트

Vercel 배포 완료 후 Railway로 돌아가서:

1. **Settings** → **Variables**
2. `FRONTEND_URL` 변수 업데이트:
   ```
   FRONTEND_URL=https://zipcheck-xxx.vercel.app
   ```
3. 자동 재배포 (또는 **Deployments** → **Redeploy** 클릭)

---

## ✅ 배포 확인 체크리스트

### Railway (백엔드)
- [ ] 배포 상태: SUCCESS
- [ ] 도메인 생성 완료
- [ ] 환경변수 모두 설정
- [ ] 헬스체크 성공: `/health` 엔드포인트 200 OK

### Vercel (프론트엔드)
- [ ] 배포 상태: Ready
- [ ] Root Directory: `openui/frontend` 설정
- [ ] 환경변수 `VITE_API_URL` 설정
- [ ] 사이트 접속 가능

### 통합 테스트
- [ ] 메인 페이지 로딩
- [ ] 커뮤니티 페이지 접속
- [ ] API 호출 확인 (Network 탭)
- [ ] 이미지 로딩 확인

---

## 🚨 트러블슈팅

### Railway 빌드 실패
```bash
# 로그 확인
Deployments → 실패한 배포 클릭 → View Logs

# 일반적인 문제
1. Node.js 버전 - package.json에 engines 추가
2. 환경변수 누락 - Variables 탭 확인
3. TypeScript 에러 - 로컬에서 npm run build 테스트
```

### Vercel 빌드 실패
```bash
# 일반적인 문제
1. Root Directory 잘못됨 - "openui/frontend" 확인
2. 환경변수 누락 - VITE_API_URL 확인
3. Node 버전 - Settings → Node.js Version
```

### CORS 오류 (브라우저 콘솔)
```
Railway Variables에서 FRONTEND_URL 확인
→ Vercel 도메인과 일치해야 함
→ 변경 후 Railway 재배포
```

### API 호출 실패 (Network 탭에서 확인)
```
Vercel 환경변수 VITE_API_URL 확인
→ Railway 도메인과 일치해야 함
→ 변경 후 Vercel 재배포
```

---

## 📊 배포 URL 요약

| 서비스 | URL | 비고 |
|--------|-----|------|
| GitHub | https://github.com/pola2025/zipcheck | 소스 코드 |
| Railway (백엔드) | `https://zipcheck-backend-production.up.railway.app` | API 서버 |
| Vercel (프론트엔드) | `https://zipcheck-xxx.vercel.app` | 웹사이트 |
| Supabase | `https://xxx.supabase.co` | 데이터베이스 |

---

## 🔄 업데이트 배포

### 코드 변경 후
```bash
git add .
git commit -m "Update: 설명"
git push
```

- Railway: 자동 배포 (GitHub 감지)
- Vercel: 자동 배포 (GitHub 감지)

---

**배포 완료되면 사이트 URL을 확인하세요!** 🎉
