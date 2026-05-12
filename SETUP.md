# Garage ERP — Setup & Deployment Guide

## What you need (all free)
- Supabase account (supabase.com) — you have this
- GitHub account — you have this
- Vercel account (vercel.com) — you have this
- Node.js installed locally

---

## STEP 1 — Create your Supabase project (3 minutes)

1. Go to **app.supabase.com** → click **"New Project"**
2. Fill in:
   - **Name**: `garage-erp`
   - **Database Password**: make a strong password (save it)
   - **Region**: `Middle East (Bahrain)` — closest to Dubai
3. Click **"Create new project"** → wait ~2 minutes for it to spin up

---

## STEP 2 — Run the database schema (1 minute)

1. In your Supabase project → click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire content → paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`

---

## STEP 3 — Seed the sample data (1 minute)

1. In Supabase SQL Editor → click **"New query"** again
2. Open `supabase/seed.sql` from this project
3. Copy the entire content → paste → click **"Run"**
4. You should see: `Success. No rows returned`

You now have: 7 mechanics, 15 services, 20 parts, 10 customers, 8 jobs, 6 invoices.

---

## STEP 4 — Get your Supabase keys

1. In Supabase → **Settings** (gear icon, bottom left) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghij.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

---

## STEP 5 — Configure environment variables locally

1. In the `garage-erp` folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

---

## STEP 6 — Run locally to test (2 minutes)

```bash
cd garage-erp
npm install
npm run dev
```

Open http://localhost:5173 — you should see the login page.

**Test logins:**
- Select **Receptionist** → Enter Dashboard → see job list with live timers
- Select **Manager** → Enter Dashboard → see stats, timeline, breakdowns

---

## STEP 7 — Push to GitHub

```bash
cd garage-erp
git init
git add .
git commit -m "Initial commit: Garage ERP system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/garage-erp.git
git push -u origin main
```

(Create the repo on github.com first — click New Repository → name it `garage-erp` → don't initialize with README)

---

## STEP 8 — Deploy to Vercel (2 minutes)

1. Go to **vercel.com** → click **"Add New Project"**
2. Click **"Import Git Repository"** → select your `garage-erp` repo
3. In **"Environment Variables"**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **"Deploy"**
5. Wait ~1 minute → you get a live URL like `garage-erp-demo.vercel.app`

---

## You're live!

Share the URL with garage owners. Demo flow:

1. **Login as Receptionist**
2. **Create New Job** → fill in customer + vehicle + mechanic
3. Watch the **live timer** start on dashboard
4. Open job → **Add service** (Oil Change AED 120) → **Add parts** (Engine Oil AED 85, Oil Filter AED 35)
5. See **invoice preview** update live: Total AED 240
6. Click **"Complete & Generate Invoice"**
7. See mock SMS + Email confirmation → **Mark as Paid**
8. **Logout → Login as Manager**
9. See dashboard update in real-time: revenue, job count, mechanic performance

---

## Project structure

```
garage-erp/
├── src/
│   ├── context/AuthContext.jsx     — demo login (role dropdown)
│   ├── lib/supabase.js             — Supabase client
│   ├── lib/utils.js                — AED formatter, time helpers
│   ├── components/Layout.jsx       — sidebar + navigation
│   ├── pages/
│   │   ├── Login.jsx               — role selection login
│   │   ├── receptionist/
│   │   │   ├── Dashboard.jsx       — job list + live timers + stats
│   │   │   ├── NewJob.jsx          — create job form
│   │   │   ├── JobDetail.jsx       — services/parts + invoice + pay
│   │   │   └── InvoiceList.jsx     — all invoices
│   │   └── manager/
│   │       ├── Dashboard.jsx       — real-time stats dashboard
│   │       └── Jobs.jsx            — all jobs read-only
├── supabase/
│   ├── schema.sql                  — paste into Supabase SQL Editor
│   └── seed.sql                    — UAE sample data
├── vercel.json                     — SPA routing config
└── .env.example                    — env vars template
```
