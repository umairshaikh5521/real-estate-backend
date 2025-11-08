# Authentication System Documentation

## Overview

This Real Estate CRM uses **Better Auth** - a production-grade authentication library that handles all authentication concerns securely and efficiently.

## Features Implemented

✅ Email/Password authentication  
✅ Role-based access control (admin, builder, channel_partner, customer)  
✅ Email verification  
✅ Password reset functionality  
✅ JWT + Refresh tokens (automatic rotation)  
✅ Session management  
✅ CSRF protection  
✅ Rate limiting  
✅ Password strength validation  

## User Roles

| Role | Database Value | Description |
|------|----------------|-------------|
| Admin | `admin` | Full system access, can manage all users and data |
| Builder | `builder` | Can manage projects, units, and view bookings |
| Channel Partner | `channel_partner` | Default role, can manage leads and bookings |
| Customer | `customer` | End users, can view properties and bookings |

## Authentication Endpoints

### Base URL
```
Local: http://localhost:8000/api/auth
Production: https://your-domain.vercel.app/api/auth
```

### 1. Sign Up

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "channel_partner"
}
```

**Password Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "channel_partner",
      "emailVerified": false
    },
    "session": {
      "token": "jwt-token",
      "expiresAt": "timestamp"
    },
    "message": "Account created successfully. Please check your email to verify your account."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "SIGNUP_ERROR",
    "message": "Email already exists"
  }
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "channel_partner",
      "emailVerified": false
    },
    "session": {
      "token": "jwt-token",
      "expiresAt": "timestamp"
    },
    "message": "Login successful"
  }
}
```

**Note:** Users can login even if email is not verified (as per requirements).

### 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:** 
```
Cookie: better-auth.session_token=<token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### 4. Get Current Session

**Endpoint:** `GET /api/auth/session`

**Headers:** 
```
Cookie: better-auth.session_token=<token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "channel_partner",
      "emailVerified": true
    },
    "session": {
      "id": "session-id",
      "expiresAt": "timestamp"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

### 5. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Headers:** 
```
Cookie: better-auth.session_token=<token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "token": "new-jwt-token",
      "expiresAt": "timestamp"
    },
    "message": "Session refreshed successfully"
  }
}
```

### 6. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, we sent a password reset link."
  }
}
```

**Note:** Always returns success for security (doesn't reveal if email exists).

### 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. You can now login with your new password."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "RESET_PASSWORD_ERROR",
    "message": "Failed to reset password. The link may have expired."
  }
}
```

### 8. Verify Email

**Endpoint:** `GET /api/auth/verify-email?token=<verification-token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully!"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VERIFY_EMAIL_ERROR",
    "message": "Failed to verify email. The link may have expired."
  }
}
```

## Token Management

### Access Token
- **Expiry:** 15 minutes
- **Storage:** httpOnly cookie (automatically handled by Better Auth)
- **Name:** `better-auth.session_token`

### Refresh Token
- **Expiry:** 7 days
- **Auto-rotation:** Yes (new refresh token on each use)
- **Storage:** Secure httpOnly cookie

### Token Refresh Flow
1. Access token expires after 15 minutes
2. Client automatically calls `/api/auth/refresh`
3. New access token issued if refresh token valid
4. Refresh token rotated (old one invalidated, new one issued)

## Using Auth Middleware

### Protect Routes (Require Authentication)

```typescript
import { requireAuth } from '../middleware/requireAuth'

// Protect entire route
app.use('/api/leads/*', requireAuth)

// Protect specific endpoint
app.get('/api/profile', requireAuth, async (c) => {
  const user = c.get('user') // User attached by middleware
  return c.json({ user })
})
```

### Protect by Role

```typescript
import { requireAuth, requireRole } from '../middleware/requireAuth'
import { UserRole } from '../types'

// Only admins can access
app.delete('/api/users/:id', 
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (c) => {
    // Delete user logic
  }
)

// Admins and builders can access
app.post('/api/projects',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.BUILDER]),
  async (c) => {
    // Create project logic
  }
)
```

### Optional Auth

```typescript
import { optionalAuth } from '../middleware/requireAuth'

// User info attached if logged in, but route works without auth
app.get('/api/public-listings', optionalAuth, async (c) => {
  const user = c.get('user') // May be undefined
  
  // Show personalized results if logged in
  if (user) {
    // Personalized logic
  }
  
  // Public logic
})
```

## Email Templates

### Email Verification

When a user signs up, they receive:

**Subject:** Verify your email address

**Content:** 
- Welcome message
- Verify Email button (links to `/api/auth/verify-email?token=<token>`)
- Link valid for 24 hours

### Password Reset

When a user requests password reset:

**Subject:** Reset your password

**Content:**
- Reset Password button (links to frontend `/reset-password?token=<token>`)
- Frontend should collect new password and POST to `/api/auth/reset-password`
- Link valid for 1 hour

## Security Features

### Rate Limiting
- **Window:** 1 minute
- **Max Requests:** 10 per window
- **Scope:** Per IP address

### Password Security
- **Hashing:** bcrypt with automatic salt
- **Cost Factor:** 12 (industry standard)
- **Validation:** Enforced on both client and server

### Session Security
- **httpOnly Cookies:** Prevents XSS attacks
- **Secure Flag:** Enabled in production (HTTPS only)
- **SameSite:** Strict (prevents CSRF)
- **Token Rotation:** Refresh tokens rotated on each use

### CSRF Protection
- Built into Better Auth
- Validates origin headers
- Checks request source

## Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
AUTH_SECRET=your-secure-secret-key
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Email (nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Real Estate CRM <noreply@realestate.com>"
```

## Testing Auth Endpoints

### Using curl

**1. Sign Up:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User",
    "phone": "+1234567890"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**3. Get Session:**
```bash
curl http://localhost:8000/api/auth/session \
  -b cookies.txt
```

**4. Logout:**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt
```

### Using Postman/Thunder Client

1. **Sign Up** → POST `/api/auth/signup` with JSON body
2. **Login** → POST `/api/auth/login` with JSON body
   - Cookies will be automatically stored
3. **Protected Routes** → Cookies sent automatically
4. **Logout** → POST `/api/auth/logout`

## Frontend Integration

### React Example

```typescript
// api/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export const signup = async (data: SignupData) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data),
  })
  return response.json()
}

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export const getSession = async () => {
  const response = await fetch(`${API_URL}/auth/session`, {
    credentials: 'include',
  })
  return response.json()
}

export const logout = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.json()
}
```

## Troubleshooting

### Issue: "Email already exists"
**Solution:** Email must be unique. Use different email or implement "forgot password" flow.

### Issue: "Invalid email or password"
**Solution:** 
- Check credentials are correct
- Ensure password meets requirements
- Check if account exists

### Issue: "Cookies not being set"
**Solution:**
- Ensure `credentials: 'include'` in fetch requests
- Check CORS is configured correctly
- Verify `ALLOWED_ORIGINS` includes your frontend URL

### Issue: "Session expired"
**Solution:**
- Call `/api/auth/refresh` to get new access token
- Implement automatic refresh in frontend
- Check refresh token hasn't expired (7 days)

### Issue: "Email not sending"
**Solution:**
- Check SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check firewall/network allows SMTP connections
- View logs for email errors

## Database Schema

### users table
```sql
- id (uuid, primary key)
- email (varchar, unique)
- password_hash (text)
- full_name (varchar)
- phone (varchar, nullable)
- role (varchar, default: 'channel_partner')
- avatar (text, nullable)
- is_active (boolean, default: true)
- email_verified (boolean, default: false)
- verification_token (text, nullable)
- verification_token_expires (timestamp, nullable)
- reset_token (text, nullable)
- reset_token_expires (timestamp, nullable)
- last_login_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### sessions table
```sql
- id (text, primary key)
- user_id (uuid, foreign key → users.id)
- expires_at (timestamp)
- token (text, unique)
- ip_address (text, nullable)
- user_agent (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### verification_tokens table
```sql
- id (text, primary key)
- identifier (text) -- email or user id
- token (text, unique)
- expires (timestamp)
- created_at (timestamp)
```

## Production Deployment Checklist

- [ ] Set strong `AUTH_SECRET` (min 32 characters random string)
- [ ] Configure SMTP with real email service
- [ ] Set `BASE_URL` to production API URL
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Enable HTTPS (handled by Vercel automatically)
- [ ] Configure CORS with production frontend domain
- [ ] Test all auth flows in production
- [ ] Monitor email delivery
- [ ] Set up error logging for auth failures

## Support

For issues or questions:
1. Check this documentation
2. Review Better Auth docs: https://www.better-auth.com
3. Check server logs for errors
4. Verify environment variables are set

---

**Last Updated:** 2025-11-08  
**Better Auth Version:** Latest  
**Status:** Production Ready ✅
