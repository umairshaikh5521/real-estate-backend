#!/bin/bash

# Test Authentication Endpoints
echo "=== Testing Real Estate CRM Auth API ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s http://localhost:8000/api/health | jq '.'
echo ""

# Test 2: Signup
echo "2. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe",
    "phone": "+919876543210",
    "role": "channel_partner"
  }')

echo "$SIGNUP_RESPONSE" | jq '.'
echo ""

# Test 3: Login
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Test 4: Session (with cookies from login)
echo "4. Testing Session..."
SESSION_RESPONSE=$(curl -s http://localhost:8000/api/auth/session \
  -b cookies.txt)

echo "$SESSION_RESPONSE" | jq '.'
echo ""

# Test 5: Logout
echo "5. Testing Logout..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt)

echo "$LOGOUT_RESPONSE" | jq '.'
echo ""

echo "=== Tests Complete ==="
echo ""
echo "Cookie file saved as cookies.txt"
