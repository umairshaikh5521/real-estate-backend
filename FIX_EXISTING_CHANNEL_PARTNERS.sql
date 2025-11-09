-- FIX: Create agent records for existing channel partners
-- Run this in your Supabase SQL Editor

-- Insert agent records for all channel partners who don't have one
INSERT INTO agents (user_id, status, performance_metrics, created_at, updated_at)
SELECT 
  u.id,
  'active',
  NULL,
  NOW(),
  NOW()
FROM users u
LEFT JOIN agents a ON a.user_id = u.id
WHERE u.role = 'channel_partner'
  AND a.id IS NULL;

-- Verify: Check how many agent records were created
SELECT 
  u.email,
  u.full_name,
  u.referral_code,
  a.id as agent_id,
  a.status
FROM users u
JOIN agents a ON a.user_id = u.id
WHERE u.role = 'channel_partner';
