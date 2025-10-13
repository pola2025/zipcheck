# Railway FRONTEND_URL 빠른 설정 가이드

## 🚀 30초 안에 완료하기

Railway CLI가 interactive 모드를 요구하여 자동화가 불가능합니다.
다음 방법으로 빠르게 설정하세요:

---

## 방법 1: Railway 대시보드 (가장 빠름)

### 1단계: Railway 프로젝트 열기
```
https://railway.app/project/zipcheck
```

### 2단계: 서비스 선택
- **zipcheck** 서비스 클릭

### 3단계: 환경 변수 추가
1. **Variables** 탭 클릭
2. **New Variable** 클릭
3. 입력:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://frontend-omega-ten-49.vercel.app`
4. **Add** 클릭

✅ **자동 재배포 시작** (약 1-2분 소요)

---

## 방법 2: Railway CLI (수동)

터미널을 새로 열어서 실행:

```powershell
# 1. 백엔드 디렉토리로 이동
cd F:\GOI\backend

# 2. 서비스 선택 (interactive)
railway service
# → 화살표 키로 "zipcheck" 선택 후 Enter

# 3. 환경 변수 설정
railway variables --set "FRONTEND_URL=https://frontend-omega-ten-49.vercel.app"

# 4. 확인
railway variables
```

---

## ✅ 설정 완료 확인

### 1. Railway 로그 확인
```
railway logs
```

**예상 로그:**
```
🚀 ZipCheck Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: https://zipcheck-production.up.railway.app
🗄️  Database: Supabase
🔍 Environment: production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. 관리자 로그인 테스트
```
URL: https://frontend-omega-ten-49.vercel.app/admin/login
비밀번호: wlqcprwlqcprwlqcpr8282
```

**성공 확인:**
- ✅ 로그인 성공
- ✅ `/admin` 대시보드로 리다이렉트
- ✅ 통계 데이터 표시 (전체 견적 요청: 3건)

---

## 🔧 문제 해결

### "Failed to fetch" 에러가 계속 발생하는 경우

**원인**: Railway CORS 설정 문제

**해결**:
1. Railway 대시보드 확인
2. `FRONTEND_URL` 값이 정확한지 확인
3. 재배포 완료 대기 (1-2분)
4. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
5. 재시도

### Railway 환경 변수 확인
```bash
cd backend
railway variables
```

**예상 출력:**
```
FRONTEND_URL=https://frontend-omega-ten-49.vercel.app
ADMIN_PASSWORD=***
JWT_SECRET=***
SUPABASE_URL=https://qfnqxzabcuzhkwptfnpa.supabase.co
...
```

---

## 📊 현재 상태

✅ **완료된 작업:**
- Railway 백엔드 배포
- Vercel 프론트엔드 배포
- Vercel 환경 변수 설정 (`VITE_API_URL`)
- 예시 데이터 생성 (3건)
- 관리자 대시보드 페이지

⏳ **남은 작업:**
- Railway `FRONTEND_URL` 설정 ⬅️ **여기만 완료하면 됩니다!**

---

**Railway 대시보드에서 `FRONTEND_URL` 설정하고 1-2분 후 테스트하세요!** 🎯

위 링크를 클릭하면 바로 Railway 대시보드가 열립니다:
👉 https://railway.app/project/zipcheck
