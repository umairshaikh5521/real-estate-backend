import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters' }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  }
  
  return { valid: true }
}
