# Revolys Field Log — Deployment Guide

## 1. Set up the database (Supabase, free)
1. Go to supabase.com → sign up → **New project**.
2. Once it's ready, open **SQL Editor → New query**.
3. Paste the entire contents of `supabase-schema.sql` and click **Run**.
   This creates the `calls`, `interns`, and `admin_settings` tables, and
   sets your default admin login to **Superadmin / Revolys@1108**.
4. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public key** — you'll need both in step 3 below.

## 2. Get the code onto GitHub (recommended)
1. Create a new empty GitHub repo.
2. Push this folder's contents to it (or drag-and-drop upload via
   GitHub's web UI if you're not comfortable with git commands).

## 3. Deploy to Netlify
1. Go to netlify.com → **Add new site → Import an existing project**.
2. Connect your GitHub repo.
3. Build settings (Netlify usually detects these automatically):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Before deploying, add environment variables under
   **Site settings → Environment variables**:
   - `VITE_SUPABASE_URL` = (your Project URL from step 1)
   - `VITE_SUPABASE_ANON_KEY` = (your anon key from step 1)
5. Click **Deploy site**.

## 4. Connect your domain
1. In Netlify: **Site settings → Domain management → Add a domain**.
2. Enter your domain and follow Netlify's DNS instructions — usually
   either point your domain's nameservers to Netlify, or add the
   CNAME/A record it gives you at your domain registrar.
3. Netlify issues a free HTTPS certificate automatically once DNS
   propagates (can take a few minutes to a few hours).

## Using it day to day
- Share the live URL with your intern. They click **Intern**, pick
  their name, enter their PIN.
- You click **Admin**, log in with Superadmin / Revolys@1108 (change
  this any time by editing the `admin_settings` row in Supabase's
  Table Editor).
- Add new interns from the dashboard's **Manage interns** panel —
  no redeploy needed, it writes straight to the database.

## Note on security
Access is controlled by app-level username/PIN checks, not
database-level auth — fine for a small trusted team, but anyone with
the anon key (visible in the deployed site's JS bundle) could in
principle query the tables directly. If this ever needs to hold
sensitive data, we should switch to Supabase Auth with row-level
security tied to real user accounts.
