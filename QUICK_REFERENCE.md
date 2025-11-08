# Quick Reference Card

## 🚀 Essential Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start dev server (localhost:8000)

# Database
npm run db:generate           # Generate Drizzle migrations
npm run db:push              # Push schema to Supabase
npm run db:migrate           # Run migrations
npm run db:studio            # Open Drizzle Studio

# Build & Quality
npm run build                # Build for production
npm run type-check           # Check TypeScript
npm run lint                 # Lint code
npm run format               # Format code

# Deployment
vercel                       # Deploy to Vercel
vercel --prod               # Deploy to production
vercel logs                 # View logs
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `api/index.ts` | Vercel serverless entry point |
| `src/index.ts` | Local development server |
| `src/db/schema.ts` | Database schema definition |
| `src/routes/` | API endpoint handlers |
| `vercel.json` | Vercel configuration |
| `.env` | Environment variables (local) |

## 🔗 API Endpoints

### Base URL
- **Local:** `http://localhost:8000`
- **Production:** `https://your-project.vercel.app`

### Routes
```
GET  /api                    # API info
GET  /api/health            # Health check
GET  /api/leads             # List leads
POST /api/leads             # Create lead
GET  /api/leads/:id         # Get lead
PUT  /api/leads/:id         # Update lead
DELETE /api/leads/:id       # Delete lead
GET  /api/projects          # List projects
POST /api/projects          # Create project
GET  /api/projects/:id      # Get project
PUT  /api/projects/:id      # Update project
DELETE /api/projects/:id    # Delete project
```

## 🔐 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
ALLOWED_ORIGINS=...

# Optional
NODE_ENV=development
PORT=8000
```

## 🧪 Testing Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# API info
curl http://localhost:8000/api

# With authentication
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/leads

# Production
curl https://your-project.vercel.app/api/health
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 8000 in use | `taskkill /F /PID [PID]` |
| DATABASE_URL not set | Check `.env` file exists |
| Module not found on Vercel | Use `api/index.ts` structure |
| CORS errors | Add frontend URL to `ALLOWED_ORIGINS` |
| Connection refused | Check Supabase project is active |

## 📄 Documentation

| File | What's Inside |
|------|--------------|
| `QUICKSTART.md` | 5-minute setup guide |
| `README.md` | Full documentation |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment |
| `VERCEL_FIX.md` | Deployment fix explanation |
| `SUMMARY.md` | Project overview |
| `DEPLOYMENT.md` | Detailed deployment guide |

## 🗄️ Database Tables

1. `users` - User accounts
2. `agents` - Agent profiles
3. `leads` - Lead information
4. `projects` - Real estate projects
5. `units` - Property units
6. `bookings` - Customer bookings
7. `payments` - Payment records
8. `activities` - Activity logs

## 🔄 Deployment Flow

```
1. Update code → 2. Git commit → 3. Git push → 4. Vercel auto-deploys
```

Or manually:
```bash
vercel --prod
```

## 📊 Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Hono Docs](https://hono.dev)
- [Drizzle Docs](https://orm.drizzle.team)

## 🎯 Status Checklist

- [x] Backend scaffolded
- [x] Vercel config fixed
- [x] Database schema defined
- [x] Middleware configured
- [x] Documentation complete
- [ ] Supabase configured
- [ ] Deployed to Vercel
- [ ] Frontend integrated

---

**Pro Tip:** Keep this card open while developing! 💡
