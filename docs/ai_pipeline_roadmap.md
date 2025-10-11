# AI 파이프라인 개발 로드맵

## 1. PoC 단계 (~2025 Q4)
- **목표**: OCR→항목 파싱→평균 대비 편차→위험 탐지 정확도 검증
- **작업**:
  - 샘플 30건 수집 및 라벨링 완료
  - OCR·파싱 모델 비교(Tesseract vs Vision)
  - 위험 탐지 F1 ≥ 0.7 달성
- **책임자**: Data Scientist A, Labeling PM B

## 2. MVP 구축 (2026 Q1)
- **목표**: 프로덕션 환경에 파이프라인 배포, SLA Express 24h 내 분석
- **작업**:
  - S3→ETL→Model Serving 인프라 코드화(Terraform)
  - FastAPI inference 서비스 + Celery 워커 구성
  - MLOps(Mlflow) 기반 모델 버전 관리
  - 운영 대시보드에 AI 지표 연동
- **책임자**: ML Engineer C, DevOps D

## 3. 안정화 (2026 Q2~Q3)
- **목표**: 자동 재학습, 피드백 루프 완성
- **작업**:
  - 주간 재학습 파이프라인 구현(dbt/Airflow)
  - 전문가 피드백을 학습 데이터에 반영하는 레이블 업데이트 프로세스
  - 데이터 드리프트/성능 모니터링(Threshold 설정)
  - SLA 지연 시 AI 우선순위 조정 로직
- **책임자**: ML Engineer C, Data Ops E

## 4. 확장/고도화 (2026 Q4 이후)
- **목표**: 공간 유형/지역별 맞춤 모델, 개인화 추천
- **작업**:
  - 공간 유형(주거/상업) 별 세부 모델 분리
  - 지역별/공사 범위별 특화 피쳐 엔지니어링
  - LLM 기반 요약 자동화 고도화
  - 모델 성능 A/B 테스트, 지속적 개선
- **책임자**: Research Lead F, Data Scientist A

## 5. 모니터링 & 거버넌스
- **지표**: F1, Precision/Recall, 추정 비용 편차, SLA 내 처리율
- **경보**: 성능 하락(5%↓), SLA 위반 증가 시 운영자 알림
- **문서화**: 모델 카드 작성, 변경 로그/승인 절차, 위험 평가 문서
