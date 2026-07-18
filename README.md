# Research-OS

AI-native research operating system — generates a curated reading curriculum for any research topic (via arXiv + Semantic Scholar), lays it out as a knowledge graph, and critiques it for coverage gaps and outdated claims.

## Layout

```
frontend/   Next.js UI — see frontend/README.md
backend/    Next.js API — curriculum + critique agent endpoints
```

## Running locally

Backend (port 4029):

```bash
cd backend
npm install
npm run dev
```

Frontend (port 4028):

```bash
cd frontend
npm install
npm run dev
```

The frontend calls `/api/curriculum` and `/api/critique` as relative paths; in development and production it proxies those to the backend via the rewrite in `frontend/next.config.mjs`, controlled by the `BACKEND_URL` environment variable (defaults to `http://localhost:4029`).

## Deploying

Deploy `frontend/` and `backend/` as two separate services (e.g. two Vercel projects). Set `BACKEND_URL` on the frontend deployment to the backend's deployed URL, and `FRONTEND_URL` on the backend deployment to the frontend's deployed URL (used for CORS).
