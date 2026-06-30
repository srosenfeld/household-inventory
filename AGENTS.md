# Household Inventory — Agent Instructions

## Project overview

Monorepo for a household inventory app:

| Package | Path | Purpose |
|---------|------|---------|
| `@household-inventory/shared` | `packages/shared` | Shared types and schemas |
| `@household-inventory/api` | `services/api` | Fastify REST API (port 3001) |
| `@household-inventory/mobile` | `apps/mobile` | Expo / React Native app (iOS, Android, web) |

## Common commands

```bash
npm install              # Install all workspace dependencies
npm run build            # Build shared + API
npm run db:migrate       # Apply SQL migrations (requires Postgres)
npm run dev:api          # Start API with hot reload
npm run dev:mobile       # Start Expo dev server
npm run dev:web          # Start Expo web client
docker compose up -d     # Start Postgres (pgvector) on port 5432
```

## Cursor Cloud specific instructions

This repo includes `.cursor/environment.json` so it runs in **Cursor Cloud Agents** — including from the **Cursor mobile app** (iOS).

### Prerequisites (one-time, on cursor.com)

1. **Paid plan** with Cloud Agents (Pro, Pro+, Ultra, Teams, or Enterprise).
2. **GitHub connected** at [cursor.com/dashboard](https://cursor.com/dashboard).
3. **Secrets configured** at Dashboard → Cloud Agents → Secrets (see below).

### Required secrets

Add these in the Cursor dashboard. They are injected as environment variables in cloud agents:

| Secret | Used by |
|--------|---------|
| `DATABASE_URL` | API (defaults to local Postgres if unset) |
| `OPENAI_API_KEY` | AI vision, embeddings, scan features |
| `SUPABASE_URL` | API auth + mobile auth |
| `SUPABASE_ANON_KEY` | Mobile client |
| `SUPABASE_SERVICE_ROLE_KEY` | API (if needed) |
| `SUPABASE_JWT_SECRET` | API (legacy HS256 tokens) |
| `EXPO_PUBLIC_API_URL` | Mobile/web client (use `http://localhost:3001` in cloud) |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile/web client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile/web client |

Optional: `PORT`, `UPLOAD_DIR`, `API_BASE_URL` (see `.env.example`).

### What starts automatically

When a cloud agent boots, the environment:

1. Runs `npm install && npm run build`
2. Starts Docker and brings up Postgres via `docker compose up -d`
3. Runs database migrations
4. Launches the API (`npm run dev:api`) and Expo web (`npm run dev:web`) in background terminals

Health check: `curl http://localhost:3001/health` should return `{"status":"ok"}`.

### Running from the Cursor mobile app

1. Install [Cursor for iOS](https://apps.apple.com/app/cursor/id6767085653) (or use the PWA at [cursor.com/agents](https://cursor.com/agents) on Android).
2. Sign in with your Cursor account.
3. Select this repository (`household-inventory`) and a branch.
4. Choose **Cloud machine** as the worker.
5. Send a task — the agent will use the configured environment above.

The mobile app is a control surface for cloud agents (review diffs, direct work, merge PRs). It does not include a full IDE or terminal; agents run and test code in the cloud VM.

### Local development alternative

To run tool calls on your own machine from mobile, use **My Machines** or **Remote Control**:

```bash
curl https://cursor.com/install -fsS | bash
agent login
agent worker start --name "my-devbox" --worker-dir /path/to/household-inventory
```

Then pick that machine as the worker when starting an agent from the mobile app.

### Testing tips for agents

- API routes (except `/health` and `/uploads/*`) require a Supabase JWT in the `Authorization: Bearer` header.
- AI scan features need `OPENAI_API_KEY`; without it, vision/embeddings calls are skipped.
- For UI testing in cloud, prefer `npm run dev:web` (Expo web) over native simulators.
- Migrations are in `services/api/migrations/` and are idempotent on re-run only if tables don't already exist — use a fresh DB or check state before re-applying.
