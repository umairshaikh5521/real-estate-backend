# Vercel Build Fix - TypeScript ESM Import Errors

## Problem

Vercel build was failing with TypeScript errors:
```
error TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'.
```

## Root Cause

When using `"moduleResolution": "node16"` or `"nodenext"` in TypeScript with ESM modules, all relative imports **must** include explicit `.js` extensions (even though source files are `.ts`).

This is a requirement of ECMAScript modules specification.

## Files Fixed

### 1. Auth Routes (`src/routes/auth.ts`)
```typescript
// BEFORE
import { db } from '../db'
import { users, sessions } from '../db/schema'
import { hashPassword } from '../lib/password'
import { generateAccessToken } from '../lib/jwt'
import { UserRole } from '../types'

// AFTER
import { db } from '../db/index.js'
import { users, sessions } from '../db/schema.js'
import { hashPassword } from '../lib/password.js'
import { generateAccessToken } from '../lib/jwt.js'
import { UserRole } from '../types/index.js'
```

### 2. Auth Middleware (`src/middleware/requireAuth.ts`)
- Replaced Better Auth references with custom JWT implementation
- Added `.js` extensions to all imports
- Fixed import paths

### 3. Routes Index (`src/routes/index.ts`)
```typescript
// BEFORE
import authRouter from "./auth";
import leadsRouter from "./leads";
import projectsRouter from "./projects";

// AFTER
import authRouter from "./auth.js";
import leadsRouter from "./leads.js";
import projectsRouter from "./projects.js";
```

### 4. Leads Routes (`src/routes/leads.ts`)
```typescript
// BEFORE
import { db, leads } from "../db";
import { successResponse, errorResponse } from "../lib/response";
import { authMiddleware } from "../middleware/auth";
import { paginationSchema } from "../lib/validation";

// AFTER
import { db } from "../db/index.js";
import { leads } from "../db/schema.js";
import { successResponse, errorResponse } from "../lib/response.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { paginationSchema } from "../lib/validation.js";
```

Also replaced all `authMiddleware` → `requireAuth` in middleware usage.

### 5. Projects Routes (`src/routes/projects.ts`)
Same fixes as leads routes.

### 6. Main Index (`src/index.ts`)
```typescript
// BEFORE
import authRoutes from './routes/auth'

// AFTER
import authRoutes from './routes/auth.js'
```

### 7. Database Index (`src/db/index.ts`)
```typescript
// BEFORE
import * as schema from "./schema";
export * from "./schema";

// AFTER
import * as schema from "./schema.js";
export * from "./schema.js";
```

### 8. Response Helper (`src/lib/response.ts`)
Fixed Hono TypeScript type issues:
```typescript
// BEFORE
return c.json({ ... }, status);

// AFTER
return c.json({ ... }, status as any);
```

This resolves type mismatch between number and Hono's ContentfulStatusCode type.

## Verification

✅ Build passes: `npm run build`
✅ Server runs: `npm run dev`
✅ All endpoints working
✅ Auth system operational

## TypeScript Configuration

The project uses:
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022"
  }
}
```

This modern configuration requires explicit `.js` extensions for ESM compatibility.

## Important Notes

1. **Always use `.js` extensions** for relative imports (not `.ts`)
   - TypeScript will resolve `.ts` files at compile time
   - Runtime will use `.js` files

2. **Index files need explicit paths**: Use `./db/index.js` not just `./db`

3. **Schema imports**: When importing from `db`, import `db` from `index.js` and schema items from `schema.js` separately:
   ```typescript
   import { db } from "../db/index.js";
   import { users, leads } from "../db/schema.js";
   ```

4. **Type assertions**: Some Hono types need `as any` for flexible status codes

## Testing Deployment

To test before deploying to Vercel:
```bash
npm run build  # Must succeed without errors
npm run dev    # Test locally
```

## Status

✅ **FIXED** - Ready for Vercel deployment
- All TypeScript errors resolved
- Build compiles successfully
- Server running and tested
- Auth endpoints working

## Next Deploy

Simply push to GitHub - Vercel will build successfully now!
