# 전체 자동 배포 연결 점검 가이드

Railway (Backend)와 Vercel (Frontend) 자동 배포 설정을 점검합니다.

---

## 🎯 프로젝트 구조

```
zipcheck/
├── backend/          → Railway 배포
│   ├── src/
│   ├── package.json
│   └── railway.json
└── frontend/         → Vercel 배포
    ├── src/
    └── package.json
```

---

## 🚂 Railway (Backend) 자동 배포 점검

### 1️⃣ GitHub 연동 확인

**Railway 대시보드:**
https://railway.app/project/68815b25-bbcd-4867-8f46-2edc358b03b5

1. **Backend 서비스** 클릭
2. **Settings** 탭 → **Source** 섹션 확인

   ✅ **올바른 설정:**
   ```
   Repository: pola2025/zipcheck
   Branch: master
   Root Directory: /backend
   ```

3. **Deployment** 섹션 확인
   - ✅ Deploy on Push: **Enabled**
   - ✅ Auto Deploy: **Enabled**
   - Watch Paths: **비어있음** 또는 `backend/**`

### 2️⃣ GitHub Webhook 확인

**GitHub 저장소 설정:**
https://github.com/pola2025/zipcheck/settings/hooks

- Railway webhook이 있어야 함
- 최근 Deliveries 확인 (실패 없어야 함)

### 3️⃣ Railway 빌드 설정

**Settings → Build:**
```bash
Build Command: npm install && npm run build
Start Command: npm start
Root Directory: /backend
```

---

## ▲ Vercel (Frontend) 자동 배포 점검

### 1️⃣ GitHub 연동 확인

**Vercel 대시보드:**
https://vercel.com/dashboard

1. **zipcheck 프로젝트** 클릭
2. **Settings** 탭 → **Git** 섹션 확인

   ✅ **올바른 설정:**
   ```
   Repository: pola2025/zipcheck
   Production Branch: master
   Root Directory: frontend
   ```

### 2️⃣ GitHub 앱 권한 확인

**GitHub 설정:**
https://github.com/settings/installations

- **Vercel** 앱 찾기 → **Configure**
- **pola2025/zipcheck** 저장소 접근 권한 확인

### 3️⃣ Vercel 빌드 설정

**Settings → Build & Development Settings:**
```
Framework Preset: Vite (또는 자동 감지)
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4️⃣ Git 설정 확인

**Settings → Git:**
- ✅ **Production Branch:** master
- ✅ **Ignored Build Step:** 비활성화
- ✅ **Root Directory:** frontend

---

## 🔍 공통 문제 해결

### A. GitHub 앱 재설치

**Railway + Vercel 모두:**

1. GitHub 앱 페이지
   - https://github.com/settings/installations

2. **Railway** 앱:
   - Configure → Repository access 확인
   - pola2025/zipcheck 선택됨

3. **Vercel** 앱:
   - Configure → Repository access 확인
   - pola2025/zipcheck 선택됨

### B. Webhook 재생성

**Railway:**
- Settings → Source → Disconnect → 다시 Connect

**Vercel:**
- Settings → Git → Disconnect → 다시 Connect

### C. 브랜치 확인

```bash
# 로컬에서 확인
git branch
# * master  ← 현재 브랜치

# Railway 설정: master
# Vercel 설정: master
# 모두 일치해야 함
```

---

## 🧪 자동 배포 테스트

### 테스트 1: Backend 변경

```bash
cd F:\GOI
echo "// Railway test" >> backend/src/index.ts
git add backend/src/index.ts
git commit -m "test: Railway auto-deploy"
git push origin master
```

**기대 결과:**
- Railway가 30초 이내 새 배포 시작
- Vercel은 배포하지 않음 (backend 변경이므로)

### 테스트 2: Frontend 변경

```bash
cd F:\GOI
echo "// Vercel test" >> frontend/src/App.tsx
git add frontend/src/App.tsx
git commit -m "test: Vercel auto-deploy"
git push origin master
```

**기대 결과:**
- Vercel이 즉시 새 배포 시작
- Railway는 배포하지 않음 (frontend 변경이므로)

### 테스트 3: 둘 다 변경

```bash
cd F:\GOI
git commit --allow-empty -m "test: full auto-deploy"
git push origin master
```

**기대 결과:**
- Railway와 Vercel 둘 다 배포 시작

---

## 📊 현재 설정 요약

### Railway (Backend)
- **프로젝트:** zipcheck
- **URL:** https://zipcheck-production.up.railway.app
- **Branch:** master
- **Root:** /backend
- **환경 변수:**
  - NOTION_API_KEY ✅
  - NOTION_DATABASE_ID ✅
  - NOTION_CUSTOMER_REQUEST_DB_ID ✅ (신규 추가)

### Vercel (Frontend)
- **프로젝트:** zipcheck
- **Production URL:** https://zcheck.co.kr
- **Branch:** master
- **Root:** frontend
- **환경 변수:**
  - VITE_API_URL=https://zipcheck-production.up.railway.app

---

## 🆘 여전히 안 되는 경우

### 1. Railway 로그 확인
```bash
# Railway 대시보드에서
Deployments → 최근 배포 클릭 → View Logs
```

### 2. Vercel 로그 확인
```bash
# Vercel 대시보드에서
Deployments → 최근 배포 클릭 → View Function Logs
```

### 3. GitHub Webhook 로그 확인
```bash
# GitHub 저장소에서
Settings → Webhooks → 각 webhook 클릭 → Recent Deliveries
```

### 4. 강제 재연결
- Railway: Settings → Source → Disconnect → Connect
- Vercel: Settings → Git → Disconnect → Connect

---

## ✅ 체크리스트

완료 후 확인:

**Railway (Backend):**
- [ ] GitHub 저장소 연결됨
- [ ] Branch: master
- [ ] Root Directory: /backend
- [ ] Deploy on Push: Enabled
- [ ] Watch Paths: 비어있음 또는 backend/**
- [ ] 환경 변수 모두 설정됨

**Vercel (Frontend):**
- [ ] GitHub 저장소 연결됨
- [ ] Production Branch: master
- [ ] Root Directory: frontend
- [ ] Build Command 설정됨
- [ ] 환경 변수 모두 설정됨

**GitHub:**
- [ ] Railway 앱 설치됨
- [ ] Vercel 앱 설치됨
- [ ] 둘 다 zipcheck 저장소 접근 권한 있음
- [ ] Webhooks 활성화됨

**테스트:**
- [ ] 빈 커밋으로 자동 배포 검증 완료

---

**작성일:** 2025-10-14
**작성자:** Claude Code
