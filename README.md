# Daily

A mobile-first daily todo PWA. Today list + Done history, swipe to reschedule, auto roll-forward of incomplete tasks. Built on Next.js 15 + Supabase.

## What it does

- **Today** — your active list. Tap the circle to complete. Swipe right to push to tomorrow. Swipe left to delete. Tap the task text to pick a custom date.
- **Done** — every completed task, grouped by the day you finished it. Tap the checkmark to restore.
- **Auto roll-forward** — anything you didn't finish yesterday (or earlier) automatically becomes a Today task when you open the app.
- **Magic-link login** — no passwords. Tap the link in your email and you're in.
- **Installable** — add to home screen on iPhone / Android and it acts like a native app.

## Setup (10 minutes)

### 1. Create the Supabase project

1. Go to <https://supabase.com> and create a new project.
2. Open the SQL editor and paste the contents of `supabase/schema.sql`. Run it.
3. In **Authentication → Providers**, make sure **Email** is enabled (it is by default). Magic links work out of the box.
4. In **Authentication → URL Configuration**, set your Site URL (for dev: `http://localhost:3000`, for prod: your Vercel URL) and add both as **Redirect URLs**.
5. Copy your `Project URL` and `anon public` key from **Settings → API**.

### 2. Set env vars

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with your email, check inbox, tap link.

### 4. Deploy to Vercel

```bash
npx vercel
```

Then in the Vercel project settings, add the same three env vars (set `NEXT_PUBLIC_SITE_URL` to your `*.vercel.app` URL). Also add that URL to Supabase's allowed Site/Redirect URLs.

## Install to iPhone home screen

Open the deployed URL in Safari → Share → Add to Home Screen. Now it lives next to your other apps and runs full-screen.

## Roadmap ideas (v2)

- Streaks / "X done today" badge
- Color tags (work / personal / errands)
- Search in Done
- Undo toast after completing a task
- Quick-reschedule presets ("This weekend", "Next week")
- Push notifications for tomorrow's list

## Project layout

```
src/
  app/
    page.tsx          # Today
    done/page.tsx     # Done history
    login/page.tsx    # Magic-link form
    auth/callback/    # OAuth code exchange
    actions.ts        # Server actions: add, complete, reschedule, etc.
  components/
    TaskRow.tsx       # Swipe + check + date picker
    AddTaskBar.tsx    # Floating + button → inline composer
    BottomNav.tsx     # Today / Done tabs
  lib/
    supabase/         # SSR + browser clients
    date.ts           # Local-date helpers
    types.ts          # Task type
supabase/schema.sql   # Run once in the Supabase SQL editor
```
