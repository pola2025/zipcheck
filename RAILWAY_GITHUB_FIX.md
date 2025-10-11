# Railway GitHub 저장소 연결 문제 해결

> 문제: "No repositories found" 오류

## 🔧 해결 방법

### 방법 1: GitHub에서 Railway App 권한 설정 (가장 확실한 방법)

1. **GitHub 설정 페이지 열기**
   ```
   https://github.com/settings/installations
   ```

2. **Railway 앱 찾기**
   - "Installed GitHub Apps" 섹션에서 "Railway" 찾기
   - **Configure** 버튼 클릭

3. **저장소 액세스 권한 부여**
   - "Repository access" 섹션에서:
     - **"Only select repositories"** 선택
     - **Select repositories** 드롭다운 클릭
     - **pola2025/zipcheck** 체크
   - 또는 **"All repositories"** 선택 (모든 저장소 액세스)

4. **저장**
   - **Save** 버튼 클릭
   - GitHub에서 권한 승인

5. **Railway 대시보드로 돌아가기**
   - 페이지 새로고침 (F5)
   - "Deploy from GitHub repo" 다시 시도
   - 검색창에 "zipcheck" 입력

---

### 방법 2: Railway 대시보드에서 직접 설정

1. **Railway 프로젝트 생성 페이지**
   ```
   https://railway.app/new
   ```

2. **"Deploy from GitHub repo" 선택**

3. **"Configure GitHub App" 클릭**
   - 파란색 링크 또는 버튼
   - GitHub 설정 페이지로 리다이렉트

4. **위 방법 1의 3-5단계 동일하게 진행**

---

### 방법 3: Railway CLI 로컬 배포 (대안)

```bash
# Railway CLI 로그인 (브라우저 열림)
railway login

# 백엔드 폴더로 이동
cd F:\GOI\backend

# Railway 프로젝트 링크
railway link

# 또는 새 프로젝트 생성
railway init

# 배포
railway up
```

**장점**: GitHub 연결 없이 바로 배포 가능
**단점**: 자동 배포 안됨 (git push 시 자동 배포 X)

---

## ✅ 확인 체크리스트

Railway 대시보드에서 저장소가 보이는지 확인:

- [ ] GitHub Settings → Installations → Railway 확인
- [ ] pola2025/zipcheck 저장소 액세스 권한 있음
- [ ] Railway 페이지 새로고침
- [ ] "Deploy from GitHub repo" 에서 zipcheck 검색 시 표시됨

---

## 🚨 여전히 안 보이는 경우

### 가능한 원인:

1. **GitHub App 설치 안됨**
   - Railway 앱이 GitHub에 설치되지 않음
   - 해결: https://github.com/apps/railway 에서 "Install" 클릭

2. **저장소가 Organization 소유**
   - Organization 저장소는 Organization 관리자만 권한 부여 가능
   - 해결: Organization 설정에서 Railway App 승인

3. **캐시 문제**
   - Railway가 저장소 목록을 캐시함
   - 해결: 브라우저 캐시 삭제 또는 시크릿 모드 시도

4. **Railway 계정 문제**
   - Railway와 GitHub 계정 연결 끊김
   - 해결: Railway Dashboard → Account Settings → Connected Accounts 확인

---

## 📞 다음 단계

저장소 연결 성공 후:

1. ✅ Railway 프로젝트 생성
2. ➡️ Root Directory 설정: `backend`
3. ➡️ 환경변수 추가
4. ➡️ 도메인 생성
5. ➡️ 배포 확인

---

**작성일**: 2025-01-10
**GitHub 저장소**: https://github.com/pola2025/zipcheck
