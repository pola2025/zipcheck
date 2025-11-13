# Railway 자동 배포 연결 점검 체크리스트

Railway와 GitHub 자동 배포가 작동하지 않는 문제를 해결하기 위한 단계별 가이드입니다.

---

## 🔍 1단계: GitHub 연동 확인

### Railway 대시보드에서 확인

1. **Railway 프로젝트 열기**
   - https://railway.app/project/68815b25-bbcd-4867-8f46-2edc358b03b5

2. **Backend 서비스 클릭**

3. **Settings 탭** 클릭

4. **Source 섹션 확인:**

   ✅ **정상인 경우:**
   ```
   Source
   ├── Repository: pola2025/zipcheck
   ├── Branch: master
   └── Root Directory: /backend (또는 /)
   ```

   ❌ **문제가 있는 경우:**
   - Repository가 연결되어 있지 않음
   - Branch가 다름 (main vs master)
   - Root Directory가 잘못됨

---

## 🔧 2단계: GitHub 연동 재설정 (문제가 있다면)

### A. GitHub 앱 권한 확인

1. GitHub 설정 페이지 열기:
   - https://github.com/settings/installations

2. **Railway** 찾기

3. **Configure** 클릭

4. **Repository access 확인:**
   - ✅ "All repositories" 선택되어 있거나
   - ✅ "pola2025/zipcheck" 저장소가 선택되어 있어야 함

5. 선택되어 있지 않다면:
   - **"Select repositories"** → **"pola2025/zipcheck"** 선택
   - **Save** 클릭

### B. Railway에서 재연결

1. Railway 대시보드 → Backend 서비스 → **Settings**

2. **Source 섹션에서:**

   **방법 1: 이미 연결된 경우**
   - **"Disconnect Source"** 클릭
   - 다시 **"Connect Repository"** 클릭
   - **pola2025/zipcheck** 선택
   - **Branch: master** 선택
   - **Root Directory: /backend** 또는 **/** (프로젝트 루트)

   **방법 2: 연결되지 않은 경우**
   - **"Connect Repository"** 클릭
   - **GitHub** 선택
   - **pola2025/zipcheck** 선택
   - **Branch: master** 선택
   - **Root Directory 설정**

---

## ⚙️ 3단계: Watch Paths 설정 확인

Railway가 변경을 감지하는 경로를 확인합니다.

### Settings → Deployment 섹션

**Watch Paths (선택사항):**

- **비어있음** (권장): 모든 변경사항을 감지
- **설정되어 있다면**: `backend/**` 또는 `/backend/**`

❌ **잘못된 설정 예시:**
```
frontend/**  (backend 변경사항을 감지 못함)
```

✅ **올바른 설정:**
```
(비어있음) - 추천
또는
backend/**
```

---

## 🔄 4단계: Deployment Triggers 확인

### Settings → Deployment 섹션

**Deploy on Push:**
- ✅ **켜져있어야 함** (Enabled)

**Auto Deploy:**
- ✅ **켜져있어야 함** (Enabled)

**Deploy on Pull Request:**
- 선택사항 (원하는 대로)

---

## 🏗️ 5단계: Build & Start 명령 확인

### Settings → Deployment 섹션

**Build Command:**
```bash
npm install && npm run build
```
또는
```bash
yarn install && yarn build
```

**Start Command:**
```bash
npm start
```
또는
```bash
node dist/index.js
```

**Root Directory:**
- `/backend` (backend 폴더가 프로젝트 루트가 아닌 경우)
- 또는 비어있음 (backend 폴더가 루트인 경우)

---

## 🧪 6단계: 테스트 커밋으로 검증

설정을 수정한 후 테스트 커밋으로 자동 배포를 확인합니다.

### 로컬에서 실행:

```bash
cd F:\GOI
git commit --allow-empty -m "test: Railway auto-deploy verification"
git push origin master
```

### Railway에서 확인:

1. **Deployments 탭** 열기
2. **30초 이내**에 새 배포가 시작되어야 함
3. 배포 상태:
   - 🔵 Building
   - 🔵 Deploying
   - ✅ Active

---

## 🆘 문제가 계속되는 경우

### 확인해야 할 추가 사항:

1. **GitHub Webhook 확인**
   - GitHub 저장소: https://github.com/pola2025/zipcheck/settings/hooks
   - Railway webhook이 있어야 함
   - 최근 Deliveries에 실패가 없어야 함

2. **Railway 계정 상태**
   - 결제/크레딧 문제로 인한 일시 중지 확인

3. **브랜치 이름 확인**
   ```bash
   git branch
   # 현재: master
   # Railway 설정: master (일치해야 함)
   ```

4. **Railway 프로젝트 Region 확인**
   - Settings → Region이 설정되어 있는지 확인

---

## 📋 현재 프로젝트 정보

- **GitHub 저장소:** https://github.com/pola2025/zipcheck
- **브랜치:** master
- **Railway 프로젝트:** https://railway.app/project/68815b25-bbcd-4867-8f46-2edc358b03b5
- **Backend URL:** https://zipcheck-production.up.railway.app
- **프로젝트 구조:**
  ```
  zipcheck/
  ├── backend/          ← Railway가 여기를 배포
  │   ├── src/
  │   ├── package.json
  │   └── railway.json
  └── frontend/
  ```

---

## ✅ 최종 확인 사항

모든 설정을 완료한 후:

- [ ] GitHub에 Railway 앱이 설치되어 있음
- [ ] Railway에 pola2025/zipcheck 저장소가 연결됨
- [ ] Branch가 master로 설정됨
- [ ] Root Directory가 올바르게 설정됨 (/backend 또는 비어있음)
- [ ] "Deploy on Push"가 활성화됨
- [ ] Watch Paths가 비어있거나 backend/** 로 설정됨
- [ ] 테스트 커밋으로 자동 배포 검증 완료

---

**작성일:** 2025-10-14
**작성자:** Claude Code
