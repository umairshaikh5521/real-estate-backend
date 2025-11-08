/**
 * Referral Code Generation Utility
 * Generates unique referral codes for channel partners
 */

import crypto from 'crypto';

/**
 * Generate a unique referral code from user's name
 * Format: [Initials][Random6Digits]
 * Example: John Doe -> JD123456
 */
export function generateReferralCode(fullName: string): string {
  // Get initials from name
  const initials = fullName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3); // Max 3 initials
  
  // Generate 6 random digits
  const randomDigits = crypto.randomInt(100000, 999999).toString();
  
  // Combine initials and digits
  const code = `${initials}${randomDigits}`;
  
  return code;
}

/**
 * Validate referral code format
 * Should be 6-10 characters (letters + digits)
 */
export function isValidReferralCodeFormat(code: string): boolean {
  return /^[A-Z]{1,3}\d{6}$/.test(code);
}

/**
 * Generate multiple referral code options (in case of duplicates)
 */
export function generateReferralCodeOptions(fullName: string, count: number = 3): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(generateReferralCode(fullName));
  }
  
  return codes;
}
