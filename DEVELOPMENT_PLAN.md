# ZipCheck 개발 계획서

> 인테리어 견적 분석 서비스 개선 로드맵

**작성일**: 2025-01-10
**버전**: 1.0

---

## 📌 프로젝트 개요

ZipCheck은 인테리어 견적서를 AI로 분석하여 적정 가격과 위험요소를 파악할 수 있는 서비스입니다.
실제 시공 데이터 3천여 건과 현업 20년+ 경력 전문가의 검토를 통해 신뢰도 높은 분석을 제공합니다.

---

## 🎯 개발 목표

1. **서버 비용 최적화**: 이미지 압축 및 저장 공간 절감
2. **검색 유입 증대**: SEO 최적화 및 타겟 키워드 집중
3. **사용자 경험 개선**: 네이버 로그인 연동 및 마이페이지
4. **커뮤니티 활성화**: 후기 및 피해사례 공유 플랫폼

---

## 🚀 Phase 1: 핵심 최적화 (우선순위 높음)

### 1.1 이미지 압축 및 저장 최적화

**목표**: 업로드된 이미지 용량을 90% 이상 절감하여 서버 비용 최소화

**구현 내용**:
- Sharp 라이브러리를 사용한 이미지 압축
  - JPEG 포맷 변환, 80% 품질
  - 최대 너비 1920px로 리사이징
  - WebP 포맷 지원 (브라우저 호환성 고려)
- AI 데이터 추출 후 원본 이미지 삭제
- 압축된 이미지만 Supabase Storage에 저장
- 썸네일 생성 (200x200px) - 목록 표시용

**기술 스택**:
```bash
npm install sharp --save
```

**파일 수정**:
- `backend/src/routes/quote-requests.ts` - 이미지 업로드 핸들러 수정
- `backend/src/services/image-optimizer.ts` - 새로 생성 (압축 로직)
- `backend/src/services/image-parser.ts` - 원본 삭제 로직 추가

**예상 작업 시간**: 1-2시간
**예상 효과**:
- 저장 공간 90% 절감
- 이미지 로딩 속도 3-5배 개선
- 월 스토리지 비용 절감

---

### 1.2 SEO 최적화 및 크롤러 제한

**목표**: 인테리어 피해사례, 견적분석 키워드로 검색 유입 증대, AI 크롤러 차단

**구현 내용**:

#### A) robots.txt 설정
```txt
# 허용할 검색엔진 크롤러
User-agent: Googlebot
User-agent: Yeti
User-agent: Daumoa
Allow: /

# AI 크롤러 차단
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: Google-Extended
User-agent: CCBot
User-agent: anthropic-ai
User-agent: Claude-Web
User-agent: cohere-ai
Disallow: /

# 모든 크롤러 기본 규칙
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://zipcheck.kr/sitemap.xml
```

#### B) Meta 태그 최적화
- 메인 페이지 타이틀: "인테리어 견적 분석 | 피해사례 방지 | ZipCheck"
- Description: "20년 경력 전문가의 인테리어 견적 분석. 3천건 시공데이터 기반 적정가 확인. 인테리어 피해사례 사전 예방."
- Keywords: 인테리어 견적, 견적 분석, 인테리어 피해사례, 바가지 방지, 적정가 확인

#### C) OpenGraph 및 구조화 데이터
```html
<!-- OpenGraph -->
<meta property="og:title" content="ZipCheck - 인테리어 견적 분석 전문" />
<meta property="og:description" content="실제 시공데이터 기반 견적 분석으로 인테리어 피해 예방" />
<meta property="og:image" content="/og-image.jpg" />

<!-- JSON-LD 구조화 데이터 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "ZipCheck",
  "description": "인테리어 견적 분석 및 피해사례 예방 서비스",
  "provider": {
    "@type": "Organization",
    "name": "ZipCheck"
  }
}
</script>
```

#### D) Sitemap.xml 생성
- 주요 페이지 자동 수집
- 우선순위 설정 (메인 1.0, 후기/피해사례 0.8)
- 주간 업데이트 주기 설정

**파일 수정**:
- `openui/frontend/public/robots.txt` - 새로 생성
- `openui/frontend/public/sitemap.xml` - 새로 생성
- `openui/frontend/index.html` - meta 태그 추가
- `openui/frontend/src/components/SEO.tsx` - 새로 생성 (페이지별 SEO)

**예상 작업 시간**: 1시간
**예상 효과**:
- 네이버/구글 검색 노출 증대
- AI 학습 데이터 수집 차단
- 타겟 사용자 유입 증가

---

## 🔐 Phase 2: 사용자 인증 및 마이페이지

### 2.1 네이버 로그인 OAuth 연동

**목표**: 간편한 회원가입/로그인으로 사용자 경험 개선

**구현 내용**:
- 네이버 개발자센터 애플리케이션 등록
- OAuth 2.0 인증 플로우 구현
- 사용자 정보 자동 입력 (이름, 이메일, 전화번호)
- Supabase Auth와 연동

**사전 준비**:
1. 네이버 개발자센터 회원가입
2. 애플리케이션 등록 (https://developers.naver.com/apps/)
3. Client ID, Client Secret 발급
4. 콜백 URL 설정: `http://localhost:5173/auth/naver/callback` (개발), `https://zipcheck.kr/auth/naver/callback` (운영)

**기술 스택**:
```bash
npm install @supabase/auth-helpers-react
```

**파일 생성/수정**:
- `backend/.env` - 네이버 OAuth 키 추가
- `backend/src/routes/auth.ts` - OAuth 라우터 생성
- `openui/frontend/src/contexts/AuthContext.tsx` - 수정
- `openui/frontend/src/components/auth/NaverLogin.tsx` - 새로 생성

**예상 작업 시간**: 2-3시간

---

### 2.2 사용자 프로필 및 이용내역

**목표**: 마이페이지에서 견적 신청 내역 및 분석 결과 조회

**구현 내용**:
- 사용자 대시보드 페이지
- 견적 신청 내역 목록
- 분석 완료된 결과 다운로드 (PDF/Excel)
- 개인정보 수정 기능
- 결제 내역 조회

**DB 스키마 추가**:
```sql
-- 사용자 프로필 확장
ALTER TABLE users ADD COLUMN naver_id VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN profile_image VARCHAR(500);
ALTER TABLE users ADD COLUMN joined_at TIMESTAMP DEFAULT NOW();

-- 사용자별 견적 신청 연결
ALTER TABLE quote_requests ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_quote_requests_user_id ON quote_requests(user_id);
```

**파일 생성**:
- `openui/frontend/src/pages/MyPage.tsx`
- `openui/frontend/src/pages/MyQuotes.tsx`
- `openui/frontend/src/components/profile/ProfileCard.tsx`

**예상 작업 시간**: 2-3시간

---

## 💬 Phase 3: 커뮤니티 기능

### 3.1 인테리어 업체 후기 게시판

**목표**: 사용자들이 업체 경험을 공유하는 후기 플랫폼

**구현 내용**:
- 게시판 CRUD (작성, 조회, 수정, 삭제)
- 별점 평가 시스템 (1-5점)
- 이미지 첨부 (최대 5장)
- 업체명 태그 기능
- 좋아요/신고 기능
- 정렬: 최신순, 추천순, 별점순

**DB 스키마**:
```sql
CREATE TABLE company_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_company_reviews_user_id ON company_reviews(user_id);
CREATE INDEX idx_company_reviews_company_name ON company_reviews(company_name);
CREATE INDEX idx_company_reviews_rating ON company_reviews(rating);
```

**파일 생성**:
- `openui/frontend/src/pages/CompanyReviews.tsx`
- `openui/frontend/src/components/community/ReviewCard.tsx`
- `openui/frontend/src/components/community/ReviewForm.tsx`
- `backend/src/routes/reviews.ts`

**예상 작업 시간**: 3-4시간

---

### 3.2 인테리어 피해사례 커뮤니티

**목표**: 피해사례 공유로 다른 사용자의 피해 예방

**구현 내용**:
- 피해사례 게시판
- 카테고리 분류
  - 계약 문제
  - 시공 불량
  - 금전 피해
  - 업체 먹튀
  - 자재 하자
  - 기타
- 댓글 및 대댓글 기능
- 해결 상태 표시 (진행중, 해결완료, 미해결)
- 익명 작성 옵션
- 신고 기능

**DB 스키마**:
```sql
CREATE TYPE damage_category AS ENUM (
  'contract', 'construction', 'financial',
  'disappeared', 'material', 'other'
);

CREATE TYPE damage_status AS ENUM (
  'in_progress', 'resolved', 'unresolved'
);

CREATE TABLE damage_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category damage_category NOT NULL,
  status damage_status DEFAULT 'in_progress',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  company_name VARCHAR(200),
  damage_amount INTEGER,
  images JSONB DEFAULT '[]',
  is_anonymous BOOLEAN DEFAULT false,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE damage_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES damage_cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES damage_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**파일 생성**:
- `openui/frontend/src/pages/DamageCases.tsx`
- `openui/frontend/src/pages/DamageCaseDetail.tsx`
- `openui/frontend/src/components/community/DamageCard.tsx`
- `openui/frontend/src/components/community/CommentSection.tsx`
- `backend/src/routes/damage-cases.ts`

**예상 작업 시간**: 3-4시간

---

## 📅 일정 계획

### Week 1
- [x] 이미지 압축 및 최적화 (Day 1-2)
- [x] SEO 최적화 (Day 3)
- [ ] 네이버 로그인 연동 (Day 4-5)

### Week 2
- [ ] 마이페이지 구현 (Day 1-2)
- [ ] 업체 후기 게시판 (Day 3-5)

### Week 3
- [ ] 피해사례 커뮤니티 (Day 1-4)
- [ ] 통합 테스트 및 버그 수정 (Day 5)

---

## 🔧 기술 스택

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL)
- Sharp (이미지 처리)
- Claude Vision API

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Jotai (상태관리)

### DevOps
- Supabase Hosting
- Vercel / Netlify (프론트엔드 배포)
- GitHub Actions (CI/CD)

---

## 📊 성공 지표 (KPI)

### 기술 지표
- 이미지 평균 용량: 5MB → 500KB 이하
- 페이지 로딩 속도: 3초 이내
- SEO 점수: 90점 이상

### 비즈니스 지표
- 월간 활성 사용자(MAU): 100명 → 500명
- 견적 신청 전환율: 5% → 15%
- 커뮤니티 게시글: 월 50건 이상

---

## 🛡️ 보안 및 개인정보

### 개인정보 처리
- 네이버 로그인 시 최소한의 정보만 수집
- 이메일, 전화번호 암호화 저장
- 익명 게시 옵션 제공

### 크롤러 차단
- robots.txt로 AI 크롤러 차단
- rate limiting 적용
- CAPTCHA (필요시)

---

## 📝 참고 자료

- [네이버 로그인 API](https://developers.naver.com/docs/login/api/)
- [Sharp 문서](https://sharp.pixelplumbing.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google SEO 가이드](https://developers.google.com/search/docs)

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2025-01-10 | 1.0 | 초기 계획서 작성 |

---

**문의**: contact@zipcheck.kr
