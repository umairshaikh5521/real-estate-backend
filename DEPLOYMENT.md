# Deployment Guide - Vercel

This guide will help you deploy the Real Estate CRM/ERP backend API to Vercel.

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [GitHub Account](https://github.com/join) (recommended for automatic deployments)
3. [Supabase Project](https://supabase.com) with database setup

## Step 1: Prepare Your Supabase Database

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and wait for setup to complete

### 1.2 Get Database Credentials

1. Go to Project Settings → Database
2. Copy the connection string under "Connection string" → "URI"
3. Go to Project Settings → API
4. Copy the following:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_KEY)

### 1.3 Push Database Schema

From your local backend directory:

```bash
# Install dependencies
npm install

# Set up your .env file with Supabase credentials
# DATABASE_URL=your-connection-string

# Push schema to Supabase
npm run db:push
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended for Quick Testing)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to backend directory
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? real-estate-backend (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# For production deployment
vercel --prod
```

### Option B: Deploy via Vercel Dashboard (Recommended for CI/CD)

#### 1. Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend setup"

# Add remote (replace with your repo)
git remote add origin https://github.com/yourusername/real-estate-backend.git

# Push
git push -u origin main
```

#### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `backend` (if monorepo) or `./` (if separate repo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secure-random-secret-here
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000
NODE_ENV=production
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- Never commit these values to git
- Generate a secure JWT_SECRET (use: `openssl rand -base64 32`)

#### 4. Deploy

Click "Deploy" and wait for deployment to complete.

## Step 3: Verify Deployment

### Test Your API

Once deployed, Vercel will provide a URL (e.g., `https://your-project.vercel.app`)

Test the endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Root endpoint
curl https://your-project.vercel.app/

# Test leads endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-project.vercel.app/api/leads
```

## Step 4: Configure Frontend

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

## Troubleshooting

### Issue: "DATABASE_URL is not set"
**Solution:** Verify environment variables are set in Vercel dashboard

### Issue: "Module not found"
**Solution:** 
- Check `package.json` has all dependencies
- Redeploy with `vercel --prod`
- Check build logs in Vercel dashboard

### Issue: "CORS Error"
**Solution:** 
- Add your frontend URL to `ALLOWED_ORIGINS` environment variable
- Format: `https://frontend.vercel.app,http://localhost:3000`

### Issue: "Function Timeout"
**Solution:** 
- Optimize database queries
- Add indexes to frequently queried columns
- Consider upgrading Vercel plan for longer timeout limits

### Issue: "Cold Start Delays"
**Solution:** 
- This is normal for serverless functions
- Consider Vercel Pro plan for better cold start performance
- Implement connection pooling (already configured)

## Advanced Configuration

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `ALLOWED_ORIGINS` with new domain

### Automatic Deployments

With GitHub integration:
- **Production:** Push to `main` branch → deploys to production
- **Preview:** Push to any branch → creates preview deployment
- **Pull Requests:** Auto-creates preview deployments

### Environment-Specific Settings

Create different environment variable sets:
- **Production:** Production database, strict security
- **Preview:** Staging database, relaxed for testing
- **Development:** Local database or dev instance

### Monitoring and Logs

1. Go to your Vercel project
2. Click "Deployments" → Select deployment
3. View "Functions" tab for logs
4. Set up log drains for external monitoring

## Database Migrations

When you update your schema:

```bash
# 1. Update schema.ts locally
# 2. Generate migration
npm run db:generate

# 3. Apply to production database
npm run db:push

# OR use migrations
npm run db:migrate
```

**Important:** Always test migrations on staging first!

## Security Checklist

- ✅ Environment variables set and secure
- ✅ JWT_SECRET is strong and unique
- ✅ SUPABASE_SERVICE_KEY kept private
- ✅ CORS configured with specific origins
- ✅ Database credentials not exposed
- ✅ RLS (Row Level Security) enabled in Supabase
- ✅ Rate limiting implemented (TODO)
- ✅ Input validation with Zod

## Performance Optimization

1. **Database Connection Pooling:** Already configured in `db/index.ts`
2. **Caching:** Consider adding Redis for frequently accessed data
3. **Indexes:** Add indexes for commonly queried fields
4. **Query Optimization:** Use Drizzle Studio to analyze slow queries

## Rollback Strategy

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## CI/CD Pipeline

Your deployment is now automatic:
1. Push code to GitHub
2. Vercel automatically builds and deploys
3. Preview deployments for all branches
4. Production deployment for main branch

## Cost Optimization

**Vercel Free Tier Limits:**
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Function execution: 100 GB-hours/month

**Tips:**
- Optimize function execution time
- Use edge caching where possible
- Monitor usage in Vercel dashboard

## Next Steps

1. ✅ Backend deployed and running
2. ⬜ Deploy frontend to Vercel
3. ⬜ Connect frontend to backend API
4. ⬜ Set up monitoring (Sentry, LogRocket, etc.)
5. ⬜ Configure custom domain
6. ⬜ Set up automated testing in CI/CD
7. ⬜ Implement rate limiting
8. ⬜ Add API documentation (Swagger/OpenAPI)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Hono.js Documentation](https://hono.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)

## Useful Commands

```bash
# View deployment logs
vercel logs [deployment-url]

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# View project details
vercel inspect [deployment-url]

# Pull environment variables locally
vercel env pull
```

---

🎉 **Congratulations!** Your backend API is now deployed and ready for production use.
