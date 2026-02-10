# Remotion 견적분석 영상 - 리뷰 로그

## 형식
각 라운드는 다음 구조로 기록:

```
### Round N

#### 리뷰어 피드백
- [카테고리] 피드백 내용

#### 디자이너 응답
- 수용/반영한 항목
- 거절/보류한 항목 (사유)

#### 변경사항
- 파일: 라인번호 - 변경 내용
```

---

## Round 1 (초기 구현)

### 현재 상태
- 7개 씬 구성 (질문/비교/과다/부실/메시지/결과/CTA)
- 기본 spring/interpolate 애니메이션 적용
- 640x640 정사각형, 30fps, 30초

### 선임 UI/UX 리뷰어 피드백

**리뷰어**: 선임 UI/UX 디자이너 (Frontend Engineer agent)
**일시**: 2026-02-10

---

#### A. 모션 디자인 (22/30)

1. **[Critical] 씬 전환이 전부 하드컷 (모든 Sequence 경계)**
   - 현재: `<Sequence from={120}>` 등으로 씬이 바뀔 때 이전 씬이 즉시 사라지고 새 씬이 즉시 나타남
   - 문제: 30초 내내 7번의 하드컷은 시청자에게 '끊김'을 느끼게 함. 특히 감정 전환이 필요한 Scene3→4(과다→부실)와 Scene5→6(메시지→결과)에서 심함
   - 제안: 각 씬 끝부분 15~20프레임에 fade-out (opacity 1→0), 다음 씬 시작 10프레임에 fade-in 적용. Sequence를 10~15프레임 오버랩시켜 crossfade 효과 구현. 최소한 Scene1→2, Scene5→6, Scene6→7에는 반드시 적용

2. **[Major] SceneQuestion의 spring config이 너무 딱딱함 (line 9)**
   - 현재: `damping: 20, stiffness: 100` → 움직임이 빠르게 안착하여 생동감이 부족
   - 제안: `damping: 12, stiffness: 80`으로 변경. 더 탄성있는 바운스로 "질문"이라는 호기심을 모션으로도 표현

3. **[Major] SceneCTA 버튼 펄스가 너무 미미함 (line 324)**
   - 현재: `[1, 1.03, 1]` → 3% 스케일 변화는 640px에서 거의 인지 불가
   - 제안: `[1, 1.06, 1]`로 키우고, 주기를 40→30프레임으로 줄여서 긴박감 추가. 또는 box-shadow 펄스 애니메이션 병행

4. **[Minor] ScenePriceCompare의 바 등장 타이밍 (line 31-33)**
   - 현재: delay `0, 8, 16` (약 0, 0.27, 0.53초 간격) → 괜찮으나, 마지막 바 등장 후 "왜 이렇게 다를까?" 질문까지 대기 시간이 김
   - 제안: delay를 `0, 10, 20`으로 살짝 늘려서 각 바를 읽을 시간을 주고, questionOpacity 시작을 [60,75]→[50,65]로 앞당기기

5. **[Minor] SceneMessage의 세 줄 등장 간격이 불균등 (line 219-222)**
   - 현재: line1은 frame-5부터, line2는 [30,45], line3는 [55,70]. line1→line2 간격(25f)과 line2→line3 간격(25f)은 같지만, line1의 spring과 line2의 linear interpolate 특성이 달라 체감 리듬이 다름
   - 제안: 세 줄 모두 spring 기반으로 통일하거나, 간격을 line1(0f)→line2(25f)→line3(55f)로 마지막 강조에 더 긴 pause를 줘서 극적 효과 강화

---

#### B. 시각 디자인 (18/25)

6. **[Critical] 640x640에서 md: breakpoint가 적용되지 않음 (다수 파일)**
   - 현재: `text-2xl md:text-4xl`, `text-sm md:text-base` 등 반응형 클래스 사용
   - 문제: Remotion은 고정 640x640 뷰포트. Tailwind의 `md:` 브레이크포인트(768px)에 도달하지 않으므로 모든 `md:` 클래스가 무시됨. 즉 항상 모바일 사이즈만 렌더링
   - 제안: `md:` 접두사를 모두 제거하고 640px에 최적화된 단일 사이즈로 직접 지정. 예: SceneQuestion에서 `text-2xl md:text-4xl` → `text-3xl` (640px에서 30px이 적절)

7. **[Major] SceneOverpriced/SceneUnderpriced의 가격 핀 UI가 작음 (line 122-127, 184-191)**
   - 현재: `w-4 h-16` 핀 + `w-3 h-3` 원 → 640px에서 핀이 너무 가늘고 작아서 "현재 가격 위치"가 한눈에 안 들어옴
   - 제안: 핀 위에 가격 라벨 텍스트 추가 (예: "450만원"), 핀 두께를 `w-1`로 키우고 원을 `w-4 h-4`로. 핀 색상도 더 진하게 (red-600, amber-600)

8. **[Major] SceneResult 카드 4개가 빽빽함 (line 277)**
   - 현재: `space-y-2.5` + 각 카드 `p-3` → 4개 카드가 640px 세로에서 콘텐츠와 여백이 부족
   - 제안: 카드를 3개로 줄이거나 (과다/점검/적정 각 1개), `space-y-3` + `p-3.5`로 약간의 숨 공간 확보. 하단 텍스트도 잘릴 위험 있음

9. **[Minor] 경고 카드의 경계가 약함 (Scene3,4 경고 박스)**
   - 현재: `border border-red-200` → 연한 보더가 bg-sand-50 위에서 시각적 대비가 약함
   - 제안: `border-2 border-red-300`으로 강화하거나, 좌측에 색상 bar (border-l-4) 추가

10. **[Minor] 전체적으로 bg-sand-50 단색 배경이 반복됨**
    - 7개 씬 중 6개가 동일한 `bg-sand-50`. CTA만 `bg-forest-600`
    - 제안: Scene5(핵심 메시지)를 약간 다른 톤 (bg-sand-100 또는 bg-forest-50)으로 차별화하여 시각적 변주 추가

---

#### C. 스토리텔링 (20/25)

11. **[Critical] Scene1(질문)이 4초(120f)로 너무 김**
    - 현재: 텍스트 1줄 + 소제목 "QUESTION"만 있는 씬에 4초
    - 문제: 텍스트 등장 후 나머지 2-3초 동안 정적 화면이 유지됨. 시청자가 2초 안에 읽고 나면 지루함 느낌
    - 제안: Scene1을 3초(90f)로 줄이고, Scene2를 5.5초로 확장하거나 전체 타이밍 재배분. 또는 Scene1 후반에 미세한 배경 변화(그라데이션 시프트)나 보조 요소 등장시키기

12. **[Major] Scene5→6 감정 전환이 급격함**
    - Scene5: 신뢰/브랜드 메시지 (감성적 톤)
    - Scene6: 데이터 테이블 (분석적 톤)
    - 사이에 전환 장치 없이 하드컷으로 넘어감
    - 제안: Scene5 마지막 20프레임에 "어떻게 분석할까요?" 같은 브릿지 텍스트를 페이드인하고, Scene6으로 자연스럽게 이어지게

13. **[Minor] Scene6 하단 카피가 좋지만 등장이 늦음 (line 305-313)**
    - "비싸다고 나쁜 게 아닙니다. 싸다고 좋은 게 아닙니다." → 핵심 메시지인데 [50,65] 시점에 등장 = 씬 시작 후 1.7초
    - 제안: [35,50]으로 앞당겨서 카드 4개 등장 직후 바로 나타나게

14. **[Minor] CTA 씬이 2초(60f)로 짧음**
    - CTA 버튼은 사용자가 인지하고 행동을 결심하기까지 시간이 필요
    - 제안: Scene6을 3.5초(105f)로 줄이고 CTA를 2.5초(75f)로 확장

---

#### D. 기술 품질 (15/20)

15. **[Major] 모든 씬이 하나의 파일에 391줄 (단일 파일)**
    - 현재: 7개 씬 컴포넌트 + 메인 컴포지션이 `PriceAnalysisVideo.tsx` 한 파일에
    - 제안: `scenes/` 폴더에 씬별 파일 분리. 메인 파일은 컴포지션과 타이밍만 관리
    ```
    remotion/
      scenes/
        SceneQuestion.tsx
        ScenePriceCompare.tsx
        ...
      PriceAnalysisVideo.tsx (컴포지션만)
      constants.ts (타이밍, 색상, spring config 등)
    ```

16. **[Major] spring config 값이 각 씬마다 하드코딩**
    - `{ damping: 20, stiffness: 100 }`, `{ damping: 15, stiffness: 120 }`, `{ damping: 12, stiffness: 80 }` 등이 산재
    - 제안: `constants.ts`에 `SPRING_CONFIGS` 객체로 분리
    ```typescript
    export const SPRING_CONFIGS = {
      gentle: { damping: 20, stiffness: 80 },
      bouncy: { damping: 12, stiffness: 100 },
      snappy: { damping: 15, stiffness: 150 },
      alert:  { damping: 10, stiffness: 200 },
    }
    ```

17. **[Minor] Sequence 타이밍도 하드코딩 (line 349-382)**
    - `from={0}`, `from={120}`, `from={270}` 등이 매직넘버
    - 제안: `SCENE_TIMINGS` 상수로 분리하면 타이밍 조정 시 한 곳만 수정하면 됨

18. **[Minor] statusColors 타입이 string key (line 266)**
    - `Record<string, { bg: string; text: string; border: string }>` → 타입 안전성 부족
    - 제안: `'danger' | 'warning' | 'ok'` 유니온 타입으로 제한

---

#### 총점

| 카테고리 | 점수 | 메모 |
|---------|------|------|
| A. 모션 디자인 | 22/30 | 하드컷 전환이 가장 큰 이슈 |
| B. 시각 디자인 | 18/25 | md: breakpoint 미적용이 치명적 |
| C. 스토리텔링 | 20/25 | 전체 흐름은 좋으나 씬 간 전환 장치 부족 |
| D. 기술 품질 | 15/20 | 단일 파일 구조, 매직넘버 산재 |
| **총점** | **75/100** | **Round 2에서 Critical 4건 우선 해결 필요** |

---

#### Critical 우선순위 요약 (반드시 Round 2에서 해결)

1. **#1** 씬 전환에 crossfade 적용 (하드컷 제거)
2. **#6** `md:` breakpoint 제거, 640px 단일 사이즈로 최적화
3. **#11** Scene1 시간 단축 + 전체 타이밍 재배분
4. **#7** 가격 핀 UI 크기 확대 + 가격 라벨 추가

#### Major 우선순위 요약 (가능하면 Round 2에서 해결)

5. **#2** SceneQuestion spring damping 조정
6. **#3** CTA 버튼 펄스 강화
7. **#8** SceneResult 카드 밀도 조정
8. **#12** Scene5→6 브릿지 텍스트 추가
9. **#15** 씬별 파일 분리
10. **#16** spring config 상수화

---

### Round 1 추가 요구사항: PC/모바일 듀얼 레이아웃

**일시**: 2026-02-10 (사용자 요청, Round 1 피드백과 동시 반영)

#### 요구사항 요약
- **모바일**: 640x640 (1:1, 현재 유지)
- **PC**: 1280x720 (16:9, 신규)
- 타이밍/콘텐츠 동일, 레이아웃과 폰트 사이즈만 다름
- Player 임베드 시 `useMediaQuery`로 분기

#### 리뷰어 디자인 가이드

19. **[Critical] 씬 컴포넌트 아키텍처를 layout-agnostic으로 설계**
    - 씬 컴포넌트는 "콘텐츠 로직 + 애니메이션"만 담당
    - 레이아웃(배치, 폰트 사이즈, 여백)은 컴포지션 레벨에서 prop으로 주입
    - 구현 방식: 각 씬에 `variant: 'mobile' | 'desktop'` prop 전달, 또는 React Context로 뷰포트 정보 공유
    ```typescript
    // 권장 패턴
    interface SceneProps {
      variant: 'mobile' | 'desktop'
    }

    function SceneQuestion({ variant }: SceneProps) {
      const isDesktop = variant === 'desktop'
      const titleSize = isDesktop ? 'text-4xl' : 'text-3xl'
      const padding = isDesktop ? 'px-20' : 'px-8'
      // ...
    }
    ```

20. **[Critical] PC 2컬럼 레이아웃 시 좌우 비율 가이드**
    - 텍스트 : 비주얼 = **45:55** 또는 **40:60** (비주얼에 더 많은 공간)
    - 좌측 텍스트 영역: 좌정렬, 상하 가운데
    - 우측 비주얼 영역: 가운데 정렬
    - 좌우 사이 간격: 최소 48px (gap-12)
    - 적용 씬: Scene2(가격 비교), Scene3/4(과다/부실), Scene6(결과)
    - 비적용 씬: Scene1(질문), Scene5(메시지), Scene7(CTA) → 가운데 정렬 유지, 와이드 여백 활용

21. **[Major] PC에서 SceneResult 카드 레이아웃 개선 기회**
    - 모바일: 세로 스택 4개 (공간 빽빽 → Round 1 #8에서 지적)
    - PC: **2x2 그리드** 가능 → 4개 카드 모두 유지하면서 여유 있는 레이아웃
    - 각 카드 크기 확대, 가격/라벨 폰트 사이즈 업

22. **[Major] PC에서 SceneOverpriced/SceneUnderpriced 바 차트 확대**
    - 모바일: max-w-md (448px) 안에서 가로 바
    - PC: max-w-xl (576px) 이상으로 확대, 바 높이도 h-14→h-18로
    - 가격 핀 + 라벨이 더 크게 보임 → Round 1 #7 이슈가 PC에서는 자연히 해결

23. **[Minor] 모바일 전용 Round 1 #6 수정은 그대로 유효**
    - `md:` breakpoint 제거 → 모바일 컴포지션에서는 단일 사이즈
    - PC 컴포지션에서는 별도 사이즈 지정 (prop 기반)
    - 즉, Tailwind 반응형 클래스를 아예 사용하지 않고 variant prop으로 제어

24. **[Minor] constants.ts에 뷰포트 상수 추가**
    ```typescript
    export const VIEWPORTS = {
      mobile: { width: 640, height: 640, label: '1:1' },
      desktop: { width: 1280, height: 720, label: '16:9' },
    } as const
    ```

#### Round 2 작업 순서 (권장)

```
1단계: constants.ts 생성 (타이밍, spring config, 뷰포트, 색상)
2단계: scenes/ 폴더 분리 + variant prop 아키텍처 적용
3단계: Round 1 Critical/Major 피드백 반영 (crossfade, 타이밍, 핀 UI 등)
4단계: PriceAnalysisDesktop.tsx 생성 (PC 컴포지션)
5단계: PriceAnalysisPlayer.tsx 생성 (useMediaQuery 분기 래퍼)
```

이 순서로 하면 #15(파일 분리)와 #16(상수화)가 자연스럽게 해결되고, PC 레이아웃 작업 시 코드 중복 없이 진행 가능.

---

## Round 2 중간 리뷰 (모바일 리팩토링 완료, PC 미반영)

**리뷰어**: 선임 UI/UX 디자이너 (Frontend Engineer agent)
**일시**: 2026-02-10
**대상**: 1~3단계 작업 결과 (constants.ts, scenes/ 분리, Round 1 피드백 반영)

---

### Round 1 피드백 반영 상태 체크

| # | 피드백 | 상태 | 메모 |
|---|--------|------|------|
| 1 | 씬 전환 crossfade | **반영 완료** | 모든 씬에 fadeIn/fadeOut interpolate + opacity 곱 방식 적용 |
| 2 | SceneQuestion spring damping | **반영 완료** | `SPRING_CONFIGS.bouncy` (damping:12, stiffness:80) 사용 |
| 3 | CTA 버튼 펄스 강화 | **반영 완료** | [1, 1.06, 1] + 30f 주기 |
| 4 | ScenePriceCompare 바 타이밍 | **반영 완료** | delay 0/10/20, questionOpacity [50,65] |
| 5 | SceneMessage 라인 등장 통일 | **반영 완료** | 모두 spring 기반, line3에 bouncy + 60f 지연 |
| 6 | md: breakpoint 제거 | **반영 완료** | 모든 `md:` 접두사 제거, 단일 사이즈 |
| 7 | 가격 핀 확대 + 라벨 | **반영 완료** | w-1 핀, w-4 h-4 원, 가격 텍스트 라벨 추가 |
| 8 | SceneResult 카드 밀도 | **반영 완료** | 4→3개 카드, space-y-3, p-3.5 |
| 9 | 경고 카드 보더 강화 | **반영 완료** | border-2 border-red-300 / border-amber-300 |
| 10 | Scene5 배경 차별화 | **반영 완료** | bg-sand-50 → bg-forest-50 |
| 11 | Scene1 시간 단축 | **반영 완료** | 120f → 90f |
| 12 | Scene5→6 브릿지 텍스트 | **반영 완료** | "어떻게 분석할까요?" 페이드인 |
| 13 | Scene6 하단 카피 등장 앞당김 | **반영 완료** | [50,65] → [35,50] |
| 14 | CTA 씬 확장 | **반영 완료** | 60f → 145f (from 755, 총 900f 맞춤) |
| 15 | 씬별 파일 분리 | **반영 완료** | scenes/ 폴더 + index.ts barrel export |
| 16 | spring config 상수화 | **반영 완료** | constants.ts에 SPRING_CONFIGS 객체 |
| 17 | Sequence 타이밍 상수화 | **반영 완료** | constants.ts에 SCENE_TIMINGS 객체 |
| 18 | statusColors 타입 강화 | **반영 완료** | StatusType 유니온 + Record<StatusType, ...> |

**Round 1 피드백: 18/18 반영 완료**

---

### 신규 발견 사항

25. **[Major] 타이밍 오버랩으로 총 프레임이 900을 초과할 수 있음**
    - 현재 SCENE_TIMINGS: cta.from(755) + cta.duration(145) = 900f (정확)
    - 하지만 message.from(505) + message.duration(160) = 665f, result.from(650) → 오버랩 15f (OK)
    - 검증 결과: 마지막 씬 끝이 정확히 900f이므로 문제 없음. 다만 `constants.ts`에 `// Total = 900 frames` 주석이 있는데, 오버랩 관계를 명시하는 다이어그램 주석 추가 권장
    ```
    // Timeline (frames, 30fps):
    // question:     |====90====|
    // priceCompare:       |========160========|
    // overpriced:                    |=====155=====|
    // underpriced:                            |=====155=====|
    // message:                                         |======160======|
    // result:                                                   |===120===|
    // cta:                                                          |=====145=====|
    //               0   80  90     225 240    365 380   505 520  650 665  755 770    900
    ```

26. **[Minor] crossfade 로직이 모든 씬에서 반복됨 (DRY 위반)**
    - 7개 씬 모두 동일한 fadeIn/fadeOut interpolate 패턴 (6줄씩)
    - 제안: `useCrossfade(duration)` 커스텀 훅으로 추출
    ```typescript
    // hooks/useCrossfade.ts
    export function useCrossfade(duration: number) {
      const frame = useCurrentFrame()
      const fadeIn = interpolate(frame, [0, CROSSFADE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      const fadeOut = interpolate(frame, [duration - CROSSFADE_FRAMES, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      return fadeIn * fadeOut
    }
    ```
    - SceneCTA만 fadeOut 없이 fadeIn만 사용 → 훅에 `noFadeOut?: boolean` 옵션 추가

27. **[Minor] SceneOverpriced의 가격 핀이 -top-8로 범위 바 위로 올라감**
    - `className="absolute -top-8 -translate-x-1/2"` + 72px 높이 핀
    - 640x640에서 핀 상단이 잘리지 않는지 확인 필요. 현재 mb-8(32px) 여백이 있어 괜찮을 것으로 보이나, 실제 렌더링 확인 권장

---

### PC/모바일 듀얼 레이아웃 상태

| # | 작업 | 상태 |
|---|------|------|
| 19 | variant prop 아키텍처 | **미반영** |
| 20 | PC 2컬럼 레이아웃 | **미반영** |
| 21 | PC SceneResult 2x2 그리드 | **미반영** |
| 22 | PC 바 차트 확대 | **미반영** |
| 23 | 모바일 md: 제거 | **반영 완료** (Round 1 #6에서 해결) |
| 24 | VIEWPORTS 상수 | **미반영** |

**다음 단계**: 4단계(PriceAnalysisDesktop.tsx) + 5단계(PriceAnalysisPlayer.tsx) 진행 필요

---

### 중간 점수 (모바일 기준)

| 카테고리 | Round 1 | Round 2 | 변화 |
|---------|---------|---------|------|
| A. 모션 디자인 | 22/30 | **27/30** | +5 (crossfade, spring 개선) |
| B. 시각 디자인 | 18/25 | **23/25** | +5 (md: 제거, 핀 확대, 보더 강화) |
| C. 스토리텔링 | 20/25 | **24/25** | +4 (타이밍 재배분, 브릿지 텍스트) |
| D. 기술 품질 | 15/20 | **18/20** | +3 (파일 분리, 상수화, 타입) |
| **총점** | **75/100** | **92/100** | **+17** |

모바일 버전은 매우 양호. PC 듀얼 레이아웃 반영 후 최종 리뷰 예정.

---

## Round 2 디자이너 응답 (PC 듀얼 레이아웃 + 추가 피드백 반영)

**디자이너**: Remotion Motion Designer (remotion-designer agent)
**일시**: 2026-02-10

---

### 반영 항목

| # | 피드백 | 상태 | 반영 내용 |
|---|--------|------|-----------|
| 19 | variant prop 아키텍처 | **반영 완료** | `SceneProps { variant?: 'mobile' \| 'desktop' }` + `isDesktop` 분기 |
| 20 | PC 2컬럼 레이아웃 | **반영 완료** | Scene2/3/4/6: 좌측 텍스트(40%) + 우측 비주얼(60%), gap-12 |
| 21 | PC SceneResult 2x2 그리드 | **반영 완료** | Desktop: `grid-cols-2 gap-3` (4개 카드), Mobile: 세로 스택 (3개) |
| 22 | PC 바 차트 확대 | **반영 완료** | Desktop: max-w-xl, 바 높이 72px (style prop), 라벨 text-sm |
| 23 | 모바일 md: 제거 (기존) | **반영 완료** | Round 1 #6에서 이미 해결 |
| 24 | VIEWPORTS 상수 | **반영 완료** | `constants.ts`에 VIEWPORTS 추가 |
| 25 | 타이밍 다이어그램 주석 | **반영 완료** | constants.ts에 ASCII 타임라인 주석 추가 |
| 26 | useCrossfade 훅 | **반영 완료** | `hooks/useCrossfade.ts` 추출, 5개 씬에서 사용 |
| 27 | 핀 오버플로 확인 | **확인 완료** | mb-8 여백 + justify-center로 잘리지 않음 |

### 신규 파일

- `remotion/hooks/useCrossfade.ts` - crossfade 커스텀 훅 (fadeIn * fadeOut, noFadeOut 옵션)
- `remotion/PriceAnalysisPlayer.tsx` - useMediaQuery로 PC/모바일 자동 분기 Player 래퍼

### 수정 파일

- `remotion/constants.ts` - VIEWPORTS 상수, SceneProps 인터페이스, 타임라인 다이어그램
- `remotion/PriceAnalysisVideo.tsx` - PriceAnalysisBase(variant) + Desktop/Mobile 컴포지션 export
- `remotion/scenes/*.tsx` (7개) - variant prop 지원, useCrossfade 훅 적용, desktop 2컬럼 레이아웃

### 아키텍처 변경 요약

```
PriceAnalysisPlayer.tsx
  ├─ useMediaQuery('(min-width: 768px)')
  ├─ Desktop → <Player component={PriceAnalysisDesktop} 1280x720 />
  └─ Mobile  → <Player component={PriceAnalysisMobile}  640x640 />

PriceAnalysisVideo.tsx
  ├─ PriceAnalysisBase({ variant }) ← 공유 컴포지션
  ├─ PriceAnalysisDesktop = Base(variant="desktop")
  └─ PriceAnalysisMobile  = Base(variant="mobile")

scenes/*.tsx
  └─ SceneXxx({ variant })
       ├─ isDesktop → 2컬럼, 큰 폰트, 넓은 여백
       └─ isMobile  → 세로 스택, 작은 폰트, 좁은 여백
```

### TypeScript 검증

- `npx tsc --noEmit` 실행: remotion 관련 에러 0건

---

## Round 2 최종 리뷰

**리뷰어**: 선임 UI/UX 디자이너 (Frontend Engineer agent)
**일시**: 2026-02-10
**대상**: PC 1280x720 와이드 레이아웃 + 전체 아키텍처

---

### 전체 피드백 반영 상태 (Round 1 + Round 2)

| # | 피드백 | 최종 상태 |
|---|--------|----------|
| 1~18 | Round 1 전체 | **27/27 반영 완료** |
| 19 | variant prop 아키텍처 | **반영 완료** |
| 20 | PC 2컬럼 레이아웃 | **반영 완료** |
| 21 | PC SceneResult 2x2 그리드 | **반영 완료** |
| 22 | PC 바 차트 확대 | **반영 완료** |
| 23 | 모바일 md: 제거 | **반영 완료** |
| 24 | VIEWPORTS 상수 | **반영 완료** |
| 25 | 타이밍 다이어그램 주석 | **반영 완료** |
| 26 | useCrossfade 훅 | **반영 완료** |
| 27 | 핀 오버플로 확인 | **확인 완료** |

**총 27건 전체 반영 완료.**

---

### A. 모션 디자인 (28/30)

**잘된 점:**
- useCrossfade 훅으로 모든 씬에 일관된 크로스페이드 적용
- SceneQuestion은 첫 씬이므로 fade-out만 적용 (올바른 판단)
- SceneCTA는 마지막 씬이므로 fade-in만 (noFadeOut 옵션 없이 직접 처리 -- 훅과 일관성은 아래 지적)
- spring config 프리셋이 씬 성격에 잘 맞음 (bouncy for 질문, snappy for 데이터, gentle for 메시지)
- bridgeOpacity를 spring 기반으로 변경하여 더 유기적인 전환

**개선 가능 사항:**
28. **[Minor] SceneQuestion이 useCrossfade를 import하지만 사용하지 않음**
    - `SceneQuestion.tsx:4` -- `import { useCrossfade }` 존재하나 실제 호출 없음 (첫 씬이라 직접 fadeOut 구현)
    - 사용하지 않는 import 제거하거나, `useCrossfade(duration, { noFadeIn: true })` 옵션 추가 고려
    - 마찬가지로 SceneCTA도 useCrossfade를 import하지만 직접 fadeIn 구현 (line 12-15)
    - 두 씬 모두 dead import. 깔끔하게 제거하거나 훅에 `noFadeIn`/`noFadeOut` 양방향 옵션 추가

29. **[Minor] PC 2컬럼 씬에서 좌측 텍스트 등장 애니메이션이 없음**
    - Scene2/3/4/6 desktop의 좌측 영역은 opacity나 translateX 없이 정적 등장
    - 우측 비주얼은 spring/interpolate로 동적인데 좌측은 즉시 나타남 → 비대칭
    - 제안: 좌측 텍스트도 가볍게 `translateX(-20px) → 0` + opacity 적용 (frame 0~15)

---

### B. 시각 디자인 (24/25)

**잘된 점:**
- PC 2컬럼 비율(40:60)이 DESIGN_CONTEXT.md 가이드와 정확히 일치
- gap-12(48px), px-16으로 충분한 여백 확보
- max-w-5xl(1024px) 컨테이너로 1280px 뷰포트에서 좌우 128px 여백 (적절)
- SceneResult 2x2 그리드가 PC에서 4카드를 효과적으로 활용
- 폰트 사이즈 단계 업이 일관적 (text-sm→base, text-xl→2xl, text-3xl→4xl 등)
- 센터 정렬 씬(Scene1/5/7)에 max-w-2xl(672px) 적용하여 텍스트 줄 길이 적절

**개선 가능 사항:**
30. **[Minor] SceneOverpriced/Underpriced의 바 높이 지정이 이중으로 됨**
    - `className="... h-18"` + `style={{ height: isDesktop ? 72 : undefined }}`
    - Tailwind `h-18`은 기본 스케일에 없으므로 className에서는 무시되고 style prop만 작동함
    - `h-18` 클래스를 제거하거나, Tailwind config에 추가하거나, style prop만 남기기

---

### C. 스토리텔링 (24/25)

**잘된 점:**
- PC 2컬럼에서 좌측에 맥락(자재명, 설명, 경고), 우측에 데이터(바, 카드) 배치가 시선 흐름에 자연스러움
- ScenePriceCompare desktop에서 "왜 이렇게 다를까?"가 좌측에 배치되어 바 차트를 보면서 자연스럽게 읽힘
- SceneResult에서 하단 카피("비싸다고 나쁜 게 아닙니다")를 좌측에 배치하여 카드와 나란히 읽히는 레이아웃

**개선 가능 사항:**
31. **[Minor] ScenePriceCompare desktop에서 좌측 텍스트가 약간 빈약**
    - 좌측: "25평 아파트 전체 리모델링" (text-sm) + "왜 이렇게 다를까?" (text-lg)
    - 40% 영역에 텍스트 2줄만 있어 시각적으로 비어 보일 수 있음
    - 제안: "같은 공사, 다른 견적" 같은 부제목을 추가하거나, 좌측 텍스트를 더 큰 사이즈로 (text-xl→text-2xl)

---

### D. 기술 품질 (19/20)

**잘된 점:**
- PriceAnalysisBase 공유 컴포지션 + Desktop/Mobile export 패턴이 깔끔
- VIDEO_WIDTH/HEIGHT를 VIEWPORTS.desktop에서 파생하여 Single Source of Truth
- SceneProps interface와 variant 타입이 잘 정의됨
- ResultCard를 별도 컴포넌트로 추출 (SceneResult 내부)하여 모바일/PC 카드 공유
- ITEMS_MOBILE / ITEMS_DESKTOP 분리로 PC에서 4카드, 모바일에서 3카드 명확한 로직
- useCrossfade 훅이 깔끔 (noFadeOut 파라미터)
- PriceAnalysisPlayer에서 useMediaQuery SSR 안전 처리 (typeof window check)
- constants.ts에 ASCII 타임라인 다이어그램 (#25) -- 가독성 높음

**개선 가능 사항:**
32. **[Minor] PriceAnalysisPlayer가 PriceAnalysisMobile을 import하지만 현재 모바일은 보류**
    - 모바일이 보류 상태이므로 PriceAnalysisMobile 관련 코드가 빌드에 포함됨
    - 당장 문제는 없지만, 현재 스펙상 PC만 사용한다면 Player에서 모바일 분기를 주석 처리하거나, PC 전용 심플 Player로 만들어도 됨
    - 이건 나중에 모바일 추가 시 되살리면 되므로 낮은 우선순위

---

### 최종 점수

| 카테고리 | Round 1 | Round 2 중간 | Round 2 최종 | 변화 |
|---------|---------|-------------|-------------|------|
| A. 모션 디자인 | 22/30 | 27/30 | **28/30** | +1 (useCrossfade 훅, bridge spring) |
| B. 시각 디자인 | 18/25 | 23/25 | **24/25** | +1 (PC 2컬럼, 폰트 스케일링) |
| C. 스토리텔링 | 20/25 | 24/25 | **24/25** | = (PC 레이아웃 시선 흐름 양호) |
| D. 기술 품질 | 15/20 | 18/20 | **19/20** | +1 (공유 컴포지션, 타입 안전성) |
| **총점** | **75/100** | **92/100** | **95/100** | **+20 from Round 1** |

---

### 최종 Minor 정리 (선택적 반영)

| # | 내용 | 우선순위 |
|---|------|---------|
| 28 | SceneQuestion/CTA에서 useCrossfade dead import 제거 | Low |
| 29 | PC 2컬럼 좌측 텍스트에 가벼운 등장 애니메이션 추가 | Medium |
| 30 | SceneOverpriced/Underpriced h-18 중복 높이 지정 정리 | Low |
| 31 | ScenePriceCompare 좌측 텍스트 보강 또는 사이즈 업 | Low |
| 32 | PriceAnalysisPlayer 모바일 분기 정리 (보류 상태 반영) | Low |

**Critical/Major 이슈: 0건**
모든 Critical/Major가 해결되었으며, 남은 5건은 모두 Minor (폴리싱 수준). 디자이너 판단에 따라 선택적 반영.

---

### 결론

Round 1(75점) → Round 2 최종(95점)으로 크게 개선되었습니다.

**특히 잘된 점:**
1. 아키텍처: PriceAnalysisBase + variant prop으로 코드 중복 없이 PC/모바일 분기
2. 모션: useCrossfade 훅 + spring config 프리셋으로 일관된 모션 언어
3. PC 레이아웃: 40:60 2컬럼이 1280x720 16:9에서 정보 밀도와 가독성 모두 확보
4. 타입 안전성: StatusType, SceneProps, ResultItem 모두 명확한 타입 정의

PC 1280x720 버전은 **Production Ready** 수준입니다.

---

## Round 2 폴리싱 (Minor 5건 반영)

**디자이너**: Remotion Motion Designer (remotion-designer agent)
**일시**: 2026-02-10

| # | 피드백 | 상태 | 반영 내용 |
|---|--------|------|-----------|
| 28 | useCrossfade dead import | **반영 완료** | SceneQuestion, SceneCTA에서 미사용 import 제거 |
| 29 | PC 좌측 텍스트 등장 애니메이션 | **반영 완료** | Scene2/3/4/6 desktop에 `translateX(-20→0) + opacity` spring 추가 |
| 30 | h-18 중복 높이 지정 | **반영 완료** | className에서 h-18 제거, style prop만 사용 (`height: isDesktop ? 72 : 56`) |
| 31 | ScenePriceCompare 좌측 텍스트 보강 | **반영 완료** | "같은 공사, 다른 견적" 부제목 text-2xl 추가 |
| 32 | PriceAnalysisPlayer 모바일 분기 정리 | **반영 완료** | PC 전용 심플 Player로 변경 (useMediaQuery/Mobile import 제거) |

**TypeScript 에러: 0건**
**총 반영: Round 1(18) + Round 2(9) + 폴리싱(5) = 32건 전체 반영 완료**
