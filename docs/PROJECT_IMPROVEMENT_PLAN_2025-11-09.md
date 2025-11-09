# ZipCheck 프로젝트 개선 계획서

**작성일**: 2025-11-09
**기반 문서**: [근본 원인 분석 보고서](./PROJECT_DIAGNOSIS_2025-11-09.md)
**목표**: TypeScript 에러 20개 → 0개, 프로젝트 구조 정립

---

## 📋 개선 계획 개요

### 목표
1. **즉시**: TypeScript 빌드 에러 완전 해결
2. **단기**: 개발 환경 정상화 (환경 변수, Railway 연결)
3. **중기**: 프로젝트 구조 정립 (이름 통일, SEO)
4. **장기**: 유지보수성 향상 (문서화, 테스트)

### 성공 지표
- ✅ TypeScript 에러: 20 → 0
- ✅ Frontend 빌드: 실패 → 성공
- ✅ 프로젝트 정체성: OpenUI 혼재 → ZipCheck 단일
- ✅ SEO 점수: 개선 (도메인 정확성)

---

## 🎯 Phase 1: 긴급 수정 (즉시 실행)

**목표**: TypeScript 빌드 성공
**소요 시간**: 30분
**영향**: Frontend 전체 빌드 가능

### Task 1-A: 의존성 설치

#### 작업 내용
```bash
cd frontend
pnpm add react-hook-form@^7.53.2 \
         zod@^3.23.8 \
         @hookform/resolvers@^3.9.1 \
         @radix-ui/react-accordion@^1.2.2
```

#### 검증 방법
```bash
pnpm list react-hook-form zod @hookform/resolvers @radix-ui/react-accordion
```

#### 예상 결과
- ✅ TypeScript 에러 5개 해결
- ✅ QuoteForm.tsx 컴파일 성공
- ✅ accordion.tsx 컴파일 성공

#### 리스크
- 없음 (신규 설치만)

---

### Task 1-B: Marketing 페이지 모듈 구조 수정

#### 현재 문제
```typescript
// frontend/src/pages/Marketing/index.ts
export { default as LandingPage } from './Landing'        // ❌ 파일 없음
export { default as QuoteRequestPage } from './QuoteRequest'  // ❌ 파일 없음
```

#### 해결 방안 (옵션 선택)

**옵션 1**: 파일 삭제 (권장)
```bash
rm frontend/src/pages/Marketing/index.ts
```
- 이유: 다른 곳에서 import 안 함 (검증 필요)

**옵션 2**: Export 수정
```typescript
// frontend/src/pages/Marketing/index.ts
export { default as ZipCheckPage } from './ZipCheck'
```

#### 검증 방법
```bash
# index.ts가 import되는 곳 검색
cd frontend
grep -r "from '@/pages/Marketing'" src/
grep -r "from './Marketing'" src/
```

#### 예상 결과
- ✅ TypeScript 에러 2개 해결
- ✅ 모듈 의존성 정리

#### 리스크
- 낮음 (import 사용처 확인 필요)

---

### Task 1-C: Review 타입 정의 수정

#### Step 1: 백엔드 API 스키마 확인
```bash
# Backend Review 라우트 확인
cd backend
grep -r "review" src/routes/ | grep -E "(GET|POST)"

# 데이터베이스 스키마 확인
grep -r "CREATE TABLE.*review" src/ || \
grep -r "review_text\|helpful_count" src/
```

#### Step 2: API 응답 실제 확인 (필요 시)
```bash
# Backend 실행 중이라면:
curl http://localhost:3001/api/reviews/1 | jq
```

#### Step 3: Frontend 타입 수정
```typescript
// frontend/src/types/review.ts (또는 해당 파일)
export interface Review {
  id: string
  company_name: string
  user_id: string
  rating: number
  title: string

  // 수정: content vs review_text 통일
  content?: string       // 기존 사용 중이라면 유지
  review_text: string    // 백엔드가 반환하는 필드

  // 추가
  helpful_count: number

  created_at: string
  // ...기타 필드
}
```

#### 검증 방법
```bash
cd frontend
npx tsc --noEmit | grep -i "review"
```

#### 예상 결과
- ✅ TypeScript 에러 3개 해결
- ✅ ReviewDetail.tsx 컴파일 성공

#### 리스크
- 중간 (백엔드 응답과 불일치 가능성)
- 완화: API 응답 실제 확인 후 수정

---

### Task 1-D: RefreshCw import 추가

#### 작업 내용
```typescript
// frontend/src/pages/Admin/DataManagement.tsx
// 기존 import 라인 수정:
import {
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertCircle,
  Search,
  TrendingUp,
  RefreshCw  // ← 추가
} from 'lucide-react'
```

#### 검증 방법
```bash
cd frontend
npx tsc --noEmit | grep "DataManagement"
```

#### 예상 결과
- ✅ TypeScript 에러 2개 해결
- ✅ DataManagement.tsx 컴파일 성공

#### 리스크
- 없음 (단순 import 추가)

---

### Phase 1 검증

#### 전체 빌드 테스트
```bash
cd frontend
npx tsc --noEmit
```

**목표**: 에러 0개

#### 빌드 테스트
```bash
npm run build
```

**목표**: 빌드 성공

---

## 🔧 Phase 2: 기능 개선 (당일 완료)

**목표**: 개발 환경 정상화
**소요 시간**: 1시간

### Task 2-A: Framer Motion 타입 충돌 해결

#### 분석
```typescript
// 문제 발생 파일:
// - frontend/src/components/immersive/InteractiveCard.tsx
// - frontend/src/components/immersive/MagneticButton.tsx

// 원인: framer-motion v12에서 onAnimationStart 타입 변경
```

#### 해결 방안 (옵션 1 권장)

**옵션 1**: Props 타입 필터링
```typescript
// InteractiveCard.tsx, MagneticButton.tsx 공통 패턴

import { motion, HTMLMotionProps } from 'framer-motion'

interface ComponentProps {
  children: React.ReactNode
  className?: string
  // 필요한 props만 명시
}

export function InteractiveCard({
  children,
  className,
  ...restProps
}: ComponentProps & Omit<HTMLMotionProps<'div'>, 'onAnimationStart'>) {
  return (
    <motion.div
      className={className}
      // framer-motion 전용 props만 전달
      whileHover={{ scale: 1.05 }}
      // ...
    >
      {children}
    </motion.div>
  )
}
```

**옵션 2**: framer-motion 다운그레이드
```bash
cd frontend
pnpm add framer-motion@^11.11.17
```
- 이유: 이전 버전은 타입 호환성 문제 없음
- 리스크: 최신 기능 사용 불가

#### 검증
```bash
npx tsc --noEmit | grep -E "(InteractiveCard|MagneticButton)"
```

#### 예상 결과
- ✅ TypeScript 에러 2개 해결

---

### Task 2-B: Frontend 환경 변수 구조 구축

#### Step 1: .env.local 생성
```bash
cd frontend
cat > .env.local << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=ZipCheck
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
EOF
```

#### Step 2: .env.example 생성 (Git 포함)
```bash
cat > .env.example << 'EOF'
# API Configuration
# Local: http://localhost:3001
# Production: https://zipcheck-production.up.railway.app
VITE_API_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=ZipCheck
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false

# Vercel 배포 시 환경 변수 설정 필요:
# - VITE_API_URL → Production API URL
EOF
```

#### Step 3: api-config.ts 검증
```typescript
// frontend/src/lib/api-config.ts 확인
export function getApiUrl(path: string = ''): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${baseUrl}${path}`
}
```

#### Step 4: README 업데이트
```markdown
## 환경 설정

### 1. 환경 변수 설정
\`\`\`bash
cp frontend/.env.example frontend/.env.local
# .env.local 파일을 열어 필요한 값 수정
\`\`\`

### 2. 주요 환경 변수
- `VITE_API_URL`: Backend API URL
  - Local: `http://localhost:3001`
  - Production: Railway URL
\`\`\`
```

#### 검증
```bash
# .env.local 파일 존재 확인
test -f frontend/.env.local && echo "✅ .env.local exists"

# Vite 환경 변수 로드 확인
cd frontend
npm run dev &
sleep 3
curl http://localhost:5173  # 정상 로드 확인
pkill -f "vite"
```

#### 예상 결과
- ✅ 로컬 개발 환경 설정 완료
- ✅ API URL 동적 관리 가능

---

### Task 2-C: Railway 서비스 연결 (선택 사항)

#### 방법 1: 인터랙티브 선택
```bash
cd backend
railway service
# 프롬프트에서 "zipcheck" 선택
```

#### 방법 2: 명령어에 서비스명 지정
```bash
railway logs --service zipcheck
railway status --service zipcheck
```

#### 검증
```bash
railway status
# 정상 출력 확인
```

#### 예상 결과
- ✅ Railway CLI 사용 편의성 향상
- ⚠️ 배포는 이미 정상 (선택 사항)

---

## 🏗️ Phase 3: 구조 개선 (주간 작업)

**목표**: 프로젝트 정체성 확립
**소요 시간**: 2-3시간

### Task 3-A: 프로젝트 이름 통일

#### Step 1: package.json 수정
```json
// frontend/package.json
{
  "name": "zipcheck-frontend",  // "openui" → 변경
  "description": "ZipCheck - 인테리어 견적 비교 플랫폼 프론트엔드",
  "version": "1.0.1",
  // ...
}
```

#### Step 2: PWA Manifest 수정
```typescript
// frontend/vite.config.ts
VitePWA({
  manifest: {
    name: 'ZipCheck',
    short_name: 'ZipCheck',
    description: '인테리어 견적 비교 플랫폼',
    theme_color: '#11998e',
    // ...
  }
})
```

#### Step 3: index.html 검증
```html
<!-- frontend/index.html -->
<title>ZipCheck | 인테리어 견적 분석 서비스</title>
<meta name="description" content="ZipCheck - AI 기반 인테리어 견적 분석 서비스" />
```

#### 검증
```bash
cd frontend
npm run build
# dist/manifest.webmanifest 확인
cat dist/manifest.webmanifest | grep -i "zipcheck"
```

#### 예상 결과
- ✅ 프로젝트 이름 일관성 확보
- ✅ PWA 설정 정확성

---

### Task 3-B: SEO 파일 업데이트

#### Step 1: sitemap.xml 도메인 수정
```xml
<!-- frontend/public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zcheck.co.kr/</loc>  <!-- zipcheck.kr → zcheck.co.kr -->
    <lastmod>2025-11-09</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://zcheck.co.kr/plan-selection</loc>
    <lastmod>2025-11-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- 기타 URL도 동일하게 수정 -->
</urlset>
```

#### Step 2: robots.txt 개선
```txt
# frontend/public/robots.txt
User-agent: *
Allow: /

# Sitemap
Sitemap: https://zcheck.co.kr/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /api/
```

#### Step 3: Open Graph 메타 태그 추가 (향후)
```html
<!-- frontend/index.html -->
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://zcheck.co.kr/" />
<meta property="og:title" content="ZipCheck | 인테리어 견적 분석 서비스" />
<meta property="og:description" content="AI 기반으로 인테리어 견적을 분석하고 비교해드립니다" />
<meta property="og:image" content="https://zcheck.co.kr/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://zcheck.co.kr/" />
<meta name="twitter:title" content="ZipCheck | 인테리어 견적 분석 서비스" />
<meta name="twitter:description" content="AI 기반으로 인테리어 견적을 분석하고 비교해드립니다" />
<meta name="twitter:image" content="https://zcheck.co.kr/og-image.png" />
```

#### 검증
```bash
# sitemap 문법 검증
cd frontend/public
xmllint --noout sitemap.xml && echo "✅ Valid XML"

# 배포 후 Google Search Console에서 sitemap 제출
```

#### 예상 결과
- ✅ 검색 엔진 크롤링 정확성
- ✅ 소셜 공유 시 올바른 미리보기

---

### Task 3-C: Git 브랜치 전략 수립

#### Step 1: Main 브랜치 변경
```bash
# 현재 브랜치 확인
git branch

# master → main 변경
git branch -m master main

# 원격에 push
git push -u origin main
```

#### Step 2: GitHub 설정 변경
1. GitHub 리포지토리 → Settings → Branches
2. Default branch를 `main`으로 변경
3. 이전 `master` 브랜치 삭제 (선택)

#### Step 3: .github/workflows 업데이트 (있다면)
```yaml
# .github/workflows/*.yml
on:
  push:
    branches:
      - main  # master → main 변경
```

#### 검증
```bash
git log --oneline -5
git remote show origin | grep "HEAD branch"
```

#### 예상 결과
- ✅ Git 워크플로우 표준화
- ✅ 팀 협업 일관성

---

## ✅ 검증 및 배포

### 전체 검증 체크리스트

#### Frontend 빌드
```bash
cd frontend

# TypeScript 검사
npx tsc --noEmit
# 예상: 에러 0개

# 빌드
npm run build
# 예상: 성공

# 빌드 결과 확인
ls -lh dist/
```

#### Backend 빌드
```bash
cd backend

# TypeScript 검사
npx tsc --noEmit
# 예상: 에러 0개

# 빌드 (있다면)
npm run build
```

#### 로컬 실행 테스트
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: 테스트
curl http://localhost:3001/health
curl http://localhost:5173
```

---

### 배포 절차

#### Step 1: 변경사항 커밋
```bash
git add .
git status  # 변경 파일 확인

git commit -m "fix: resolve TypeScript errors and improve project structure

- Add missing dependencies (react-hook-form, zod, etc.)
- Fix Marketing page module structure
- Update Review type definition
- Add RefreshCw import to DataManagement
- Resolve Framer Motion type conflicts
- Setup Frontend environment variables
- Update project name and SEO files

Resolves: 20 TypeScript errors → 0
Improves: Build success, SEO accuracy"
```

#### Step 2: Push
```bash
git push origin main
```

#### Step 3: 배포 확인

**Frontend (Vercel)**:
- Vercel 대시보드 → 자동 배포 시작 확인
- Preview URL 확인
- Production 승격 (필요 시)

**Backend (Railway)**:
- Railway 대시보드 → 자동 배포 시작 확인
- 로그 확인: `railway logs --service zipcheck`

#### Step 4: 프로덕션 검증
```bash
# Frontend
curl -I https://zcheck.co.kr
# 예상: 200 OK

# Backend
curl https://zipcheck-production.up.railway.app/health
# 예상: {"status":"healthy"}
```

---

## 📊 성공 지표

### Phase 1 (즉시)
- [x] TypeScript 에러: 20 → 12 (40% 감소)
- [x] Frontend 빌드 성공

### Phase 2 (당일)
- [x] TypeScript 에러: 12 → 0 (100% 해결)
- [x] 환경 변수 시스템 구축
- [x] 개발 환경 정상화

### Phase 3 (주간)
- [x] 프로젝트 이름 통일
- [x] SEO 최적화
- [x] Git 워크플로우 표준화

---

## 🎯 후속 작업

### 이번 주
1. E2E 테스트 시나리오 작성
2. 성능 최적화 (번들 크기 감소)
3. 에러 모니터링 시스템 구축

### 이번 달
1. 동적 sitemap 생성 시스템
2. API 응답 타입 자동 생성
3. Storybook 구축 (컴포넌트 문서화)

### 분기
1. OpenUI 흔적 완전 제거
2. 모노레포 구조 검토
3. CI/CD 파이프라인 강화

---

**참고 문서**:
- [근본 원인 분석](./PROJECT_DIAGNOSIS_2025-11-09.md)
- [실행 로그](./IMPROVEMENT_EXECUTION_LOG_2025-11-09.md) (작업 중 생성)

**작성자**: Claude Code Agent
**승인 필요**: 프로젝트 관리자
