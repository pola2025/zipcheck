# 도메인 연결 가이드 (가비아 → Vercel & Railway)

## 📋 도메인 구조

| 도메인 | 용도 | 배포 플랫폼 | 현재 URL |
|--------|------|------------|----------|
| `zcheck.co.kr` | 프론트엔드 메인 | Vercel | https://frontend-omega-ten-49.vercel.app |
| `www.zcheck.co.kr` | 프론트엔드 (리다이렉트) | Vercel | - |
| `api.zcheck.co.kr` | 백엔드 API | Railway | https://zipcheck-production.up.railway.app |

---

## 1️⃣ Vercel 프론트엔드 도메인 설정

### Step 1: Vercel 대시보드에서 도메인 추가

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택: `frontend`

2. **Settings → Domains로 이동**

3. **도메인 2개 추가**
   ```
   zcheck.co.kr
   www.zcheck.co.kr
   ```

4. **Vercel이 제공하는 DNS 레코드 확인**
   - Vercel이 자동으로 필요한 레코드를 표시합니다
   - 보통 다음과 같은 형태:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

## 2️⃣ Railway 백엔드 도메인 설정

### Step 1: Railway 대시보드에서 커스텀 도메인 추가

1. **Railway 대시보드 접속**
   - https://railway.app/dashboard
   - 프로젝트 선택: `zipcheck-production`

2. **Settings → Domains로 이동**

3. **커스텀 도메인 추가**
   ```
   api.zcheck.co.kr
   ```

4. **Railway가 제공하는 DNS 레코드 확인**
   - Railway가 CNAME 레코드를 제공합니다
   - 보통 다음과 같은 형태:
   ```
   Type: CNAME
   Name: api
   Value: zipcheck-production.up.railway.app
   ```

---

## 3️⃣ 가비아 DNS 설정

### Step 1: 가비아 관리 콘솔 접속

1. **가비아 접속**
   - https://www.gabia.com
   - My가비아 → 서비스 관리

2. **도메인 관리**
   - `zcheck.co.kr` 선택
   - DNS 정보 → DNS 설정

### Step 2: DNS 레코드 추가

**기존 레코드 모두 삭제 후 아래 레코드만 추가:**

#### 📌 프론트엔드 레코드 (Vercel)

| 타입 | 호스트 | 값/위치 | TTL |
|------|--------|---------|-----|
| A | @ | `76.76.21.21` | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |

> ⚠️ **중요**: Vercel이 제공하는 실제 IP와 CNAME을 확인하여 입력하세요!

#### 📌 백엔드 레코드 (Railway)

| 타입 | 호스트 | 값/위치 | TTL |
|------|--------|---------|-----|
| CNAME | api | `zipcheck-production.up.railway.app` | 3600 |

### Step 3: DNS 저장 및 전파 대기

- DNS 설정 저장
- 전파 시간: **최대 24~48시간** (보통 1~2시간)
- 전파 확인: https://www.whatsmydns.net

---

## 4️⃣ SSL/TLS 인증서 (자동)

- **Vercel**: 자동으로 Let's Encrypt SSL 인증서 발급
- **Railway**: 자동으로 Let's Encrypt SSL 인증서 발급

설정 완료 후 10~15분 내에 자동으로 HTTPS가 적용됩니다.

---

## 5️⃣ 환경 변수 업데이트

### Frontend (.env.production)

Vercel 대시보드에서 환경 변수 업데이트:

```bash
VITE_API_URL=https://api.zcheck.co.kr
```

### Backend (.env.production)

Railway 대시보드에서 환경 변수 업데이트:

```bash
FRONTEND_URL=https://zcheck.co.kr
CORS_ORIGIN=https://zcheck.co.kr,https://www.zcheck.co.kr
```

**재배포 필요**: 환경 변수 변경 후 각 서비스를 재배포하세요.

---

## 6️⃣ 도메인 연결 확인

### 테스트 체크리스트

- [ ] `https://zcheck.co.kr` 접속 확인
- [ ] `https://www.zcheck.co.kr` 접속 확인 (자동 리다이렉트)
- [ ] `https://api.zcheck.co.kr/health` API 응답 확인
- [ ] SSL 인증서 정상 작동 확인 (자물쇠 아이콘)
- [ ] 프론트엔드 → 백엔드 API 호출 정상 작동 확인

### 테스트 명령어

```bash
# 도메인 DNS 전파 확인
nslookup zcheck.co.kr
nslookup api.zcheck.co.kr

# API 엔드포인트 테스트
curl https://api.zcheck.co.kr/health

# SSL 인증서 확인
curl -I https://zcheck.co.kr
```

---

## 🔧 트러블슈팅

### 문제 1: DNS가 전파되지 않음

**증상**: 도메인 접속 시 "DNS_PROBE_FINISHED_NXDOMAIN" 오류

**해결**:
1. DNS 레코드 설정 재확인
2. 캐시 초기화: `ipconfig /flushdns` (Windows) / `sudo dscacheutil -flushcache` (Mac)
3. 24~48시간 대기

### 문제 2: Vercel에서 "Invalid Configuration" 오류

**증상**: Vercel 도메인 설정 화면에 빨간색 경고

**해결**:
1. 가비아 DNS 레코드가 Vercel이 요구하는 값과 정확히 일치하는지 확인
2. Vercel의 "Refresh" 버튼 클릭
3. DNS 전파 시간 대기

### 문제 3: SSL 인증서가 발급되지 않음

**증상**: 도메인 접속 시 "Your connection is not private" 경고

**해결**:
1. DNS 전파가 완료되었는지 확인
2. Vercel/Railway 대시보드에서 SSL 상태 확인
3. 10~15분 대기 후 재시도

### 문제 4: CORS 오류

**증상**: 브라우저 콘솔에 "blocked by CORS policy" 오류

**해결**:
1. Backend 환경 변수 확인:
   ```bash
   FRONTEND_URL=https://zcheck.co.kr
   CORS_ORIGIN=https://zcheck.co.kr,https://www.zcheck.co.kr
   ```
2. Railway에서 재배포
3. 브라우저 캐시 초기화

---

## 📝 체크리스트

### 배포 전

- [ ] 가비아에서 도메인 구입 완료
- [ ] Vercel 프로젝트 배포 완료
- [ ] Railway 프로젝트 배포 완료

### Vercel 설정

- [ ] Vercel에 `zcheck.co.kr` 도메인 추가
- [ ] Vercel에 `www.zcheck.co.kr` 도메인 추가
- [ ] Vercel이 제공하는 DNS 레코드 확인

### Railway 설정

- [ ] Railway에 `api.zcheck.co.kr` 도메인 추가
- [ ] Railway가 제공하는 CNAME 레코드 확인

### 가비아 DNS 설정

- [ ] A 레코드 추가: `@` → Vercel IP
- [ ] CNAME 레코드 추가: `www` → Vercel CNAME
- [ ] CNAME 레코드 추가: `api` → Railway CNAME
- [ ] DNS 설정 저장

### 환경 변수 업데이트

- [ ] Frontend `VITE_API_URL` 업데이트
- [ ] Backend `FRONTEND_URL` 업데이트
- [ ] Backend `CORS_ORIGIN` 업데이트
- [ ] Vercel 재배포
- [ ] Railway 재배포

### 최종 확인

- [ ] `https://zcheck.co.kr` 접속 확인
- [ ] `https://www.zcheck.co.kr` 접속 확인
- [ ] `https://api.zcheck.co.kr/health` 확인
- [ ] SSL 인증서 정상 작동 확인
- [ ] 프론트엔드 → 백엔드 API 통신 확인

---

## 🎯 다음 단계

도메인 연결 완료 후:

1. **SEO 최적화**
   - Google Search Console 등록
   - 네이버 웹마스터 도구 등록
   - sitemap.xml 생성

2. **모니터링 설정**
   - Vercel Analytics 활성화
   - Railway Monitoring 확인
   - Sentry 오류 추적 설정

3. **백업 설정**
   - 데이터베이스 자동 백업
   - 환경 변수 백업

---

## 📞 지원

문제가 발생하면:
1. Vercel 문서: https://vercel.com/docs/concepts/projects/domains
2. Railway 문서: https://docs.railway.app/deploy/deployments#custom-domains
3. 가비아 고객센터: 1544-4755

---

**마지막 업데이트**: 2025-10-13
