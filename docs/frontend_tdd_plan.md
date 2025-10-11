# 프런트엔드 TDD 진행 플랜 & 진행 현황

## 1. 현재 구현/테스트 현황 스냅샷
| 영역 | 주요 기능 | 코드 경로 | 구현 상태 | 자동 테스트 |
| --- | --- | --- | --- | --- |
| 마케팅 랜딩 | Hero, ProblemSolution, FeatureGrid, Testimonials, Pricing, Contact CTA | `src/pages/Marketing/Landing.tsx` 외 | ✅ 완료 | ✅ `src/__tests__/marketing.test.ts` |
| 견적 의뢰 페이지 | 요금 요약, 프로세스, 견적 폼 | `src/pages/Marketing/QuoteRequest.tsx` | ✅ 완료 | ✅ 스키마/데이터 테스트 |
| 견적 폼 API 연동 | `/api/quote-request` POST stub | `src/components/marketing/QuoteForm.tsx`, `src/api/marketing.ts` | ✅ 완료 | ❌ API 통신 모의 테스트 예정 |
| 네비게이션/테마 | 마케팅 레이아웃, 헤더/푸터, 해시 스크롤 | `src/components/marketing/MarketingLayout.tsx` 외 | ✅ 완료 | ❌ 스냅샷/렌더 테스트 예정 |
| AI 워크스페이스 | 기존 OpenUI 생성 플로우 | `src/pages/AI` 이하 | ⏸ 기존 기능 유지 | ❌ 회귀 테스트 필요 |

## 2. TDD 전략 (체크리스트)
### 2.1 단위(Unit) 테스트
- [x] 마케팅 데이터/폼 스키마 검증 (`marketing.test.ts`)
- [x] 마케팅 레이아웃/헤더 렌더링 & 해시 네비게이션 동작 모의
- [x] 견적 폼 성공/에러 UI 상태 테스트 (fetch mock)
- [ ] 공용 UI 컴포넌트(CTAGroup, SectionHeading 등) 스냅샷 또는 렌더 테스트

### 2.2 통합(Integration) 테스트
- [ ] 라우팅 전환(`/` ↔ `/quote-request` ↔ `/ai`) 시 Suspense/Fallback 정상 여부 테스트
- [ ] 견적 폼 제출 시 API 호출/상태 변이 시나리오 통합 테스트
- [ ] 마케팅 페이지 컴포넌트 간 스크롤 앵커 동작(e.g., 헤더 링크 클릭 후 위치) 테스트

### 2.3 E2E / 브라우저 테스트
- [ ] Playwright 시나리오: 랜딩 → 견적 의뢰 → 폼 검증 → 성공 메시지
- [ ] 모바일 뷰 햄버거 메뉴 토글 및 네비게이션 시나리오
- [ ] 접근성 퀵체크(axe 혹은 Playwright a11y assertions)

## 3. 테스트 실행 가이드
| 목적 | 명령 | 비고 |
| --- | --- | --- |
| 단위/통합 테스트 | `pnpm run test` | Vitest, 필요 시 `--runInBand` |
| Lint/타입 체크 | `pnpm run lint` | ESLint + TypeScript + Stylelint |
| E2E (로컬) | `pnpm run test:e2e` | Playwright, 서버 필요 시 `pnpm dev` |

## 4. 다음 작업 우선순위
1. **Unit**: 견적 폼 API 모킹 테스트 추가 (폼 컴포넌트가 성공/실패 분기 처리하는지 검증)
2. **Integration**: 라우팅 전환 테스트 작성하여 마케팅/AI 공존 확인
3. **E2E**: Playwright 기본 시나리오 작성 (랜딩 → CTA → 폼 실패/성공 흐름)
4. **CI 연동**: `pnpm run test`를 PR 또는 커밋 훅에서 실행하도록 설정 검토

## 5. 진행 상황 보고 체크
- [x] 현재 구현 현황 정리
- [x] TDD 전략 문서화
- [x] 신규 테스트 작성 (Unit/Integration)
- [ ] E2E 시나리오 작성
- [ ] CI 파이프라인 점검

> 체크박스를 업데이트하며 진행 상황을 추적하세요. 신규 테스트 도입 시 섹션 2와 5를 갱신하면 TDD 흐름을 모니터링하기 쉽습니다.
