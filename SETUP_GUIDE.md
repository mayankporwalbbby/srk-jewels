# SRK Jewellers App — Setup Guide

Follow these steps ONCE. After that, the app runs forever at zero cost.

---

## Step 1: Create Supabase account (free database + storage)

1. Go to **supabase.com** and click "Start your project" (sign up free)
2. Click **"New project"**
   - Name: `srk-jewels`
   - Set a database password (save it somewhere)
   - Region: **South Asia (Singapore)**
3. Wait ~2 minutes for the project to be created

---

## Step 2: Set up the database

1. In your Supabase project, click **"SQL Editor"** in the left menu
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from this folder
4. Copy ALL its contents and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success" — your database tables are ready

---

## Step 3: Create a storage bucket for images

1. In Supabase, click **"Storage"** in the left menu
2. Click **"New bucket"**
   - Name: `jewellery-images`
   - Make it **Public**: YES (toggle on)
3. Click **"Create bucket"**

---

## Step 4: Create logins for you and your brother

1. In Supabase, click **"Authentication"** → **"Users"**
2. Click **"Add user"** → **"Create new user"**
   - Add your email + a password
   - Add your brother's email + a password
3. Both can now log into the app

---

## Step 5: Get your Supabase keys

1. In Supabase, click **"Project Settings"** (gear icon) → **"API"**
2. Copy two values:
   - **Project URL** (looks like: `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 6: Connect keys to the app

1. In this folder (`srk-jewels`), create a new file called `.env`
2. Paste this inside (replace with your actual values):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
```

---

## Step 7: Deploy to Vercel (free hosting)

1. Go to **vercel.com** and sign up free (use Google)
2. Click **"Add New Project"**
3. Choose **"Upload folder"** — drag and drop this `srk-jewels` folder
4. Before deploying, add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **"Deploy"**
6. Vercel gives you a link like `srk-jewels.vercel.app` — share with your brother!

---

## Done! How to use

- Open the Vercel link on any phone or laptop
- Log in with your email/password
- Both you and your brother see the same live data
- All images are stored in Supabase (1GB free)

## Costs

| Item | Cost |
|------|------|
| Supabase (database + storage) | Free up to 500MB data, 1GB images |
| Vercel (hosting) | Free forever for small apps |
| **Total** | **₹0/month** |
