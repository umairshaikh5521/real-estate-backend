# Vercel Deployment Fix

## What Changed

The backend structure has been updated to properly work with Vercel serverless functions.

### New Structure

```
backend/
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── src/
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   └── index.ts          # Local development server
├── vercel.json           # Updated Vercel config
└── package.json
```

## Key Changes

1. **Created `api/index.ts`** - This is the entry point for Vercel serverless functions
2. **Updated `vercel.json`** - Simplified to use rewrites instead of builds
3. **Updated `tsconfig.json`** - Includes both `src/` and `api/` directories

## How It Works

- **Local Development:** Uses `src/index.ts` with `npm run dev`
- **Vercel Production:** Uses `api/index.ts` as serverless function

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### Step 2: Configure Vercel Project

In your Vercel project settings:

1. **Root Directory:** Leave as `./` or set to `backend` if monorepo
2. **Build Command:** Leave empty (no build needed for Vercel functions)
3. **Output Directory:** Leave empty
4. **Install Command:** `npm install`

### Step 3: Add Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=your-supabase-connection-string
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
NODE_ENV=production
```

### Step 4: Deploy

Click "Deploy" or push to your main branch for automatic deployment.

## Testing After Deployment

Once deployed (e.g., `https://your-backend.vercel.app`):

```bash
# Test root
curl https://your-backend.vercel.app/api

# Test health check
curl https://your-backend.vercel.app/api/health

# Test with auth (requires valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.vercel.app/api/leads
```

## Local Development

Nothing changes for local development:

```bash
npm run dev
```

Server runs at `http://localhost:8000`

## Troubleshooting

### Issue: "Cannot find module"
**Solution:** The new `api/index.ts` structure should fix this

### Issue: Routes not working
**Solution:** Check that all routes are prefixed with `/api` in your frontend

### Issue: CORS errors
**Solution:** Add your frontend domain to `ALLOWED_ORIGINS` environment variable

### Issue: Database connection fails
**Solution:** Verify `DATABASE_URL` is set correctly in Vercel environment variables

## Frontend API Configuration

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

## Important Notes

1. All API routes are now under `/api` prefix
2. The `/api` prefix is handled by Vercel rewrites
3. Environment variables must be set in Vercel dashboard
4. Local development continues to work the same way

## Redeploy

After these changes, redeploy your backend to Vercel. The module not found errors should be resolved.
