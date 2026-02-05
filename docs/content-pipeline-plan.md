# 집첵 콘텐츠 파이프라인 기획서

**작성일**: 2026-02-05
**상태**: 기획 완료, 구현 대기

---

## 개요

blog.zcheck.co.kr 블로그 원본 → Instagram/Threads 베리에이션 자동 생성 + 발행 파이프라인

---

## 플랫폼별 제한사항 (2026 기준)

| 플랫폼 | 글자 제한 | 이미지 | 비고 |
|--------|----------|--------|------|
| **블로그** (blog.zcheck.co.kr) | 제한 없음 | 1장 | Airtable 기반, 현재 운영 중 |
| **Instagram** | 캡션 2,200자 | 1장 필수 | 첫 125자만 미리보기 노출 |
| **Threads** | 게시글 500자 | 선택 | 10K 텍스트 첨부는 API 미지원 |
| **Threads 답글 체인** | 게시글당 500자 x N개 | - | `reply_to_id`로 API 구현 가능 |
| **네이버 블로그** | 제한 없음 | 4~5장 | 구현 보류 (요청 시 개발) |

---

## 파이프라인 흐름

```
┌─────────────────────────────────────────────────────┐
│  1단계: 블로그 원본 생성                               │
│  blog.zcheck.co.kr                                   │
│  - 이미지 1장 + 텍스트 2,000자 이상                    │
│  - 구조화된 게시글 (제목/서론/본문/결론/CTA)             │
│  - Airtable에 저장                                    │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│  2단계: 베리에이션 자동 생성                            │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ Instagram         │  │ Threads                  │  │
│  │ - 존댓말/전문적    │  │ - 반말/친근한 톤          │  │
│  │ - 2,200자 이내    │  │ - 메인글 500자 이내       │  │
│  │ - 첫 125자 = 훅   │  │ - 답글 체인 2~4개        │  │
│  │ - 이미지 1장      │  │   (각 500자 이내)         │  │
│  │ - 해시태그 15~20개 │  │ - 이미지 없음 (텍스트)    │  │
│  └──────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  (추후) 네이버 블로그                                  │
│  - 이미지 4~5장 (문단 사이 배치)                       │
│  - 텍스트 2,500자 내외                                │
│  - 구현 계획만 정리, 요청 시 개발                       │
└─────────────────────────────────────────────────────┘
```

---

## 1단계: 블로그 원본 생성

### 게시글 구조
```
제목: SEO 최적화된 한글 제목
서론: 문제 제기 또는 질문 (200~300자)
본문: 핵심 내용 2~3개 섹션 (각 400~600자)
결론: 요약 + 핵심 메시지 (200~300자)
CTA: 집첵 서비스 안내 + 링크
이미지: 대표 이미지 1장
```

### 저장 위치
- Airtable (기존 블로그 시스템)
- 필드 추가 필요: `ig_variation`, `threads_variation`, `published_ig`, `published_threads`

---

## 2단계: 베리에이션 규칙

### Instagram 베리에이션

| 항목 | 규칙 |
|------|------|
| **톤** | 존댓말, 전문적이면서 읽기 쉽게 |
| **첫 125자** | 핵심 메시지 훅 (미리보기 노출 영역) |
| **본문** | 블로그 핵심 내용 압축 (2,200자 이내) |
| **마지막** | CTA + zcheck.co.kr 링크 |
| **해시태그** | 15~20개 (인테리어/견적/시공 관련) |
| **이미지** | 블로그 대표 이미지 1장 그대로 사용 |

### Instagram 해시태그 기본 세트
```
#인테리어 #인테리어견적 #인테리어시공 #집인테리어 #아파트인테리어
#인테리어비용 #인테리어견적분석 #시공원가 #인테리어팁 #집꾸미기
#셀프인테리어 #인테리어업체 #인테리어비교 #집첵 #zipcheck
```

### Threads 베리에이션

| 항목 | 규칙 |
|------|------|
| **톤** | 반말, 친근하게 ("~인 거 알아?", "~해봤어?") |
| **메인 글** (500자) | 블로그 핵심 한 줄 + 호기심 유발 |
| **답글 1** (500자) | 구체적 설명/데이터 |
| **답글 2** (500자) | 사례/팁 |
| **답글 3** (500자) | CTA + zcheck.co.kr 링크 |
| **이미지** | 없음 (텍스트 중심) |

### Threads 답글 체인 API 구현
```
1. POST /threads - 메인 글 생성 → creation_id 반환
2. POST /threads/{creation_id}/publish → media_id 반환
3. POST /threads - reply_to_id: media_id로 답글 1 생성
4. POST /threads/{creation_id}/publish → 답글 1 발행
5. 반복...
```

---

## API 구현 계획

### Workers 라우트 (구현 필요)

```
POST /api/admin/social/publish/instagram   - Instagram 게시
POST /api/admin/social/publish/threads     - Threads 게시 (답글 체인 포함)
POST /api/admin/social/publish/all         - 전체 동시 게시
POST /api/admin/social/generate-variation  - 블로그 → 베리에이션 자동 생성
```

### Cloudflare Workers Secrets (설정 완료)

| Secret | 용도 | 상태 |
|--------|------|:----:|
| META_APP_ID | 1976790549923339 | ✅ |
| META_APP_SECRET | 앱 시크릿 | ✅ |
| META_ACCESS_TOKEN | Instagram 시스템 사용자 토큰 (영구) | ✅ |
| META_IG_ACCOUNT_ID | 17841480560661016 | ✅ |
| META_THREADS_USER_ID | 25818799747781973 | ✅ |
| META_THREADS_TOKEN | Threads 사용자 토큰 (60일, 갱신 필요) | ✅ |

### Instagram 게시 API 흐름 (Graph API)
```
1. POST /{ig_account_id}/media
   - image_url: 이미지 URL (공개 접근 가능해야 함)
   - caption: 텍스트 + 해시태그
   → creation_id 반환

2. POST /{ig_account_id}/media_publish
   - creation_id: 위에서 받은 ID
   → 게시 완료
```

### Threads 게시 API 흐름 (Threads API)
```
1. POST /v1.0/{threads_user_id}/threads
   - media_type: TEXT
   - text: 메인 글 (500자)
   → creation_id 반환

2. POST /v1.0/{threads_user_id}/threads_publish
   - creation_id
   → media_id 반환 (메인 글 발행됨)

3. POST /v1.0/{threads_user_id}/threads
   - media_type: TEXT
   - text: 답글 1
   - reply_to_id: media_id (메인 글)
   → creation_id 반환

4. POST /v1.0/{threads_user_id}/threads_publish
   - creation_id
   → 답글 1 발행됨

5. 답글 2, 3 반복...
```

---

## 네이버 블로그 구현 계획 (보류)

### 개요
| 항목 | 내용 |
|------|------|
| **API** | 네이버 블로그 Open API (OAuth 2.0) |
| **이미지** | 4~5장 AI 생성 (Gemini Image API 활용) |
| **텍스트** | 2,500자 내외, 블로그 원본을 네이버 SEO 최적화 |
| **레이아웃** | 서론 → 이미지 → 본문1 → 이미지 → 본문2 → 이미지 → 결론 → 이미지 |
| **구현 방식** | Workers cron 또는 어드민 수동 발행 |
| **난이도** | 중 (네이버 OAuth + 이미지 업로드 + HTML 편집기 포맷) |

### 네이버 블로그 API 필요 사항
- 네이버 개발자센터 앱 등록
- 블로그 글쓰기 API 권한
- OAuth 2.0 토큰 발급
- 이미지 업로드: 네이버 이미지 호스팅 또는 R2 URL 참조

### 이미지 생성 전략
- Gemini Image API (gemini-2.5-flash-image) 사용
- 블로그 본문 키워드 기반 프롬프트 생성
- 인테리어 관련 일러스트/인포그래픽 스타일
- 1024x1024 또는 16:9 비율

---

## 어드민 UI 계획

### 게시물 관리 페이지 (admin.zcheck.co.kr)

```
┌─────────────────────────────────────────────┐
│  소셜 콘텐츠 관리                              │
│                                              │
│  [블로그 글 선택 ▼]                           │
│                                              │
│  ┌─────────────┐ ┌─────────────┐            │
│  │ Instagram    │ │ Threads     │            │
│  │ 미리보기     │ │ 미리보기     │            │
│  │             │ │ 메인글      │            │
│  │ 캡션 편집    │ │ 답글1       │            │
│  │             │ │ 답글2       │            │
│  │ 해시태그     │ │ 답글3       │            │
│  └─────────────┘ └─────────────┘            │
│                                              │
│  [베리에이션 자동 생성]                        │
│  [Instagram 발행] [Threads 발행] [전체 발행]   │
└─────────────────────────────────────────────┘
```

---

## 참고 자료

- [Threads API Documentation](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api)
- [Instagram Graph API - Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/)
- [Threads 10K Text Attachments](https://www.engadget.com/social-media/threads-posts-now-support-text-attachments-up-to-10000-characters-170000305.html)
- [Instagram Character Limit 2026](https://www.outfy.com/blog/instagram-character-limit/)

---

## Threads 토큰 갱신 주의

- Threads 토큰은 **60일 만료**
- 만료 전 갱신 API 호출 필요:
  ```
  GET https://graph.threads.net/refresh_access_token
    ?grant_type=th_refresh_token
    &access_token={현재토큰}
  ```
- Workers cron에 자동 갱신 로직 추가 권장 (만료 7일 전)
