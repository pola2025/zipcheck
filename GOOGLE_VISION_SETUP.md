# Google Cloud Vision API 설정 가이드

견적서 이미지 분석을 위해 Google Cloud Vision API를 통합했습니다.

## 비용 효율적인 하이브리드 방식

**이전 방식:** Claude Vision API (~$0.015/이미지)
**새로운 방식:** Google Vision (OCR) + Claude (구조화)

### 단계별 처리
1. **Google Cloud Vision API**: OCR로 텍스트만 추출 (저렴, 월 1000건 무료)
2. **Claude API**: 추출된 텍스트를 JSON 구조화 (이미지 분석보다 훨씬 저렴)

### 예상 비용
- Google Vision OCR: 월 1000건 무료, 이후 $1.50/1000건
- Claude Text Processing: ~$0.003/요청 (이미지 분석 대비 80% 절약)

---

## 설정 방법

### 1. Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 결제 계정 설정 (무료 크레딧 $300 제공)

### 2. Vision API 활성화

1. Google Cloud Console에서 **"API 및 서비스" > "라이브러리"** 이동
2. **"Cloud Vision API"** 검색
3. **"사용 설정"** 클릭

### 3. API 키 생성

#### 방법 1: API 키 사용 (간단, 권장)

1. **"API 및 서비스" > "사용자 인증 정보"** 이동
2. **"사용자 인증 정보 만들기" > "API 키"** 클릭
3. 생성된 API 키 복사
4. **보안 강화 (선택):**
   - API 키 제한 설정
   - "API 제한사항" → "Cloud Vision API"만 선택
   - "애플리케이션 제한사항" → IP 주소 제한 추가

#### 방법 2: 서비스 계정 사용 (프로덕션 권장)

1. **"API 및 서비스" > "사용자 인증 정보"** 이동
2. **"사용자 인증 정보 만들기" > "서비스 계정"** 클릭
3. 서비스 계정 이름 입력 후 생성
4. 역할: **"Cloud Vision API 사용자"** 선택
5. **"키 추가" > "JSON"** 클릭하여 키 파일 다운로드

### 4. 환경 변수 설정

#### API 키 사용 시:

`backend/.env` 파일에 추가:

\`\`\`bash
# Google Cloud Vision API (OCR용)
GOOGLE_CLOUD_API_KEY=your_api_key_here

# Claude API (텍스트 구조화용)
CLAUDE_API_KEY=your_claude_api_key_here
\`\`\`

#### 서비스 계정 사용 시:

\`\`\`bash
# Google Cloud Vision API (JSON 키 파일 경로)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Claude API (텍스트 구조화용)
CLAUDE_API_KEY=your_claude_api_key_here
\`\`\`

### 5. 백엔드 재시작

\`\`\`bash
cd backend
npm run dev
\`\`\`

---

## 테스트

### 이미지 분석 API 테스트

\`\`\`bash
curl -X POST http://localhost:3001/api/quote-requests/parse-image \\
  -F "images=@/path/to/quote-image.jpg"
\`\`\`

### 예상 응답

\`\`\`json
{
  "success": true,
  "items": [
    {
      "category": "철거",
      "item": "기존 바닥재 철거",
      "quantity": 30,
      "unit": "평",
      "unit_price": 15000,
      "total_price": 450000
    },
    {
      "category": "목공",
      "item": "몰딩 설치",
      "quantity": 1,
      "unit": "식",
      "unit_price": 800000,
      "total_price": 800000
    }
  ],
  "message": "1장의 이미지에서 2개 항목을 추출했습니다."
}
\`\`\`

---

## 비용 관리

### 무료 할당량
- **Google Vision API**: 월 1,000건 무료
- 이후: $1.50/1,000건

### 모니터링
1. Google Cloud Console → **"결제"** → **"보고서"**
2. Vision API 사용량 확인
3. 예산 알림 설정 권장

### 비용 절감 팁
1. 이미지 최적화: 백엔드가 자동으로 압축 (평균 70% 절감)
2. 캐싱: 동일 이미지 재분석 방지
3. 배치 처리: 여러 이미지를 한 번에 처리

---

## 트러블슈팅

### 오류: "Google Cloud credentials not found"

**해결:**
- `.env` 파일에 `GOOGLE_CLOUD_API_KEY` 설정
- 또는 `GOOGLE_APPLICATION_CREDENTIALS` 경로 확인

### 오류: "API key not valid"

**해결:**
1. API 키가 정확한지 확인
2. Cloud Vision API가 활성화되었는지 확인
3. API 키 제한사항 확인 (IP, API 제한)

### 오류: "Quota exceeded"

**해결:**
- Google Cloud Console에서 할당량 확인
- 결제 계정 활성화
- 할당량 증가 요청

### OCR 품질 개선

**권장사항:**
1. 고해상도 이미지 업로드 (최소 1920px)
2. 텍스트가 선명한 이미지 사용
3. 기울어지지 않은 정면 촬영
4. 조명이 균일한 환경에서 촬영

---

## 보안 권장사항

### API 키 보안
- ✅ `.env` 파일은 `.gitignore`에 포함
- ✅ API 키는 절대 코드에 하드코딩하지 않기
- ✅ 프로덕션에서는 서비스 계정 사용
- ✅ API 키 제한사항 설정 (IP, API 제한)

### 서비스 계정 보안
- ✅ JSON 키 파일을 안전한 위치에 저장
- ✅ 최소 권한 원칙 적용
- ✅ 정기적으로 키 교체

---

## 참고 자료

- [Google Cloud Vision API 문서](https://cloud.google.com/vision/docs)
- [Vision API 가격](https://cloud.google.com/vision/pricing)
- [Claude API 가격](https://www.anthropic.com/pricing)
- [API 키 보안 모범 사례](https://cloud.google.com/docs/authentication/api-keys)
