
## 데이터 웨어하우스 PoC 절차

1. **데이터 소스 정의**
   - pp_events: 사용자 행동 로그 (업로드, 결제, 리포트 열람 등)
   - payments: 결제/환불 웹훅 기록
   - sla_events: SLA 상태 변경 이벤트
   - i_results: 분석 결과 JSON (S3)

2. **스토리지 구성**
   - S3 버킷 zipcheck-datalake 생성 (원본/정제/아카이브 폴더)
   - Redshift Serverless 또는 Snowflake 워크스페이스 생성

3. **ETL/ELT 파이프라인 (Python + dbt 예시)**
`ash
python -m venv venv
source venv/bin/activate
pip install boto3 pandas sqlalchemy dbt-redshift

dbt run-operation stage_external_sources
dbt run --models staging core marts
`

4. **스케줄링**
   - Hourly Airflow DAG: Raw → Staging → Core, SLA는 실시간 스트리밍(Kinesis Firehose)

5. **보안 및 거버넌스**
   - IAM 최소 권한, KMS 암호화, VPC Endpoint
   - dbt docs + 데이터 품질 테스트(dbt test), 지표 정의서 버전 관리

6. **BI 연동**
   - Looker/Tableau 커넥션, Row Level Security 적용
   - 대시보드: SLA 모니터링, 전환 퍼널, 저가 경고 현황
