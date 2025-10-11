# 네이버 로그인 OAuth 연동 설정 가이드

> ZipCheck 네이버 로그인 기능 구현을 위한 설정 가이드

---

## 📋 사전 준비

### 1. 네이버 개발자센터 회원가입
1. https://developers.naver.com 접속
2. 네이버 아이디로 로그인
3. 개발자센터 이용약관 동의

---

## 🔧 네이버 애플리케이션 등록

### 1. 애플리케이션 등록
1. 네이버 개발자센터 > **Application** > **애플리케이션 등록** 클릭
2. 애플리케이션 정보 입력:
   ```
   애플리케이션 이름: ZipCheck
   사용 API: 네이버 로그인
   ```

### 2. 제공 정보 선택
네이버 로그인 API에서 받을 정보 선택:
- ✅ 회원 이름
- ✅ 이메일 주소
- ✅ 휴대전화번호
- ⬜ 프로필 사진 (선택사항)

### 3. 로그인 오픈 API 서비스 환경 설정

#### 개발 환경 (localhost)
```
PC 웹: http://localhost:5173/auth/naver/callback
```

#### 운영 환경 (배포 후)
```
PC 웹: https://zipcheck.kr/auth/naver/callback
```

**중요**: 개발과 운영 환경을 모두 등록해야 합니다.

### 4. Client ID / Client Secret 발급
- 애플리케이션 등록 완료 후 자동 발급
- **Client ID**: 애플리케이션 식별자 (공개 가능)
- **Client Secret**: 비밀키 (**절대 노출 금지**)

---

## 🔐 환경변수 설정

### backend/.env 파일에 추가

```bash
# Naver OAuth Configuration
NAVER_CLIENT_ID=발급받은_클라이언트_ID
NAVER_CLIENT_SECRET=발급받은_클라이언트_시크릿
NAVER_CALLBACK_URL=http://localhost:5173/auth/naver/callback
```

**운영 환경**에서는 콜백 URL을 변경:
```bash
NAVER_CALLBACK_URL=https://zipcheck.kr/auth/naver/callback
```

---

## 📊 OAuth 2.0 인증 플로우

### 1. 사용자가 "네이버 로그인" 버튼 클릭
```
https://nid.naver.com/oauth2.0/authorize?
  response_type=code&
  client_id={CLIENT_ID}&
  redirect_uri={CALLBACK_URL}&
  state={STATE}
```

### 2. 네이버 로그인 페이지로 리다이렉트
- 사용자가 네이버 계정으로 로그인
- 정보 제공 동의

### 3. 콜백 URL로 인증 코드 전달
```
http://localhost:5173/auth/naver/callback?code=XXXXX&state=XXXXX
```

### 4. 백엔드에서 Access Token 요청
```bash
POST https://nid.naver.com/oauth2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id={CLIENT_ID}&
client_secret={CLIENT_SECRET}&
code={CODE}&
state={STATE}
```

### 5. 사용자 정보 조회
```bash
GET https://openapi.naver.com/v1/nid/me
Authorization: Bearer {ACCESS_TOKEN}
```

**응답 예시**:
```json
{
  "resultcode": "00",
  "message": "success",
  "response": {
    "id": "32742776",
    "email": "user@example.com",
    "name": "홍길동",
    "mobile": "010-1234-5678"
  }
}
```

---

## 🗄️ 데이터베이스 스키마 확장

### Supabase users 테이블 확장

```sql
-- 네이버 OAuth 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS naver_id VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20) DEFAULT 'naver';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW();

-- 네이버 ID로 빠른 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_naver_id ON users(naver_id);
```

---

## 🔒 보안 고려사항

### 1. State 파라미터
- CSRF 공격 방지를 위해 랜덤 문자열 생성
- 세션에 저장 후 콜백에서 검증
```typescript
const state = crypto.randomBytes(16).toString('hex')
```

### 2. Client Secret 보호
- ❌ 프론트엔드에 절대 노출 금지
- ✅ 백엔드 서버에서만 사용
- ✅ 환경변수로 관리

### 3. HTTPS 사용
- 운영 환경에서는 반드시 HTTPS 사용
- HTTP는 개발 환경에서만 허용

---

## 📝 API 엔드포인트 설계

### 백엔드 라우터

```typescript
// GET /api/auth/naver - 네이버 로그인 페이지로 리다이렉트
router.get('/naver', (req, res) => {
  const state = generateState()
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?...`
  res.redirect(naverAuthUrl)
})

// GET /api/auth/naver/callback - 네이버에서 콜백 처리
router.get('/naver/callback', async (req, res) => {
  const { code, state } = req.query
  // 1. Access Token 요청
  // 2. 사용자 정보 조회
  // 3. DB에 사용자 저장/업데이트
  // 4. JWT 토큰 발급
  // 5. 프론트엔드로 리다이렉트
})
```

---

## 🎨 프론트엔드 구현

### NaverLogin 컴포넌트
```typescript
const handleNaverLogin = () => {
  window.location.href = 'http://localhost:3001/api/auth/naver'
}
```

### 콜백 페이지
```typescript
// /auth/naver/callback 페이지
// URL에서 토큰 추출 후 저장
const token = new URLSearchParams(window.location.search).get('token')
localStorage.setItem('auth_token', token)
navigate('/') // 메인 페이지로 이동
```

---

## 🧪 테스트 시나리오

### 1. 로그인 성공 케이스
1. 네이버 로그인 버튼 클릭
2. 네이버 로그인 페이지에서 로그인
3. 정보 제공 동의
4. 메인 페이지로 리다이렉트
5. 사용자 정보 표시 확인

### 2. 이미 가입된 사용자
- 기존 계정 정보 업데이트
- Access Token 갱신

### 3. 에러 케이스
- 사용자가 동의 거부
- 네트워크 오류
- 잘못된 State 파라미터

---

## 📚 참고 자료

- [네이버 로그인 API 문서](https://developers.naver.com/docs/login/api/)
- [OAuth 2.0 개요](https://developers.naver.com/docs/login/overview/)
- [네이버 로그인 개발가이드](https://developers.naver.com/docs/login/devguide/)

---

## ✅ 체크리스트

구현 전 확인사항:

- [ ] 네이버 개발자센터 회원가입
- [ ] 애플리케이션 등록 완료
- [ ] Client ID/Secret 발급
- [ ] 콜백 URL 등록 (개발/운영)
- [ ] .env 파일에 키 등록
- [ ] DB 스키마 확장
- [ ] OAuth 라우터 구현
- [ ] 프론트엔드 컴포넌트 구현
- [ ] 로컬 환경 테스트
- [ ] 운영 환경 배포

---

**작성일**: 2025-01-10
**버전**: 1.0
