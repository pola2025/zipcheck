# Claude Code 에이전트 규칙

이 프로젝트의 모든 Claude Code 에이전트는 다음 규칙을 준수해야 합니다.

---

## 🔐 보안 규칙 (항상 준수)

### 1. 환경 변수 관리

**절대 하지 말아야 할 것:**
```typescript
// ❌ 하드코딩 금지
const API_KEY = "sk-ant-api03-..."
const ADMIN_PASSWORD = "wlqcprwlqcprwlqcpr8282"
const API_URL = "http://localhost:3001"
```

**올바른 방법:**
```typescript
// ✅ 환경 변수 사용
const API_KEY = process.env.CLAUDE_API_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL
```

### 2. Git 보안

**절대 커밋하지 말아야 할 것:**
- `.env`, `.env.*` (환경 변수 파일)
- `*.key`, `*.pem` (인증서 및 키 파일)
- `credentials.json` (자격증명 파일)
- API 키, 비밀번호, 토큰이 포함된 모든 파일

**항상 확인:**
- `.gitignore`에 환경 변수 파일 포함 여부
- 커밋 전 민감한 정보 포함 여부 검토
- `.env.example` 템플릿만 커밋 (실제 값 제외)

### 3. 코드 작성 규칙

**주석에도 보안 정보 포함 금지:**
```typescript
// ❌ 주석에 민감한 정보 포함 금지
// API_KEY: sk-ant-api03-xxxxx
// PASSWORD: wlqcprwlqcprwlqcpr8282

// ✅ 일반적인 설명만 포함
// API 키는 환경 변수에서 로드됩니다
```

**URL 하드코딩 금지:**
```typescript
// ❌ localhost 하드코딩
fetch('http://localhost:3001/api/auth/admin/login')

// ✅ 환경 변수 사용
fetch(`${API_URL}/api/auth/admin/login`)
```

---

## 📁 프로젝트 구조

### 환경 변수 파일 위치
- Backend: `backend/.env`, `backend/.env.production`
- Frontend: `openui/frontend/.env.local`, `openui/frontend/.env.production`

### 환경 변수 템플릿
- Backend: `backend/.env.example`
- Frontend: `openui/frontend/.env.example`

### 보안 문서
- `.claude/SECURITY_GUIDELINES.md` - 상세 보안 가이드라인

---

## 🚀 배포 환경

### Railway (Backend)
- URL: `https://zipcheck-production.up.railway.app`
- 환경 변수는 Railway 대시보드에서 설정

### Vercel (Frontend)
- Production URL: `https://zcheck.co.kr` (커스텀 도메인)
- Preview URL: Vercel이 자동 생성 (각 커밋마다)
- 환경 변수는 Vercel 대시보드에서 설정

---

## 🔍 배포 확인 및 검증 절차

**사용자에게 스크린샷을 요청하기 전에 반드시 다음 단계를 수행:**

### 1. Vercel 배포 상태 확인

```bash
cd frontend
npx vercel ls
```

**확인 사항:**
- 최근 Production 배포 시간
- 최근 Preview 배포 시간
- Production vs Preview 배포 간격
- 배포 상태 (● Ready, ⚠️ Error 등)

**예시 출력:**
```
Age     Deployment                                                       Status      Environment
27m     https://zipcheck-g85k5c8za-mkt9834-4301s-projects.vercel.app     ● Ready     Preview
3h      https://zipcheck-dyzelkzz0-mkt9834-4301s-projects.vercel.app     ● Ready     Production
```

**문제 판단:**
- ❌ Production이 3시간 전인데 Preview는 27분 전 → Preview가 Production으로 승격 안됨
- ✅ Production과 Preview 시간이 비슷 → 정상 배포됨

### 2. Git 커밋 이력 확인

```bash
git log --oneline -10
```

**확인 사항:**
- 최근 커밋 해시와 메시지
- 변경사항이 포함된 커밋이 언제 푸시되었는지

### 3. 배포된 커밋 확인

```bash
# 특정 배포의 커밋 해시 확인
npx vercel inspect <deployment-url>
```

또는 Vercel 대시보드에서:
- Deployments 탭 → 최근 배포 클릭
- "Source" 섹션에서 Git 커밋 해시 확인
- 해당 커밋과 로컬 커밋 비교

### 4. Production 배포 강제 실행 (필요 시)

**Preview가 Production으로 승격되지 않았을 경우:**

```bash
# 특정 배포를 Production으로 승격
npx vercel promote <preview-url>

# 또는 Vercel 대시보드에서:
# Deployments → Preview 배포 → "Promote to Production" 버튼 클릭
```

### 5. 빌드 로그 확인

```bash
# 최근 배포의 빌드 로그 확인
npx vercel logs <deployment-url>
```

**확인 사항:**
- 빌드 성공/실패 여부
- TypeScript 에러
- 의존성 문제
- 빌드 경고

### 6. 변경사항 직접 확인

**Preview URL로 확인:**
1. 최근 Preview 배포 URL 복사
2. 해당 URL에서 변경사항 확인 (JavaScript 실행 필요)
3. 변경사항이 Preview에는 있지만 Production에는 없는 경우 → Promote 필요

**로컬에서 빌드 테스트:**
```bash
cd frontend
npm run build
npx vite preview
```
- 빌드 에러가 있는지 확인
- 로컬에서 변경사항이 보이는지 확인

### 7. 문제 해결 워크플로우

```
변경사항이 안 보인다고 보고 받음
    ↓
1. Vercel 배포 상태 확인 (npx vercel ls)
    ↓
2. Production vs Preview 배포 시간 비교
    ↓
3a. Production이 오래됨              3b. 최근 배포가 Failed
    ↓                                    ↓
  Preview URL로 변경사항 확인         빌드 로그 확인
    ↓                                    ↓
  있으면 Promote 실행               에러 수정 후 재배포
    ↓
4. Production 배포 완료
    ↓
5. 사용자에게 하드 리프레시 안내
   (Ctrl+Shift+R / Cmd+Shift+R)
    ↓
6. 여전히 안 보이면 사용자에게 스크린샷 요청
```

### 8. 캐시 관련 이슈

**사용자가 변경사항을 못 볼 때:**

1. **하드 리프레시 안내:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **브라우저 캐시 확인:**
   - DevTools → Network 탭 → "Disable cache" 체크
   - 시크릿 모드로 테스트

3. **CDN 캐시 확인:**
   - Vercel은 보통 자동으로 캐시를 무효화
   - 필요시 Vercel 대시보드에서 "Redeploy" 실행

---

## ✅ 코드 작성 전 체크리스트

코드를 작성하거나 수정할 때 항상 확인:

1. [ ] API 키나 비밀번호가 하드코딩되지 않았는가?
2. [ ] 환경 변수를 통해 민감한 정보를 관리하는가?
3. [ ] localhost URL이 하드코딩되지 않았는가?
4. [ ] 주석에 민감한 정보가 포함되지 않았는가?
5. [ ] 새로운 환경 변수를 추가했다면 `.env.example`에도 추가했는가?

---

## 🔄 코드 수정 시 규칙

### API 호출 코드 작성 시
```typescript
// 항상 api-config.ts 유틸리티 사용
import { getApiUrl } from '@/lib/api-config'

const response = await fetch(getApiUrl('/api/auth/admin/login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password })
})
```

### 새로운 환경 변수 추가 시
1. 로컬 `.env` 파일에 추가
2. `.env.example` 템플릿에 추가 (값 제외)
3. Railway/Vercel 대시보드에 추가
4. 문서 업데이트

---

## 🚫 절대 금지 사항

1. **하드코딩된 비밀번호나 API 키**
   - 코드, 주석, 문서 어디에도 포함 금지

2. **환경 변수 파일 커밋**
   - `.env`, `.env.local`, `.env.production` 등 절대 커밋 금지

3. **로컬 URL 하드코딩**
   - `localhost:3001` 등의 로컬 URL 하드코딩 금지

4. **민감한 정보를 로그에 출력**
   - `console.log()`에 API 키, 비밀번호 출력 금지

---

## 📝 커밋 메시지 규칙

**민감한 정보 절대 포함 금지:**
```bash
# ❌ 비밀번호나 API 키 포함 금지
git commit -m "Add admin password: wlqcprwlqcprwlqcpr8282"

# ✅ 일반적인 설명만
git commit -m "Add admin authentication feature"
```

---

## 🎯 이 규칙의 목적

1. **보안**: API 키, 비밀번호 등 민감한 정보 보호
2. **유지보수성**: 환경별로 다른 설정을 쉽게 관리
3. **협업**: 팀원들이 안전하게 코드 공유
4. **배포**: 개발/스테이징/프로덕션 환경 분리

---

## 📚 문서화 규칙

### 1. 컴포넌트 구현 문서화

**모든 구현 완료된 컴포넌트는 반드시 문서화:**
- 컴포넌트명, 파일 경로, 주요 기능
- 사용된 주요 라이브러리 및 의존성
- Props 인터페이스 및 타입 정의
- 주요 상태 관리 로직
- API 연동 정보 (있는 경우)

**문서 위치:**
- Frontend 컴포넌트: `.claude/docs/components/`
- Backend API: `.claude/docs/api/`
- 워크플로우: `.claude/docs/workflows/`

### 2. 개발 과정 문서화

**각 기능 구현 시 기록해야 할 사항:**
```markdown
# [기능명] 구현 문서

## 구현 일자
YYYY-MM-DD

## 개요
- 기능 설명
- 구현 목적
- 적용 범위

## 구현 상세
### 파일 변경 사항
- `경로/파일명.tsx`: 변경 내용 요약

### 주요 코드
```typescript
// 핵심 로직 스니펫
```

### 디자인 시스템
- 색상: #11998e → #38ef7d (Quepal gradient)
- 폰트: 적용된 폰트 정보
- 레이아웃: 적용된 레이아웃 패턴

## 테스트
- 수동 테스트 결과
- 확인된 버그 및 해결

## 배포
- 배포 URL
- 배포 일시
```

### 3. 수정 이력 관리

**기존 문서 업데이트 규칙:**
- 컴포넌트 수정 시 해당 문서에 수정 이력 추가
- 수정 날짜, 수정 사항, 수정 이유 명시
- 이전 버전 정보는 "수정 이력" 섹션에 보관

**수정 이력 형식:**
```markdown
## 수정 이력

### 2025-10-12
- **변경 사항**: Payment 페이지 색상을 Quepal gradient로 변경
- **변경 이유**: 메인 페이지와 색상 통일
- **영향 범위**:
  - 입력창 배경: glass-dark → bg-black/60
  - border 색상: cyan → #11998e/#38ef7d
  - 버튼 그라디언트 변경
```

### 4. 워크플로우 문서 구조

**워크플로우 문서 템플릿:**
```markdown
# [워크플로우명]

## 목적
이 워크플로우가 해결하는 문제

## 단계
1. **Step 1**: 설명
   - 입력: 필요한 입력값
   - 출력: 생성되는 결과
   - 도구: 사용하는 도구/명령어

2. **Step 2**: 설명
   ...

## 관련 파일
- `경로/파일1.ts`
- `경로/파일2.tsx`

## 참고 문서
- [관련 컴포넌트 문서](링크)
- [API 문서](링크)

## 트러블슈팅
자주 발생하는 문제와 해결책
```

### 5. 문서 디렉토리 구조

```
.claude/
├── claude.md                    # 이 파일 (메인 규칙)
├── SECURITY_GUIDELINES.md       # 보안 가이드라인
├── docs/
│   ├── components/
│   │   ├── frontend/
│   │   │   ├── ZipCheck.md
│   │   │   ├── Payment.md
│   │   │   ├── QuoteSubmission.md
│   │   │   └── ...
│   │   └── backend/
│   │       └── ...
│   ├── api/
│   │   ├── auth.md
│   │   ├── quote-requests.md
│   │   └── ...
│   ├── workflows/
│   │   ├── deployment.md
│   │   ├── styling-update.md
│   │   └── ...
│   └── design-system/
│       ├── colors.md
│       ├── typography.md
│       └── components.md
```

### 6. 문서 작성 시기

**즉시 문서화해야 하는 경우:**
- ✅ 새로운 컴포넌트 생성 완료 시
- ✅ 주요 기능 구현 완료 시
- ✅ API 엔드포인트 추가 시
- ✅ 배포 완료 후

**정기적으로 업데이트해야 하는 경우:**
- 🔄 기존 컴포넌트 수정 시
- 🔄 API 인터페이스 변경 시
- 🔄 디자인 시스템 변경 시
- 🔄 워크플로우 개선 시

### 7. 문서 품질 기준

**좋은 문서의 조건:**
1. **명확성**: 누구나 이해할 수 있는 명확한 설명
2. **완전성**: 필요한 모든 정보 포함
3. **최신성**: 코드와 문서가 동기화됨
4. **접근성**: 쉽게 찾고 참조할 수 있는 구조
5. **실용성**: 실제 개발에 도움이 되는 내용

**문서 검토 체크리스트:**
- [ ] 파일 경로가 정확한가?
- [ ] 코드 예제가 최신 상태인가?
- [ ] 외부 의존성이 명시되어 있는가?
- [ ] 관련 문서 링크가 유효한가?
- [ ] 수정 이력이 기록되어 있는가?

---

**모든 Claude Code 에이전트는 이 규칙을 코드 생성 시 자동으로 준수합니다.**

마지막 업데이트: 2025-10-12
