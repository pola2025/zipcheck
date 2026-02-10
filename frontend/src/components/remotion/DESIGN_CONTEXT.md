# Remotion 견적분석 영상 - 디자인 컨텍스트

## 프로젝트 목표
ZipCheck 랜딩페이지에 삽입할 30초 인터랙티브 애니메이션.
소비자에게 "왜 견적분석이 필요한지" 설득하는 콘텐츠.

## 핵심 메시지 (CRITICAL - 절대 변경 금지)
1. **ZipCheck은 인테리어 업체가 아님** - 소비자 편에 서는 서비스
2. **최저가 찾기가 아님** - 자재 등급에 맞는 적정가격 분석
3. **양방향 리스크 점검**:
   - 너무 비쌀 때 → 과다청구 리스크
   - 너무 쌀 때 → 자재 하향/부실시공 리스크
4. **"실제 인테리어 유통망 가격 기반 원가분석"** - 이 표현 사용
5. ~~"3,000건 시공데이터"~~ → 사용 금지

## 스토리라인 (30초, 30fps = 900프레임)
```
[0-4초]   질문: "견적서 받았는데... 이게 적정 가격인지 어떻게 알죠?"
[4-9초]   업체별 가격 비교: 같은 공사인데 왜 이렇게 다른지
[9-14초]  과다청구 경고: 적정범위 바 + 위로 튀는 가격
[14-19초] 부실 리스크: 적정범위 바 + 아래로 빠지는 가격
[19-24초] 핵심 메시지: 인테리어 업체 아님 / 유통망 원가 기반
[24-28초] 분석 결과 미리보기: 항목별 적정/점검/리스크 라벨
[28-30초] CTA: 내 견적서 분석받기
```

## 디자인 시스템 (Nordic Design)
- **색상**: forest(초록), sand(베이지), wood(갈색), red/amber(경고)
- **폰트**: Pretendard, Noto Sans KR
- **스타일**: 미니멀, 여백 충분, 부드러운 모션
- **카드**: rounded-xl/2xl, border border-sand-300

## 뷰포트 (PC 우선, 모바일 보류)

> **현재 PC 1280x720만 진행. 모바일 640x640은 PC 확정 후 별도 진행.**

| 환경 | 해상도 | 비율 | 상태 |
|------|--------|------|------|
| **PC** | 1280x720 | 16:9 | **진행 중 (우선)** |
| ~~모바일~~ | ~~640x640~~ | ~~1:1~~ | 보류 |

### PC 1280x720 레이아웃 가이드 (ACTIVE)

**와이드 레이아웃 원칙**: 16:9 비율에서 좌우 공간을 적극 활용

#### 2컬럼 씬 (Scene2, Scene3, Scene4, Scene6)
- **비율**: 텍스트 40% : 비주얼 60%
- **좌측**: 텍스트/설명 영역, 좌정렬, 상하 가운데
- **우측**: 차트/바/카드 비주얼 영역, 가운데 정렬
- **좌우 간격**: gap-12 (48px) 이상
- **좌우 패딩**: px-16~20

| 씬 | 좌측 | 우측 |
|----|------|------|
| Scene2 (가격 비교) | "25평 아파트 전체 리모델링" + "왜 이렇게 다를까?" | 가격 바 차트 3개 |
| Scene3 (과다청구) | "바닥재 (강마루)" + 경고 카드 | 적정범위 바 + 가격 핀 |
| Scene4 (부실 리스크) | "도배 (실크벽지)" + 경고 카드 | 적정범위 바 + 가격 핀 |
| Scene6 (결과) | "견적 분석 리포트" + 하단 카피 | 결과 카드 리스트 (세로 3개 또는 2x2 그리드) |

#### 센터 정렬 씬 (Scene1, Scene5, Scene7)
- **가운데 정렬 유지**, 와이드 여백으로 시각적 여유
- 최대 너비 max-w-2xl (672px) 정도로 텍스트 줄 길이 제한
- 폰트 사이즈 업: text-4xl~text-5xl 제목, text-xl 본문

#### 폰트 사이즈 (1280px 기준)
| 용도 | 사이즈 |
|------|--------|
| 소제목 (QUESTION, ANALYSIS RESULT 등) | text-sm~text-base |
| 메인 제목 | text-4xl (36px) |
| 본문/설명 | text-xl (20px) |
| 수치/라벨 | text-base~text-lg |
| 소형 텍스트 | text-sm |

#### 바 차트 (Scene3/4)
- 바 컨테이너: max-w-xl (576px) 이상, 높이 h-16~h-18
- 가격 핀: 현재보다 크게, 가격 라벨 text-sm
- 적정범위 라벨: text-sm

#### 결과 카드 (Scene6)
- PC에서는 4개 카드 유지 가능 (공간 충분)
- 세로 스택 or 2x2 그리드 모두 가능

### 모바일 640x640 (보류)
> PC 확정 후 별도 진행. 기존 모바일 코드는 참고용으로 보존.

### Player 임베드 방식 (현재 PC만)
- `<Player compositionWidth={1280} compositionHeight={720} />`
- 모바일 분기는 나중에 추가

## 기술 스택
- Remotion 4.x + @remotion/player
- React 18 + TypeScript
- Tailwind CSS (프로젝트 커스텀 색상 사용)

## 파일 구조
```
frontend/src/components/remotion/
  constants.ts                 # 타이밍, spring config, 색상, 뷰포트 상수
  PriceAnalysisVideo.tsx       # PC 컴포지션 (1280x720, 현재 메인)
  scenes/
    SceneQuestion.tsx
    ScenePriceCompare.tsx
    SceneOverpriced.tsx
    SceneUnderpriced.tsx
    SceneMessage.tsx
    SceneResult.tsx
    SceneCTA.tsx
    index.ts
  DESIGN_CONTEXT.md
  REVIEW_LOG.md
```

## 참고 파일
- 이 문서: `frontend/src/components/remotion/DESIGN_CONTEXT.md`
- 리뷰 로그: `frontend/src/components/remotion/REVIEW_LOG.md`

---

## 라운드별 리뷰 기록

(아래에 에이전트들이 라운드별로 추가)
