# GoSellr

Monorepo: marketplace (`frontend/`), admin CMS (`admin/`), NestJS API (`backend/`).

## Quick start

```bash
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

Configure API URL via `frontend/.env.local` → `NEXT_PUBLIC_API_URL` (see `frontend/src/services/http/client.ts`).

