-- DEBUG: Check why leads aren't showing up
-- Run these queries in Supabase SQL Editor to diagnose the issue

-- 1. Check your user account
SELECT 
  id,
  email,
  full_name,
  role,
  referral_code,
  is_active
FROM users
WHERE email = 'umairshaikh5521@gmail.com';

-- 2. Check if you have an agent record
SELECT 
  a.id as agent_id,
  a.user_id,
  a.status,
  u.email,
  u.full_name,
  u.referral_code
FROM agents a
JOIN users u ON u.id = a.user_id
WHERE u.email = 'umairshaikh5521@gmail.com';

-- 3. Check all leads in the database
SELECT 
  id,
  name,
  phone,
  email,
  status,
  source,
  assigned_agent_id,
  referral_code as lead_referral_code,
  metadata,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if any leads are assigned to your agent
SELECT 
  l.id,
  l.name,
  l.phone,
  l.status,
  l.assigned_agent_id,
  a.user_id,
  u.email as agent_email
FROM leads l
LEFT JOIN agents a ON l.assigned_agent_id = a.id
LEFT JOIN users u ON a.user_id = u.id
WHERE u.email = 'umairshaikh5521@gmail.com'
ORDER BY l.created_at DESC;

-- 5. Check leads with your referral code in metadata
SELECT 
  id,
  name,
  phone,
  status,
  assigned_agent_id,
  metadata,
  created_at
FROM leads
WHERE metadata->>'referralCode' = 'US123456'
ORDER BY created_at DESC;

-- 6. FULL DIAGNOSTIC: Everything together
SELECT 
  'User Info' as check_type,
  u.email,
  u.role,
  u.referral_code,
  a.id as agent_id,
  COUNT(l.id) as total_leads
FROM users u
LEFT JOIN agents a ON a.user_id = u.id
LEFT JOIN leads l ON l.assigned_agent_id = a.id
WHERE u.email = 'umairshaikh5521@gmail.com'
GROUP BY u.email, u.role, u.referral_code, a.id;
