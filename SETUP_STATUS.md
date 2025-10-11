# ZipCheck 데이터 관리 시스템 - 설정 현황

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 설계
- **파일**: `supabase-schema.sql`, `supabase/migrations/[timestamp]_initial_schema.sql`
- **테이블 구조**:
  - `categories`: 카테고리 관리
  - `items`: 항목 관리 (aliases 지원으로 유사 항목 자동 매칭)
  - `construction_records`: 시공 데이터 (2024-2025)
  - `distributor_prices`: 유통사 가격 데이터
  - `market_averages`: 시장 평균 자동 계산
  - `upload_history`: 업로드 이력 추적

### 2. 백엔드 API 서버 구축
- **기술 스택**: Node.js + Express + TypeScript
- **주요 기능**:
  - Excel/CSV 파일 파싱 (`xlsx` 라이브러리)
  - 데이터 검증 및 저장
  - 에러 추적 및 보고
  - 시장 평균 자동 재계산

- **API 엔드포인트**:
  ```
  POST /api/admin/upload-construction  # 시공 데이터 업로드
  POST /api/admin/upload-distributor   # 유통사 가격 업로드
  POST /api/admin/recalculate-averages # 시장 평균 재계산
  GET  /api/admin/upload-history       # 업로드 이력 조회
  POST /api/analyze-quote              # AI 견적 분석 (예정)
  ```

### 3. Excel 파싱 및 검증 로직
- **파일**: `backend/src/services/excel-parser.ts`
- **기능**:
  - 한글 컬럼명 지원
  - 금액 파싱 (콤마, 원화 기호 제거)
  - 필수/선택 필드 검증
  - 행별 오류 추적

### 4. 데이터 업로드 서비스
- **파일**: `backend/src/services/data-upload.ts`
- **기능**:
  - 카테고리/항목 자동 생성
  - 유사 항목명 자동 매칭 (첫 5글자 기준)
  - Aliases 자동 추가
  - 행별 성공/실패 추적
  - 업로드 이력 자동 기록

### 5. 보안 설정
- **Git 보안**:
  - `.gitignore` (루트 + 백엔드)
  - `.env` 파일 보호
  - Supabase 설정 파일 제외

- **환경 변수 분리**:
  - `.env` (실제 값 - Git 제외)
  - `.env.example` (템플릿 - Git 포함)

### 6. 문서화
- `SUPABASE_SETUP.md`: Supabase 설정 가이드
- `DATA_FORMAT_GUIDE.md`: 데이터 업로드 형식 가이드
- `SETUP_STATUS.md`: 이 파일

---

## 📋 다음 단계 (순서대로 진행)

### Step 1: Supabase 크레덴셜 설정
1. [Supabase 대시보드](https://app.supabase.com) 로그인
2. Settings > API에서 다음 정보 복사:
   - Project URL
   - anon (public) key
   - service_role key
3. `backend/.env` 파일에 값 입력

### Step 2: 데이터베이스 마이그레이션

**방법 A: Supabase 대시보드 (간편)**
1. SQL Editor 메뉴 열기
2. `supabase-schema.sql` 내용 복사/붙여넣기
3. Run 실행

**방법 B: CLI (권장)**
```bash
# Access Token 발급 (Supabase 대시보드 > Account > Access Tokens)
npx supabase login --token YOUR_TOKEN

# 프로젝트 연결 (Settings > General에서 Reference ID 확인)
npx supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 실행
npx supabase db push
```

### Step 3: 백엔드 서버 실행
```bash
cd backend
npm install
npm run dev
```

### Step 4: 연결 테스트
```bash
# 헬스 체크
curl http://localhost:3001/health

# 예상 응답
{"status":"ok","message":"ZipCheck Backend is running!"}
```

### Step 5: 프론트엔드 연결
1. 관리자 UI 열기: `http://localhost:5173/admin/data`
2. 백엔드 API URL 설정 확인
3. 샘플 데이터로 업로드 테스트

### Step 6: 실제 데이터 업로드
1. `DATA_FORMAT_GUIDE.md` 참고하여 Excel 파일 준비
2. 관리자 페이지에서 업로드
3. Supabase Table Editor에서 데이터 확인

---

## 📁 프로젝트 구조

```
GOI/
├── backend/                    # 백엔드 API 서버
│   ├── src/
│   │   ├── index.ts           # Express 서버 진입점
│   │   ├── lib/
│   │   │   └── supabase.ts    # Supabase 클라이언트
│   │   └── services/
│   │       ├── excel-parser.ts      # Excel 파싱
│   │       ├── data-upload.ts       # 데이터 업로드
│   │       └── data-management.ts   # 데이터 관리
│   ├── .env                   # 환경 변수 (Git 제외)
│   ├── .env.example          # 환경 변수 템플릿
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
├── openui/frontend/           # 프론트엔드
│   └── src/pages/Admin/
│       └── DataManagement.tsx # 관리자 데이터 업로드 UI
│
├── supabase/                  # Supabase 설정
│   ├── config.toml           # Supabase CLI 설정
│   └── migrations/
│       └── [timestamp]_initial_schema.sql
│
├── .gitignore                # Git 제외 파일 설정
├── supabase-schema.sql       # DB 스키마 원본
├── SUPABASE_SETUP.md         # Supabase 설정 가이드
├── DATA_FORMAT_GUIDE.md      # 데이터 형식 가이드
└── SETUP_STATUS.md           # 이 파일
```

---

## 🔒 보안 체크리스트

- [x] `.gitignore` 파일 생성 (루트)
- [x] `backend/.gitignore` 생성
- [x] `.env` 파일이 Git에서 제외되는지 확인
- [ ] Supabase 크레덴셜 입력 후 커밋 전 `git status` 재확인
- [ ] GitHub 푸시 전 민감 정보 포함 여부 최종 점검

---

## 🚀 다음 개발 단계

1. **데이터 시각화**
   - 업로드된 데이터 통계 대시보드
   - 시장 평균 트렌드 차트

2. **AI 견적 분석 엔진**
   - Claude API 연동
   - 프롬프트 엔지니어링
   - 실시간 견적 분석 기능

3. **추가 기능**
   - 데이터 수정/삭제 기능
   - 엑셀 export
   - 사용자 권한 관리

---

## 💡 참고사항

### 데이터 처리 방식
- **시공 데이터**: 계속 누적됨 (historical data)
- **유통사 가격**: 최신 데이터로 업데이트 (`is_current` 플래그)
- **카테고리/항목**: 자동 생성, 유사 항목 자동 매칭

### 에러 처리
- 행별 독립적 처리: 한 행 오류가 전체 업로드 중단시키지 않음
- 상세 에러 로그: 행 번호와 오류 메시지 제공
- 업로드 이력에 에러 내역 저장

### 성공 기준
- ✅ 백엔드 서버 정상 실행 (port 3001)
- ✅ Supabase 연결 성공
- ✅ 샘플 데이터 업로드 성공
- ✅ Table Editor에서 데이터 확인 가능
