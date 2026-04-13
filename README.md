# Pub Quiz App

Mobile-first web app for running in-person pub quizzes across multiple sessions (groups) per event. Players scan a QR code on their phones, register, and play a timed multiple-choice quiz at their own pace. A shared big-screen view shows the live group leaderboard.

See the implementation plan in the owning workspace's plan file for design rationale.

## Quick start

```bash
npm install
cp .env.example .env        # set ADMIN_KEY
npm run dev                 # runs server (3000) + Vite client (5173) together
```

Production:
```bash
npm run build
npm start                   # serves built client from the Fastify server on PORT
```

## URLs

- Player:    `http://<host>:<port>/`
- Admin:     `http://<host>:<port>/admin?key=<ADMIN_KEY>`
- Display:   `http://<host>:<port>/display`

## QR code

```bash
npm run qr                  # prints an ANSI QR for the LAN URL
```
