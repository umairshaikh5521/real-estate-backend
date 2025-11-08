# Vercel Environment Variables Setup

## Critical: Set these in your Vercel Dashboard

### Backend Environment Variables

Go to your backend Vercel project → Settings → Environment Variables

```bash
# CRITICAL: Must be "production" for cookies to work
NODE_ENV=production

# Database (from Supabase)
DATABASE_URL=postgresql://postgres.nulddnfkwqdgckditijz:@uMAIR7867@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://nulddnfkwqdgckditijz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bGRkbmZrd3FkZ2NrZGl0aWp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ5MTQ0OSwiZXhwIjoyMDc4MDY3NDQ5fQ.WdU7tS2lOx_K3G0d-4bMCZM6SqRG_PDe880CS3_CYrE
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bGRkbmZrd3FkZ2NrZGl0aWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTE0NDksImV4cCI6MjA3ODA2NzQ0OX0.O17GDzlr4Srxn4EpYl2o91ORxTnct1SFCXq0znZNMRI

# Authentication
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x2qgYvDk7QxJ7_PfHgJ1pluA5RZfU4KqvDNsQ3ZOrOQ
AUTH_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x2qgYvDk7QxJ7_PfHgJ1pluA5RZfU4KqvDNsQ3ZOrOQ

# CORS - IMPORTANT: Add your frontend Vercel URL here
# Example: ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000

# Base URLs (use your actual Vercel URLs)
BASE_URL=https://your-backend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email (optional - for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=umairshaikh5521@gmail.com
SMTP_PASS=iixkkshewkofldoe
SMTP_FROM="Real Estate CRM <noreply@realestate.com>"
```

### Frontend Environment Variables

Go to your frontend Vercel project → Settings → Environment Variables

```bash
# API URL - IMPORTANT: Use your backend Vercel URL
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
```

## Deployment Steps

### 1. Deploy Backend First

```bash
cd backend
git add .
git commit -m "fix: Update cookie settings for production cross-domain"
vercel --prod
```

After deployment:
- Note the backend URL (e.g., `https://your-backend.vercel.app`)
- Update `ALLOWED_ORIGINS` to include your frontend URL

### 2. Deploy Frontend

```bash
cd frontend
# Update NEXT_PUBLIC_API_URL in Vercel dashboard first
vercel --prod
```

After deployment:
- Note the frontend URL
- Go back to backend settings and add this URL to `ALLOWED_ORIGINS`
- Redeploy backend if needed

### 3. Update CORS Settings

After you know both URLs:

**Backend Vercel Settings:**
```bash
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
FRONTEND_URL=https://your-frontend.vercel.app
```

Then trigger a redeploy.

## What Changed to Fix Cookie Issues

1. **Cookie sameSite Setting**: Changed from `'Lax'` to `'None'` in production
   - `'Lax'` blocks cross-domain cookies
   - `'None'` allows cross-domain with `secure: true`

2. **Secure Flag**: Always `true` in production (required for sameSite: 'None')

3. **CORS Configuration**: Must allow frontend domain in `ALLOWED_ORIGINS`

## Testing

1. Open your production frontend URL
2. Sign up / Login
3. Should redirect to dashboard automatically
4. Refresh page - should stay logged in (cookies persisted)
5. Try accessing `/leads` - should work without redirect to login

## Troubleshooting

### Still redirecting to login after successful login?

1. Check browser console for CORS errors
2. Verify `ALLOWED_ORIGINS` includes your frontend URL
3. Check that `NODE_ENV=production` is set in backend
4. Clear cookies and try again

### Cookies not being set?

1. Open DevTools → Application → Cookies
2. Check if cookies are present with `sameSite=None` and `secure=true`
3. If missing, backend `NODE_ENV` might not be `production`

### CORS errors?

1. Add your frontend URL to `ALLOWED_ORIGINS` in backend
2. Format: `https://your-frontend.vercel.app` (no trailing slash)
3. Redeploy backend after changes
