# Todo Focus - Project Setup

## Cloudflare Setup

### 1. Get Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template "Edit Cloudflare Workers" or create custom with:
   - **Permissions**: Workers:Edit, D1:Edit, KV:Edit
   - **Account Resources**: Include your account
   - **Zone Resources**: None
4. Copy the generated token

### 2. Get Cloudflare Account ID

1. Go to https://dash.cloudflare.com
2. Your account ID is in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
3. Or go to Overview → Account ID

### 3. Add Secrets to GitHub Repo

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: (paste your API token)
4. Repeat for:
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: (paste your account ID)

### 4. Enable GitHub Actions

1. Go to Actions tab in your GitHub repo
2. Workflows will run automatically on push to main

---

## Passkey Setup

Passkeys require HTTPS. Workers.dev provides HTTPS automatically.

For custom domain:
1. Add a CNAME record in Cloudflare DNS pointing to your workers.dev subdomain
2. Enable "Always Use HTTPS" in Cloudflare SSL/TLS settings

---

## Deployment Commands (Manual)

```bash
# Backend
cd backend
bun install
bunx wrangler deploy

# Frontend
cd frontend
bun install
bun run build
# Deploy to Cloudflare Pages manually or via GitHub Actions
```

---

## Environment Variables

- **Backend**: Already configured in `wrangler.toml`
- **Frontend**: `VITE_API_URL` (optional, defaults to workers.dev URL)

---

## Tech Stack

- Frontend: React + Vite + shadcn/ui
- Backend: Cloudflare Workers + Hono + better-auth
- Database: D1 (SQLite)
- Storage: KV (API keys)