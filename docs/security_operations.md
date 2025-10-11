# 보안 · 기술 운영 체계

## 1. 계정/인증 정책
- SSO 또는 이메일+비밀번호+OTP 2단계 인증
- 비밀번호 최소 8자, 90일 주기 변경, 재사용 금지
- 관리자/전문가 계정은 IP 제한 + 하드웨어 토큰 권장

## 2. 접근 제어
- RBAC(Role-Based Access Control) 적용: 고객/전문가/운영/관리자/시스템 계정 분리
- 생산 DB 직접 접근 금지, Bastion + 읽기 전용 계정
- AWS IAM 최소 권한 정책, Access Key 주기적 로테이션

## 3. 데이터 보호
- 저장 데이터(KMS), 전송 데이터(TLS 1.2 이상) 암호화
- S3 버킷 버전관리 + MFA Delete, 민감 데이터 마스킹
- 로그/리포트는 별도 암호화 저장소에 보관

## 4. 백업 및 DR
- DB/S3 일일 백업, 30일 보관, 월 1회 복구 테스트
- 장애 시 RTO 4시간, RPO 1시간 목표
- DR Runbook: 주요 서비스 복구 순서, 연락망, 책임자

## 5. 모니터링/로깅
- 애플리케이션 로그: CloudWatch/ELK 스택, SLA 관련 경보
- 보안 로그: GuardDuty, CloudTrail, `audit_logs` 저장 및 1년 보관
- 인시던트 대응: PagerDuty/Slack 연동, 대응표준 30분 이내

## 6. 배포/변경 관리
- GitHub Actions → Staging → Production (승인 절차)
- IaC(Terraform)로 인프라 관리, 변경시 리뷰 필수
- 보안 패치 주간 점검, 취약점 스캔(분기별)

## 7. 정책 문서화/교육
- 연 1회 보안 교육, 신규 입사자 온보딩 교육 포함
- 정책 문서는 `docs/security_operations.md` 유지, 변경 시 전사 공지
- 침해사고 대응 훈련(연 1회) 및 보고서 작성
