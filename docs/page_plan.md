# ������ ��ȹ (��ý ����Ʈ����)

## 1. ������ ��� �� �����
| ��� | ���� | ���� |
| --- | --- | --- |
| `/` | ���� ������ | ��ý ���� �Ұ�, CTA ���� |
| `/quote-request` | ���� �м� �Ƿ� | ���/SLA �ȳ� + ���ε�/���� �� |
| `/dashboard` (����) | �� ��� Ȯ�� (�ļ�) | �м� ���/�����丮 ���� |

## 2. ������ ���� ���
### 2.1 `/` ����
- Hero �� ProblemSolution �� FeatureGrid �� Testimonials �� PricingFAQ �� CTA/Footer

### 2.2 `/quote-request`
- Hero(ª��) �� ��� ��� �� ���ε� ���μ��� �ȳ� �� ContactForm �� FAQ

### 2.3 `/dashboard` (MVP ����)
- �ֱ� ����Ʈ ī�� �� ���� ���� �� �� ��� (PDF �ٿ�ε�)

## 3. �׺���̼� �帧
- ���: �ΰ� + �޴�(`���� �Ұ�`, `�Ƿ��ϱ�`, `�α���`)
- CTA ��ư(`/quote-request`�� �̵�)
- Ǫ��: ȸ�� ����, ����, ��������/��� ��ũ

## 4. ������ ����
- ������ Pricing/FAQ ������ �� `apps/web/data/marketing.ts`
- quote-request �� ���� �� API (POST `/api/quote-request`), SLA �� �޽���
- dashboard �� ���� �� ���, `GET /api/reports`

## 5. ���� Ȯ��
- `/case-studies`: ���� ���, ��α� ����
- `/partners`: ���޻� �Ұ�/����

