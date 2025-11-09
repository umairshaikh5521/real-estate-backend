import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users, sessions, channelPartners } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateRandomToken } from '../lib/jwt.js'
import { UserRole } from '../types/index.js'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { generateReferralCode } from '../lib/referralCode.js'
import { requireAuth } from '../middleware/requireAuth.js'

type Variables = {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
}

const app = new Hono<{ Variables: Variables }>()

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.BUILDER,
    UserRole.CHANNEL_PARTNER,
    UserRole.CUSTOMER
  ]).optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  email: z.string().email('Invalid email').optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// Sign Up
app.post('/signup', zValidator('json', signupSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    // Validate password strength
    const passwordCheck = validatePasswordStrength(body.password)
    if (!passwordCheck.valid) {
      return c.json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: passwordCheck.message
        }
      }, 400)
    }
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
    if (existingUser.length > 0) {
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists'
        }
      }, 400)
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password)
    
    // Generate referral code for channel partners
    let referralCode: string | null = null;
    if (body.role === UserRole.CHANNEL_PARTNER || !body.role) {
      referralCode = generateReferralCode(body.fullName);
      
      // Check if code exists, regenerate if needed
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
        if (existing.length === 0) break;
        referralCode = generateReferralCode(body.fullName);
        attempts++;
      }
    }
    
    // Create user
    const [newUser] = await db.insert(users).values({
      email: body.email,
      passwordHash,
      fullName: body.fullName,
      phone: body.phone || null,
      role: body.role || UserRole.CHANNEL_PARTNER,
      referralCode,
      emailVerified: false,
      isActive: true,
    }).returning()
    
    // Auto-create channel partner record
    if ((body.role || UserRole.CHANNEL_PARTNER) === UserRole.CHANNEL_PARTNER) {
      await db.insert(channelPartners).values({
        userId: newUser.id,
        status: 'active',
        performanceMetrics: null,
      })
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })
    
    const refreshToken = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await db.insert(sessions).values({
      id: generateRandomToken(),
      userId: newUser.id,
      token: refreshToken,
      expiresAt,
      ipAddress: c.req.header('x-forwarded-for') || null,
      userAgent: c.req.header('user-agent') || null,
    })
    
    // Set cookies
    // Use 'None' for cross-domain in production, 'Lax' for same-domain in dev
    const isProduction = process.env.NODE_ENV === 'production'
    
    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })
    
    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
    
    return c.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          role: newUser.role,
          emailVerified: newUser.emailVerified,
        },
        accessToken,
        message: 'Account created successfully!'
      }
    }, 201)
    
  } catch (error: any) {
    console.error('Signup error:', error)
    return c.json({
      success: false,
      error: {
        code: 'SIGNUP_ERROR',
        message: 'An error occurred during signup'
      }
    }, 500)
  }
})

// Login
app.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      }, 401)
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.passwordHash)
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      }, 401)
    }
    
    // Check if account is active
    if (!user.isActive) {
      return c.json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled'
        }
      }, 403)
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.insert(sessions).values({
      id: generateRandomToken(),
      userId: user.id,
      token: refreshToken,
      expiresAt,
      ipAddress: c.req.header('x-forwarded-for') || null,
      userAgent: c.req.header('user-agent') || null,
    })
    
    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))
    
    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production'
    
    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 15 * 60,
      path: '/',
    })
    
    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          referralCode: user.referralCode,
        },
        accessToken,
        message: 'Login successful'
      }
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'An error occurred during login'
      }
    }, 500)
  }
})

// Logout
app.post('/logout', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refreshToken')
    
    if (refreshToken) {
      // Delete session from database
      await db.delete(sessions).where(eq(sessions.token, refreshToken))
    }
    
    // Clear cookies with same attributes they were set with
    // CRITICAL: For SameSite=None cookies, must delete with same attributes
    const isProduction = process.env.NODE_ENV === 'production'
    
    deleteCookie(c, 'accessToken', {
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
    })
    
    deleteCookie(c, 'refreshToken', {
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
    })
    
    return c.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    })
    
  } catch (error: any) {
    console.error('Logout error:', error)
    return c.json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'An error occurred during logout'
      }
    }, 500)
  }
})

// Get current session/user
app.get('/session', async (c) => {
  try {
    const accessToken = getCookie(c, 'accessToken')
    
    if (!accessToken) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      }, 401)
    }
    
    const payload = verifyRefreshToken(accessToken)
    if (!payload) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      }, 401)
    }
    
    // Get fresh user data
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404)
    }
    
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          referralCode: user.referralCode,
        }
      }
    })
    
  } catch (error: any) {
    console.error('Session error:', error)
    return c.json({
      success: false,
      error: {
        code: 'SESSION_ERROR',
        message: 'Failed to get session'
      }
    }, 401)
  }
})

// Refresh token
app.post('/refresh', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refreshToken')
    
    if (!refreshToken) {
      return c.json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not found'
        }
      }, 401)
    }
    
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      }, 401)
    }
    
    // Verify session exists
    const [session] = await db.select().from(sessions).where(eq(sessions.token, refreshToken)).limit(1)
    if (!session) {
      return c.json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      }, 401)
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })
    
    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production'
    
    setCookie(c, 'accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 15 * 60,
      path: '/',
    })
    
    return c.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully'
      }
    })
    
  } catch (error: any) {
    console.error('Refresh error:', error)
    return c.json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token'
      }
    }, 401)
  }
})

// Update profile (protected route)
app.put('/profile', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      }, 401)
    }

    const body = c.req.valid('json')
    
    // Check if email is being changed and if it's already taken
    if (body.email && body.email !== user.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)
      
      if (existingUser) {
        return c.json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use'
          }
        }, 400)
      }
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    return c.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
          referralCode: updatedUser.referralCode,
        },
        message: 'Profile updated successfully'
      }
    })
  } catch (error: unknown) {
    console.error('Update profile error:', error)
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update profile'
      }
    }, 500)
  }
})

// Change password (protected route)
app.put('/password', requireAuth, zValidator('json', changePasswordSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      }, 401)
    }

    const body = c.req.valid('json')
    
    // Get user from database with password
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
    
    if (!dbUser) {
      return c.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404)
    }

    // Verify current password
    const isValidPassword = await verifyPassword(body.currentPassword, dbUser.passwordHash)
    
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      }, 400)
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(body.newPassword)
    if (!passwordValidation.valid) {
      return c.json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: passwordValidation.message || 'Password is too weak'
        }
      }, 400)
    }

    // Hash new password
    const newPasswordHash = await hashPassword(body.newPassword)

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Invalidate all sessions except current
    const refreshToken = getCookie(c, 'refreshToken')
    if (refreshToken) {
      await db
        .delete(sessions)
        .where(
          and(
            eq(sessions.userId, user.id),
            // Keep current session
            // Note: Can't use not() directly, so we'll just delete all for security
          )
        )
    }

    return c.json({
      success: true,
      data: {
        message: 'Password changed successfully'
      }
    })
  } catch (error: unknown) {
    console.error('Change password error:', error)
    return c.json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password'
      }
    }, 500)
  }
})

export default app
