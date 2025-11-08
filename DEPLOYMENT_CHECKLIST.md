# Vercel Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Supabase project created
- [ ] Database connection string obtained
- [ ] API keys copied (URL, anon key, service key)
- [ ] Database schema pushed: `npm run db:push`

### 2. Environment Variables Ready
Prepare these values for Vercel:

```
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[db]
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
SUPABASE_ANON_KEY=[your-anon-public-key]
JWT_SECRET=[generate-with: openssl rand -base64 32]
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=production
```

### 3. Code Ready
- [ ] All changes committed to git
- [ ] Repository pushed to GitHub
- [ ] `.env` file is in `.gitignore` (never commit secrets!)

## 🚀 Deployment Steps

### Option A: Via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Select "backend" as root directory (if monorepo)

2. **Configure Build Settings**
   - Framework Preset: **Other**
   - Build Command: *Leave empty*
   - Output Directory: *Leave empty*
   - Install Command: `npm install`
   - Root Directory: `backend` (if monorepo) or `./`

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from step 2 above
   - Apply to: **Production, Preview, Development**
   - ⚠️ **CRITICAL:** Never expose `SUPABASE_SERVICE_KEY` publicly

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Note your deployment URL

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from backend directory
cd backend
vercel

# Follow prompts, then for production:
vercel --prod
```

## 🧪 Post-Deployment Testing

### 1. Test API Health
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-08T...",
    "environment": "production"
  }
}
```

### 2. Test Root Endpoint
```bash
curl https://your-backend.vercel.app/api
```

Should return API information and available endpoints.

### 3. Test Protected Endpoint (requires auth)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.vercel.app/api/leads
```

### 4. Check Vercel Function Logs
- Go to your Vercel project
- Click "Functions" tab
- Check for any errors

## 🔧 Common Issues & Solutions

### ❌ "Cannot find module" Error
**Cause:** Old Vercel configuration  
**Solution:** 
- Verify `api/index.ts` exists
- Check `vercel.json` has rewrites configuration
- Redeploy

### ❌ "DATABASE_URL is not set"
**Cause:** Environment variables not configured  
**Solution:**
- Go to Vercel project settings → Environment Variables
- Add `DATABASE_URL` and all other required variables
- Redeploy

### ❌ CORS Errors
**Cause:** Frontend domain not in ALLOWED_ORIGINS  
**Solution:**
- Update `ALLOWED_ORIGINS` to include your frontend URL
- Format: `https://frontend.vercel.app,http://localhost:3000`
- Redeploy

### ❌ "Internal Server Error" (500)
**Cause:** Various - check logs  
**Solution:**
- Check Vercel function logs
- Verify all environment variables are set
- Check database connection is working
- Verify Supabase project is active

### ❌ Function Timeout
**Cause:** Database query taking too long  
**Solution:**
- Optimize queries
- Add database indexes
- Consider upgrading Vercel plan

## 📋 Frontend Integration

After backend deployment, update your frontend:

### 1. Update Frontend Environment Variables

Create/update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

### 2. Update CORS Origins

Add your frontend URL to backend environment variables:

```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

### 3. Test Integration

```bash
cd frontend
npm run dev
```

Try accessing a protected page that calls the API.

## 🔄 Automatic Deployments

Once connected to GitHub:

- **Push to main** → Auto-deploy to production
- **Push to other branches** → Auto-create preview deployment
- **Pull requests** → Auto-create preview deployment with unique URL

## 📊 Monitoring

### Vercel Dashboard
- View deployment history
- Check function execution logs
- Monitor bandwidth usage
- View error rates

### Recommended External Monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **DataDog** - APM and logging
- **Better Stack** - Log management

## 🔒 Security Checklist

- [ ] All environment variables set in Vercel (not in code)
- [ ] `SUPABASE_SERVICE_KEY` never exposed to frontend
- [ ] JWT_SECRET is strong and unique
- [ ] CORS configured with specific origins (not `*`)
- [ ] Supabase RLS policies enabled
- [ ] Database credentials not in git history
- [ ] Rate limiting implemented (TODO)

## 📈 Performance Tips

1. **Connection Pooling** - Already configured in `src/db/index.ts`
2. **Database Indexes** - Add for frequently queried fields
3. **Caching** - Consider Redis for hot data
4. **Query Optimization** - Use Drizzle Studio to analyze queries
5. **Edge Functions** - Consider for low-latency endpoints

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Health check returns 200 OK
- ✅ Root endpoint returns API information
- ✅ Protected endpoints work with valid auth token
- ✅ Database queries execute successfully
- ✅ No errors in Vercel function logs
- ✅ Frontend can communicate with backend
- ✅ CORS is working correctly

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Hono.js Docs](https://hono.dev)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Supabase Docs](https://supabase.com/docs)

## 🎉 Next Steps

After successful deployment:

1. Deploy frontend to Vercel
2. Set up custom domain
3. Configure monitoring and alerts
4. Implement rate limiting
5. Add API documentation (Swagger/OpenAPI)
6. Set up automated testing in CI/CD
7. Configure staging environment

---

**Last Updated:** 2025-11-08  
**Version:** 1.0.0
