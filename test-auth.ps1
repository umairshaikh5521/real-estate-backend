# Test Authentication Endpoints
Write-Host "=== Testing Real Estate CRM Auth API ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri http://localhost:8000/api/health -Method GET
    Write-Host "✓ Health Check: " -NoNewline -ForegroundColor Green
    Write-Host ($health.Content | ConvertFrom-Json | ConvertTo-Json -Compress)
} catch {
    Write-Host "✗ Health Check Failed" -ForegroundColor Red
}
Write-Host ""

# Test 2: Signup
Write-Host "2. Testing Signup..." -ForegroundColor Cyan
$signupBody = @{
    email = "john.doe@example.com"
    password = "SecurePass123"
    fullName = "John Doe"
    phone = "+919876543210"
    role = "channel_partner"
} | ConvertTo-Json

try {
    $signup = Invoke-WebRequest -Uri http://localhost:8000/api/auth/signup `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $signupBody
    
    Write-Host "✓ Signup Success (201):" -ForegroundColor Green
    $signupData = $signup.Content | ConvertFrom-Json
    Write-Host "  User ID: $($signupData.data.user.id)"
    Write-Host "  Email: $($signupData.data.user.email)"
    Write-Host "  Role: $($signupData.data.user.role)"
    $accessToken = $signupData.data.accessToken
} catch {
    Write-Host "✗ Signup Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing Login..." -ForegroundColor Cyan
$loginBody = @{
    email = "john.doe@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

try {
    $login = Invoke-WebRequest -Uri http://localhost:8000/api/auth/login `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -SessionVariable session
    
    Write-Host "✓ Login Success (200):" -ForegroundColor Green
    $loginData = $login.Content | ConvertFrom-Json
    Write-Host "  User: $($loginData.data.user.fullName)"
    Write-Host "  Email: $($loginData.data.user.email)"
    Write-Host "  Role: $($loginData.data.user.role)"
    
    # Extract cookies
    $cookies = $login.Headers['Set-Cookie']
    Write-Host "  Cookies Set: $($cookies.Count)"
} catch {
    Write-Host "✗ Login Failed:" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host ""

# Test 4: Session (with cookies from login)
Write-Host "4. Testing Session..." -ForegroundColor Cyan
try {
    $sessionReq = Invoke-WebRequest -Uri http://localhost:8000/api/auth/session `
        -Method GET `
        -WebSession $session
    
    Write-Host "✓ Session Valid:" -ForegroundColor Green
    $sessionData = $sessionReq.Content | ConvertFrom-Json
    Write-Host "  Current User: $($sessionData.data.user.fullName)"
} catch {
    Write-Host "✗ Session Failed:" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host ""

# Test 5: Logout
Write-Host "5. Testing Logout..." -ForegroundColor Cyan
try {
    $logout = Invoke-WebRequest -Uri http://localhost:8000/api/auth/logout `
        -Method POST `
        -WebSession $session
    
    Write-Host "✓ Logout Success:" -ForegroundColor Green
    Write-Host ($logout.Content | ConvertFrom-Json).data.message
} catch {
    Write-Host "✗ Logout Failed:" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Tests Complete ===" -ForegroundColor Green
