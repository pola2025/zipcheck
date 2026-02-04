# ZipCheck Operations Runbook

## 1. Environment Verification
- **Cloudflare Workers (Backend API)**
  - Confirm `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `JWT_SECRET`, `NOTION_DATABASE_ID`, `NOTION_CUSTOMER_REQUEST_DB_ID`, Naver OAuth keys, and OpenAI/Google/Claude API keys.
  - If Slack alerts are required, set `ENABLE_SLACK_NOTIFICATIONS=true` and provide webhook URLs. Leave the flag `false` to disable Slack entirely.
  - Use Cloudflare dashboard or `wrangler secret list` to review current values before a deploy. Refer to `backend/.env.example` for the authoritative variable list.
- **Vercel (Frontend)**
  - Ensure `VITE_API_URL` is set for Production/Preview/Development.
  - Trigger redeploy only after backend domain or environment variables change.

## 2. Secret Hygiene
- Regenerate credentials immediately if any key is exposed.
- Run `rg "(sk-|eyJ|AIza)"` from the repository root to verify no secrets are committed.
- For historical cleanup use `git filter-repo` as documented in the security cleanup checklist.

## 3. Build & Test Checklist
- Backend: `cd backend && npm install && npm run build`
  (compiles TypeScript; fails fast if imports or typings break.)
- Frontend: `cd frontend && npm install && npm run build`
  Confirms Tailwind classes and bundle chunking stay valid. Track the 3.5 MB `CodeEditor` chunk for future lazy-loading.
- Optional: `npx update-browserslist-db@latest` if build warns about outdated targets (automate weekly in CI).

## 4. Deployment Path
- Frontend: `cd frontend && npm run deploy` (wraps `vercel --prod --yes`) or trigger from Vercel dashboard.
- Backend: `wrangler deploy` or deploy via Cloudflare dashboard.
- Monitor GitHub Actions `deploy-production` workflow for automatic Vercel builds on `master`.

## 5. Post-Deploy Health Check
- **API**: `curl https://zipcheck-api.zipcheck2025.workers.dev/health` should return `{"status":"ok",...}`.
- **Cron Jobs**: inspect Cloudflare Workers logs (`wrangler tail`) for `Daily statistics cron job started`.
- **Slack (optional)**: if Slack alerts are enabled, run `npx tsx src/scripts/check-env.ts` to confirm masked webhook output.
- **Frontend Smoke Test**: load Vercel URL, login flow, and primary API interactions.

## 6. Incident Response
- Capture logs (`wrangler tail`) and forward to Slack only if notifications are enabled.
- Toggle `selectedPlan` flows manually to ensure payment navigation works.
- Document remediation steps in Notion (customer and dev log databases) with updated IDs from `.env`.

Keep this runbook with releases so the operations checklist remains consistent across the team.
