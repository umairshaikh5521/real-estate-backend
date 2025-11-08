# Quick Start Guide

Get your backend API running in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Supabase account (free tier is fine)

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=generate-a-random-secret-here
ALLOWED_ORIGINS=http://localhost:3000
```

### Get Supabase Credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing
3. **Database URL:** Settings → Database → Connection String (URI mode)
4. **API Keys:** Settings → API → Copy URL, anon key, and service_role key

### Generate JWT Secret:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 3. Set Up Database

Push your schema to Supabase:

```bash
npm run db:push
```

Or use migrations:

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate
```

## 4. Start Development Server

```bash
npm run dev
```

Your API is now running at `http://localhost:8000` 🚀

## 5. Test Your API

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Root Endpoint
```bash
curl http://localhost:8000/
```

### Test with Authentication

First, get a JWT token from Supabase Auth (via your frontend), then:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/leads
```

## Available Endpoints

- `GET /` - API info
- `GET /api/health` - Health check
- `GET /api/leads` - Get all leads (auth required)
- `POST /api/leads` - Create lead (auth required)
- `GET /api/projects` - Get all projects (auth required)
- `POST /api/projects` - Create project (auth required)

See `README.md` for full API documentation.

## Optional: Use Drizzle Studio

Explore your database visually:

```bash
npm run db:studio
```

Opens at `https://local.drizzle.studio`

## Next Steps

1. ✅ Backend running locally
2. Start your frontend: `cd ../frontend && npm run dev`
3. Connect frontend to backend API
4. Build features and test
5. Deploy to Vercel (see `DEPLOYMENT.md`)

## Troubleshooting

### "DATABASE_URL is not set"
- Check `.env` file exists in `backend/` folder
- Verify no typos in environment variable names

### "Connection refused"
- Check Supabase project is active
- Verify database URL is correct
- Check if IP needs whitelisting in Supabase

### "Port already in use"
- Change PORT in `.env` file
- Or stop other process using port 8000

## Need Help?

- Check `README.md` for detailed documentation
- Check `DEPLOYMENT.md` for deployment guide
- Review schema in `src/db/schema.ts`

---

Happy coding! 🎉
