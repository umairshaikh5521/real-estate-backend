# Auth API Test Commands

Run these commands in your bash terminal:

## 1. Health Check
```bash
curl http://localhost:8000/api/health
```

## 2. Signup (Create New User)
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "alice@example.com",
    "password": "Alice123",
    "fullName": "Alice Wonder",
    "phone": "+919876543210",
    "role": "channel_partner"
  }'
```

Expected: Status 201, returns user object with accessToken

## 3. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "alice@example.com",
    "password": "Alice123"
  }'
```

Expected: Status 200, returns user object with accessToken

## 4. Get Session (with cookies)
```bash
curl http://localhost:8000/api/auth/session -b cookies.txt
```

Expected: Status 200, returns current user info

## 5. Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh -b cookies.txt
```

Expected: Status 200, returns new accessToken

## 6. Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout -b cookies.txt
```

Expected: Status 200, cookies cleared

## Test Password Validation

### Weak Password (should fail)
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "weak",
    "fullName": "Test User"
  }'
```

Expected: Status 400, "Password must be at least 8 characters"

### No Uppercase (should fail)
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com",
    "password": "lowercase123",
    "fullName": "Test User"
  }'
```

Expected: Status 400, "Password must contain at least one uppercase letter..."

## Test Email Validation

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Valid123",
    "fullName": "Test User"
  }'
```

Expected: Status 400, validation error

## Test Duplicate Email

```bash
# Try to signup with same email again
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Alice123",
    "fullName": "Alice Wonder"
  }'
```

Expected: Status 400, "An account with this email already exists"

## Test Invalid Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "WrongPassword"
  }'
```

Expected: Status 401, "Invalid email or password"

## Test Different Roles

### Admin User
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

### Builder User
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "builder@example.com",
    "password": "Builder123",
    "fullName": "Builder User",
    "role": "builder"
  }'
```

### Customer User
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123",
    "fullName": "Customer User",
    "role": "customer"
  }'
```

## Notes

- Cookies are saved to `cookies.txt` file
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- All passwords require: 8+ chars, uppercase, lowercase, number
- Default role is `channel_partner` if not specified
