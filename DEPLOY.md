# Deploying to Railway

The app runs as a single Node container. SQLite needs a persistent volume so the database survives restarts and redeploys.

## One-time setup (~10 minutes in the dashboard)

1. **Create the project**
   - Sign in to https://railway.app → **New Project** → **Deploy from GitHub repo**
   - Select `oipinc/oip-pub-quiz`
   - Railway detects the `Dockerfile` and starts the first build immediately. The first deploy will probably fail to start because env vars aren't set yet — that's fine.

2. **Add a persistent volume for SQLite**
   - In your service → **Settings** → **Volumes** → **+ New Volume**
   - Mount path: `/data`
   - Size: `1 GB` is plenty (the DB will be a few MB even with thousands of answers)
   - Save. Railway will redeploy.

3. **Set environment variables** (Settings → Variables)

   Generate strong secrets locally before pasting them:
   ```bash
   openssl rand -hex 24   # use as ADMIN_PASSWORD
   openssl rand -hex 32   # use as SESSION_SECRET
   ```

   | Variable | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables `secure` cookies + strict env-var checks |
   | `ADMIN_USERNAME` | `admin` (or your choice) | What you'll type at the login screen |
   | `ADMIN_PASSWORD` | strong random string | Required. **Don't use the dev fallback.** |
   | `SESSION_SECRET` | strong random string | Required. Rotating it logs everyone out. |
   | `SESSION_MAX_AGE_MS` | `43200000` | Optional. Default 12h. |
   | `DB_PATH` | `/data/quiz.db` | Matches the volume mount |
   | `QUESTION_TIME_SECONDS` | `30` | Optional, defaults to 30 |
   | `PUBLIC_URL` | (set after step 4) | Your Railway-issued URL |

4. **Generate the public domain**
   - Service → **Settings** → **Networking** → **Generate Domain**
   - Railway gives you something like `oip-pub-quiz-production-xxxx.up.railway.app`

5. **Set `PUBLIC_URL`**
   - Variables → set `PUBLIC_URL` to `https://oip-pub-quiz-production-xxxx.up.railway.app`
   - Save → Railway redeploys

6. **Verify**
   - Visit `https://<your-domain>/api/health` → `{"ok":true,...}`
   - Visit `https://<your-domain>/admin` → login screen
   - Sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   - Click **Show QR** — the QR encodes the Railway URL

## Day-to-day

- **Run an event:** open `/admin` on your laptop, sign in, create + activate a group, click **Show QR** so players scan with their phones, open `/display?sessionId=N` on the venue TV.
- **Subsequent deploys:** push to `main` and Railway rebuilds.

## Costs

Railway's $5/mo Hobby credit covers this app. Volume + container together typically cost $1–3/month at quiz-night traffic.

## Operational notes

- **Trust proxy** is enabled in Fastify → `req.ip` shows the real client IP behind Railway's edge.
- **HTTPS** is terminated by Railway; the cookie is set `secure: true` only when `NODE_ENV=production`.
- **SSE** works through Railway with no extra config; our 25 s heartbeat keeps the connection live.
- **Database backups:** the SQLite file lives on the volume. To download:
  ```bash
  railway run cat /data/quiz.db > local-backup.db
  ```
- **Resetting data:** delete + recreate the volume in the dashboard.

## Local development

Nothing here affects local dev:
```bash
cp .env.example .env       # edit values
npm run dev                # vite + fastify together
```
`PUBLIC_URL` is optional locally — the QR endpoint falls back to LAN-IP detection.
`ADMIN_PASSWORD` and `SESSION_SECRET` accept dev fallbacks when `NODE_ENV` is unset.
