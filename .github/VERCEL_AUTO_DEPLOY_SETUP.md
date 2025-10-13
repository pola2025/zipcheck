# Vercel 자동 배포 설정 가이드

master 브랜치에 push할 때 자동으로 Vercel Production에 배포되도록 설정하는 방법입니다.

## 1. Vercel Token 발급

1. https://vercel.com/account/tokens 접속
2. **Create Token** 클릭
3. Token 이름 입력 (예: "GitHub Actions")
4. Scope: **Full Account** 선택
5. Expiration: **No Expiration** 또는 원하는 기간 선택
6. **Create** 클릭
7. 생성된 토큰 복사 (한 번만 표시됩니다!)

## 2. GitHub Secrets 설정

1. GitHub 저장소 페이지 접속: https://github.com/pola2025/zipcheck
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭
5. Secret 추가:
   - **Name**: `VERCEL_TOKEN`
   - **Value**: 1단계에서 복사한 Vercel Token
6. **Add secret** 클릭

## 3. 설정 완료 확인

이제 master 브랜치에 push하면:

1. GitHub Actions가 자동으로 실행됩니다
2. Vercel에 Production으로 배포됩니다
3. 배포 상태는 GitHub 저장소의 **Actions** 탭에서 확인 가능합니다

### 배포 확인 방법

```bash
# 로컬에서 변경 후
git add .
git commit -m "your changes"
git push

# GitHub Actions에서 배포 진행
# Actions 탭에서 "Deploy to Vercel Production" 워크플로우 확인
```

## 4. 배포 트리거 조건

다음 경우에만 자동 배포가 실행됩니다:
- master 브랜치에 push
- frontend/ 디렉토리에 변경사항이 있을 때
- .github/workflows/deploy-production.yml 파일이 변경될 때

**백엔드 변경은 자동 배포하지 않습니다.** (Railway가 자동으로 배포합니다)

## 트러블슈팅

### 문제: GitHub Actions에서 "VERCEL_TOKEN not found" 에러

**해결책:** GitHub Secrets에 `VERCEL_TOKEN`이 올바르게 설정되었는지 확인하세요.

### 문제: 배포는 성공했는데 변경사항이 반영되지 않음

**해결책:**
1. 브라우저 캐시 삭제 (Ctrl + Shift + R)
2. Vercel 대시보드에서 최신 배포 확인
3. `npx vercel ls`로 배포 목록 확인

### 문제: 빌드 실패

**해결책:**
1. 로컬에서 `npm run build` 실행하여 빌드 에러 확인
2. GitHub Actions 로그에서 에러 메시지 확인
3. 에러 수정 후 다시 push

## 수동 배포

자동 배포가 실패하거나 긴급 배포가 필요한 경우:

```bash
cd frontend
npx vercel --prod --yes
```

---

**설정 일자:** 2025-10-13
**마지막 업데이트:** 2025-10-13
