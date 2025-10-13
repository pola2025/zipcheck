# 보안 가이드라인 (Security Guidelines)

## 핵심 원칙

**모든 보안 관련 정보는 Git에 커밋되지 않아야 합니다.**

## 1. 환경 변수 관리

### 절대 커밋하지 말아야 할 파일들
```
.env
.env.local
.env.production
.env.development
*.key
*.pem
credentials.json
```

### 환경 변수 파일 위치
- Backend: `backend/.env`, `backend/.env.production`
- Frontend: `openui/frontend/.env.local`, `openui/frontend/.env.production`

### 민감한 정보 목록
1. **API Keys**
   - CLAUDE_API_KEY
   - OPENAI_API_KEY
   - GOOGLE_CLOUD_API_KEY
   - NAVER_CLIENT_ID / NAVER_CLIENT_SECRET

2. **Database Credentials**
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - SUPABASE_ANON_KEY
   - SUPABASE_ACCESS_TOKEN

3. **Authentication Secrets**
   - ADMIN_PASSWORD
   - JWT_SECRET

4. **Third-party Services**
   - Railway tokens
   - Vercel tokens
   - Any OAuth credentials

## 2. .gitignore 규칙

### 반드시 포함되어야 할 항목
```gitignore
# Environment variables
.env
.env.*
!.env.example

# API Keys
*.key
*.pem
credentials.json

# IDE
.vscode/settings.json (if contains secrets)
.idea/

# Build artifacts with sensitive data
dist/
build/

# Logs (may contain sensitive info)
*.log
logs/
```

## 3. 코드 작성 규칙

### ❌ 절대 하지 말아야 할 것
```typescript
// 하드코딩 금지
const API_KEY = "sk-ant-api03-..."
const ADMIN_PASSWORD = "wlqcprwlqcpr8282"
const API_URL = "http://localhost:3001"
```

### ✅ 올바른 방법
```typescript
// 환경 변수 사용
const API_KEY = process.env.CLAUDE_API_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL
```

## 4. 배포 시 주의사항

### Railway 배포
- 환경 변수는 Railway 대시보드에서 직접 설정
- `railway variables` 명령어로 확인 가능
- .env 파일은 절대 Railway에 업로드하지 않음

### Vercel 배포
- 환경 변수는 Vercel 대시보드에서 설정
- .env.production 파일은 로컬에만 보관
- 빌드 시 환경 변수가 번들에 포함되지 않도록 주의

## 5. 코드 리뷰 체크리스트

새로운 코드를 커밋하기 전 확인:
- [ ] API 키나 비밀번호가 하드코딩되지 않았는가?
- [ ] 환경 변수를 통해 민감한 정보를 관리하는가?
- [ ] .env 파일이 .gitignore에 포함되어 있는가?
- [ ] localhost URL이 하드코딩되지 않았는가?
- [ ] 주석에 민감한 정보가 포함되지 않았는가?

## 6. 긴급 상황 대응

### 실수로 민감 정보를 커밋한 경우
1. 즉시 해당 키/비밀번호를 무효화 (재발급)
2. Git 히스토리에서 완전히 제거
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch PATH_TO_FILE" \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. 강제 푸시 (주의!)
   ```bash
   git push origin --force --all
   ```
4. 팀원들에게 알림

## 7. 프로젝트별 환경 변수 템플릿

### Backend (.env.example)
```env
# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Admin Auth
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_here

# API Keys
CLAUDE_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.example)
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 8. Claude Code AI 준수 사항

Claude Code AI는 다음을 **항상** 준수합니다:
- 주석에 보안 정보를 절대 포함하지 않음
- 환경 변수를 사용하는 코드만 작성
- 하드코딩된 URL, 키, 비밀번호를 절대 생성하지 않음
- 이 가이드라인을 모든 코드 생성 시 참조
- .env.example 파일만 커밋, 실제 .env는 커밋하지 않음

## 9. 정기 보안 점검

**매 스프린트마다 확인:**
- [ ] .gitignore가 최신 상태인가?
- [ ] 모든 환경 변수가 제대로 설정되어 있는가?
- [ ] 불필요한 API 키는 삭제했는가?
- [ ] 로그에 민감한 정보가 출력되지 않는가?

---

**Last Updated:** 2025-10-12
**Version:** 1.0
**Status:** Active
