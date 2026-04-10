# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Layout

This directory (`kyrooapp/`) is the Claude Code workspace. The actual source code lives one level up at `../kyroo/`. Key sibling projects: `../coachtap/`, `../kraudcheck/`.

```
ct/
├── kyrooapp/      ← Claude Code workspace (you are here)
├── kyroo/         ← KYROO source code
├── coachtap/      ← Separate app sharing the same server
└── kraudcheck/    ← Separate project
```

## KYROO Source Structure

```
kyroo/
├── backend/       # Express.js REST API + WebSocket (server.js ~2200 lines)
├── frontend/      # Vanilla HTML/JS/CSS web app
├── mobile/        # React Native (Expo) for iOS/Android/Web
└── db/            # SQL migrations and seed scripts
```

## Development Commands

### Backend (Express API)
```bash
cd ../kyroo/backend
npm run dev          # node --watch server.js  (auto-reload)
npm start            # node server.js  (production-like)
npm run seed         # seed test users
```

### Mobile (React Native / Expo)
```bash
cd ../kyroo/mobile
npx expo start       # interactive — press a (Android), i (iOS), w (Web)
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Database (Docker)
```bash
cd ../kyroo
export DB_PORT=15433
docker compose up -d --wait      # start PostgreSQL container
docker compose down              # stop
docker exec -it kyroo-db psql -U kyroo -d kyroo   # psql shell
```

### Run smoke tests
```bash
cd ../kyroo
bash smoke-test.sh
```

## Architecture

**KYROO** is a fitness/training platform with three UIs sharing one backend:

- **Backend** (`backend/server.js`): Single-file Express app. All routes, DB queries (raw `pg`), JWT auth, Stripe webhooks, WebSocket, and Claude AI article generation live here. No ORM.
- **Frontend** (`frontend/`): Vanilla HTML/JS. `index.html` = main app, `admin.html` = admin dashboard, `script.js` handles all client-side logic.
- **Mobile** (`mobile/`): Expo + TypeScript. File-based routing via `expo-router`. Path alias `@/*` → `src/*`. Auth state via `src/context/AuthContext`. API calls via `src/lib/api.ts`. WebSocket training updates via `src/hooks/useTrainingWS.ts`.

**Key integrations:**
- **Auth**: JWT tokens, bcrypt passwords, email verification, password reset via nodemailer
- **Payments**: Stripe (subscriptions + customer portal). Free users get 5 plans/month; premium = unlimited.
- **AI**: `@anthropic-ai/sdk` — Claude generates premium training articles
- **Real-time**: WebSocket (`ws`) for live training progress

**Database**: PostgreSQL 16 in Docker container `kyroo-db` on port `15433`. Schema initialized from `db/init.sql`; additional tables/columns applied via `db/migrate.sql` and inline DDL in DEPLOYMENT.md.

## Environment

Backend requires `backend/.env` (copy from `.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | App port — `3001` |
| `DB_*` | PostgreSQL connection — host `127.0.0.1`, port `15433` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Claude API (AI article generation) |
| `SMTP_*` | Gmail SMTP (use App Password, not account password) |
| `BASE_URL` | Public URL used in email links |

## Production Deployment

- **Server**: Strato Dedicated — `93.90.201.90`, user `deploy`
- **SSH key**: `~/.ssh/coachtap_strato`
- **Process manager**: PM2, process name `kyroo`
- **Port allocation**: CoachTap on 3000/5499, KYROO on 3001/15433 — do not conflict
- **Quick redeploy**:
  ```bash
  git push origin main
  ssh -i ~/.ssh/coachtap_strato root@93.90.201.90 \
    "su - deploy -c 'cd ~/kyroo && git pull && cd backend && npm install --production && pm2 restart kyroo'"
  ```

See `DEPLOYMENT.md` for first-time setup, DB backup/restore, Nginx config, and SSL.
