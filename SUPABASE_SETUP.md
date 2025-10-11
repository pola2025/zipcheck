# Supabase 설정 가이드

## 1. Supabase 프로젝트 정보 가져오기

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **Settings** > **API** 메뉴로 이동
4. 다음 정보를 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key ⚠️ **절대 Git에 커밋하지 말 것!**

## 2. 환경 변수 설정

`backend/.env` 파일을 열고 위에서 복사한 값을 입력:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # service_role key
SUPABASE_ANON_KEY=eyJhbGc...     # anon key
```

## 3. 데이터베이스 스키마 적용 (방법 1: Supabase 대시보드)

1. Supabase 대시보드에서 **SQL Editor** 메뉴로 이동
2. **New query** 클릭
3. `supabase-schema.sql` 파일 내용을 복사해서 붙여넣기
4. **Run** 클릭하여 실행

## 4. 데이터베이스 스키마 적용 (방법 2: CLI - 추천)

### 4.1 Supabase 프로젝트 연결

먼저 Access Token 발급:
1. Supabase 대시보드 > **Account** > **Access Tokens**
2. **Generate new token** 클릭
3. 토큰 이름 입력 (예: "GOI-CLI")
4. 생성된 토큰 복사

그 다음 CLI로 로그인:
```bash
npx supabase login --token YOUR_ACCESS_TOKEN
```

### 4.2 프로젝트 연결
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Project Reference ID 찾기:**
- Supabase 대시보드 > **Settings** > **General**
- **Reference ID** 복사

### 4.3 마이그레이션 푸시
```bash
npx supabase db push
```

## 5. 백엔드 서버 실행

```bash
cd backend
npm install
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

## 6. 테스트

헬스 체크:
```bash
curl http://localhost:3001/health
```

응답:
```json
{"status":"ok","message":"ZipCheck Backend is running!"}
```

## 보안 체크리스트

- ✅ `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- ✅ `SUPABASE_SERVICE_KEY`는 절대 프론트엔드나 Git에 노출하지 말 것
- ✅ GitHub에 푸시하기 전에 `git status`로 민감한 파일이 포함되지 않았는지 확인

## 다음 단계

1. ✅ Supabase 연결 완료
2. 관리자 UI에서 Excel 파일 업로드 테스트
3. 데이터 확인 (Supabase 대시보드 > **Table Editor**)
4. AI 분석 기능 구현 시작
