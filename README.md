# Real Estate CRM/ERP - Backend API

A production-ready backend API built with Hono.js, Drizzle ORM, and Supabase, designed for deployment on Vercel.

## Tech Stack

- **Framework:** Hono.js v4
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Deployment:** Vercel

## Features

- ✅ RESTful API with Hono.js
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Supabase authentication integration
- ✅ Type-safe schema definitions
- ✅ Zod validation for all inputs
- ✅ CORS and security middleware
- ✅ Error handling and logging
- ✅ Pagination support
- ✅ Role-based access control
- ✅ Production-ready Vercel configuration

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your actual values:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Authentication
JWT_SECRET=your-secure-random-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

### 3. Database Setup

Generate and run migrations:

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# (Optional) Open Drizzle Studio to view your database
npm run db:studio
```

### 4. Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:8000`

### 5. Build

Build for production:

```bash
npm run build
```

### 6. Deploy to Vercel

#### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Option 2: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Select your repository
5. Set root directory to `backend`
6. Add environment variables in Vercel settings
7. Deploy

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Leads
- `GET /api/leads` - Get all leads (paginated)
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Projects
- `GET /api/projects` - Get all projects (paginated)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Coming Soon
- `/api/bookings` - Booking management
- `/api/agents` - Agent management
- `/api/units` - Unit/inventory management
- `/api/payments` - Payment tracking

## API Response Format

### Success Response
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

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

Get the token from Supabase Auth on the frontend and pass it with each request.

## Database Schema

### Tables
- **users** - User accounts (agents, admins)
- **agents** - Agent profiles and performance
- **leads** - Lead information and tracking
- **projects** - Real estate projects
- **units** - Property units/inventory
- **bookings** - Customer bookings
- **payments** - Payment transactions
- **activities** - Activity logs

See `src/db/schema.ts` for detailed schema definitions.

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts           # Database schema
│   │   └── index.ts            # Database client
│   ├── routes/
│   │   ├── leads.ts            # Leads endpoints
│   │   ├── projects.ts         # Projects endpoints
│   │   └── index.ts            # Route aggregator
│   ├── middleware/
│   │   ├── auth.ts             # Authentication
│   │   ├── cors.ts             # CORS configuration
│   │   ├── error-handler.ts   # Error handling
│   │   └── logger.ts           # Request logging
│   ├── lib/
│   │   ├── response.ts         # Response utilities
│   │   └── validation.ts       # Validation utilities
│   ├── types/
│   │   └── index.ts            # Type definitions
│   └── index.ts                # App entry point
├── drizzle/                    # Migrations (generated)
├── .env                        # Environment variables
├── .env.example                # Environment template
├── drizzle.config.ts           # Drizzle configuration
├── tsconfig.json               # TypeScript config
├── vercel.json                 # Vercel config
└── package.json                # Dependencies
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run type-check` - Check TypeScript types
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 8000) | No |

## Development Tips

1. **Hot Reload:** Changes are automatically reloaded in development mode
2. **Database Studio:** Use `npm run db:studio` to visually explore your database
3. **Type Safety:** All database queries are type-safe thanks to Drizzle
4. **Validation:** Input validation is handled automatically with Zod schemas
5. **Error Handling:** All errors are caught and formatted consistently

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase (if applicable)

### Vercel Deployment Issues
- Verify all environment variables are set in Vercel
- Check build logs for errors
- Ensure Node.js version is 18+

### CORS Errors
- Add your frontend URL to ALLOWED_ORIGINS
- Check CORS middleware is properly configured

## Next Steps

1. Add authentication endpoints (register, login, logout)
2. Implement bookings, agents, units, and payments routes
3. Add file upload functionality for project documents
4. Implement analytics and reporting endpoints
5. Add real-time features with Supabase subscriptions
6. Set up automated testing
7. Add rate limiting
8. Implement caching strategy

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
