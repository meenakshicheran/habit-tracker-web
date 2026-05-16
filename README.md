# HabitFlow

A habit tracking app built with Next.js 16, Prisma, and SQLite.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new)

---

## Features

- Daily habit tracking with streaks and XP
- Analytics with completion heatmaps and charts
- AI-powered daily insights (Anthropic)
- Browser notifications with per-habit reminders
- Data export (JSON + CSV) and import
- Onboarding wizard with habit packs
- Google OAuth (optional)

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm

### Steps

```bash
# 1. Clone and install
git clone <your-repo-url>
cd habit-tracker-web
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET at minimum

# 3. Run migrations
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./dev.db` (local) or `file:/data/habitflow.db` (Railway) |
| `NEXTAUTH_SECRET` | Yes | Random secret — run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full app URL, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | No | Set `"true"` to show Google login button |
| `ANTHROPIC_API_KEY` | No | Enables AI daily insights feature |

---

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. Add a **Volume** mounted at `/data`.
4. Set all required environment variables (see table above).
   - `DATABASE_URL` = `file:/data/habitflow.db`
   - `NEXTAUTH_URL` = your Railway app URL (set after first deploy)
5. Railway builds the Dockerfile automatically. `prisma migrate deploy` runs on each startup.

> **Note:** SQLite is stored on the Railway Volume. Data persists across deploys as long as the volume is attached.
