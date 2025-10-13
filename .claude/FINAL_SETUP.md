# 최종 설정 완료 가이드

## ✅ 완료된 작업

1. ✅ Railway 백엔드 배포: `https://zipcheck-production.up.railway.app/`
2. ✅ Vercel 환경 변수 설정: `VITE_API_URL=https://zipcheck-production.up.railway.app`
3. ✅ Vercel 프론트엔드 배포 완료
4. ✅ 관리자 대시보드 페이지 생성 (`/admin` 경로)
5. ✅ API URL 환경 변수화 (하드코딩 제거)
6. ✅ 보안 가이드라인 문서 작성

---

## ⚠️ 마지막 단계 (수동 작업 필요)

### Railway FRONTEND_URL 설정

Railway CLI가 서비스에 링크되지 않아 수동으로 설정해야 합니다.

**Railway 대시보드에서:**

1. https://railway.app/project/zipcheck 접속
2. 백엔드 서비스 선택
3. **Variables** 탭 클릭
4. **New Variable** 또는 기존 `FRONTEND_URL` 수정:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://frontend-omega-ten-49.vercel.app`
5. **Save** 클릭 (자동 재배포됨)

---

## 🧪 테스트 방법

### 1. 관리자 로그인 테스트

```
URL: https://frontend-omega-ten-49.vercel.app/admin/login
비밀번호: wlqcprwlqcprwlqcpr8282
```

### 2. 확인 사항

**브라우저 개발자 도구 (F12) → Network 탭:**

로그인 버튼 클릭 시:
- ✅ 요청 URL: `https://zipcheck-production.up.railway.app/api/auth/admin/login`
- ✅ 응답 상태: `200 OK`
- ✅ 응답에 `token`과 `user` 포함

**로그인 성공 시:**
- ✅ `/admin` 대시보드로 리다이렉트
- ✅ 통계 카드에 데이터 표시
- ✅ "환영합니다, admin님" 표시

### 3. 예상되는 문제

#### "Failed to fetch" 에러
**원인:** Railway `FRONTEND_URL`이 설정되지 않음 (CORS 에러)

**해결:**
1. Railway 대시보드 → Variables
2. `FRONTEND_URL=https://frontend-omega-ten-49.vercel.app` 설정
3. 재배포 대기

#### 로그인 후 빈 대시보드
**원인:** API에서 데이터를 가져오지 못함

**확인:**
1. Railway 로그 확인
2. Backend URL이 올바른지 확인
3. Admin 토큰이 유효한지 확인

---

## 📋 환경 변수 체크리스트

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
- [x] `VITE_API_URL=https://zipcheck-production.up.railway.app` ✅ **완료**

---

## 🚀 배포 URL

- **프론트엔드**: https://frontend-omega-ten-49.vercel.app
- **백엔드**: https://zipcheck-production.up.railway.app
- **관리자 로그인**: https://frontend-omega-ten-49.vercel.app/admin/login
- **관리자 대시보드**: https://frontend-omega-ten-49.vercel.app/admin

---

## 📝 보안 참고사항

모든 보안 가이드라인은 다음 문서를 참조:
- `.claude/SECURITY_GUIDELINES.md`

**중요:**
- `.env` 파일은 절대 Git에 커밋하지 않음
- 모든 API 키와 비밀번호는 환경 변수로 관리
- Railway/Vercel 대시보드에서만 설정

---

**마지막 단계:** Railway 대시보드에서 `FRONTEND_URL`을 설정하고 테스트하세요!
