# Database Migration Guide

## Issue: Column "referral_code" does not exist

### Error Message
```
PostgresError: column "referral_code" does not exist
```

### Cause
The `referral_code` column was added to the schema but not yet applied to the database.

### Solution Applied ✅

Created and applied migration `0001_add_referral_code.sql`:
```sql
ALTER TABLE "users" ADD COLUMN "referral_code" varchar(20);
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");
```

---

## For Development (Local)

Migration already applied! ✅

If you need to reapply:
```bash
cd backend
npm run db:migrate
```

---

## For Production (Vercel)

### Option 1: Run Migration Locally (Recommended)

Since your local `.env` connects to production Supabase, the migration is **already applied** when you ran it locally.

✅ **No additional action needed in production!**

### Option 2: Run Migration via Vercel CLI (If needed in future)

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
npm run db:migrate
```

### Option 3: Manual Migration via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
-- Add referral_code column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(20);

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");
```

---

## Verify Migration

### Check if column exists:
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'referral_code';
```

Expected output:
```
column_name    | data_type        | character_maximum_length
---------------|------------------|-------------------------
referral_code  | character varying| 20
```

### Check constraint:
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name = 'users_referral_code_unique';
```

Expected output:
```
constraint_name              | constraint_type
----------------------------|----------------
users_referral_code_unique  | UNIQUE
```

---

## Testing

### 1. Test Signup (should auto-generate referral code)
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "John Doe",
    "role": "channel_partner"
  }'
```

Expected: User created with referralCode like "JD123456"

### 2. Test Login (should return referralCode)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Expected: Response includes user object with referralCode

### 3. Test Session
```bash
curl -X GET http://localhost:8000/api/auth/session \
  --cookie "accessToken=YOUR_TOKEN"
```

Expected: User object includes referralCode field

---

## Migration Files

Location: `backend/drizzle/`

- `0001_add_referral_code.sql` - Migration SQL
- `meta/_journal.json` - Migration metadata

---

## Future Migrations

When you modify the schema:

1. **Update schema file**: `src/db/schema.ts`
2. **Generate migration**: `npm run db:generate`
3. **Review migration**: Check `drizzle/*.sql`
4. **Apply migration**: `npm run db:migrate`
5. **Test**: Verify changes work
6. **Commit**: Add migration files to git

---

## Rollback (If needed)

To remove the referral_code column:

```sql
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_referral_code_unique";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_code";
```

⚠️ **Warning**: This will delete all existing referral codes!

---

## Status

✅ Migration applied successfully  
✅ Column exists in database  
✅ Unique constraint added  
✅ Login/Signup working  
✅ Referral codes generating  

No further action required! 🎉
