import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { auth } from '../lib/auth'
import { UserRole } from '../types'

const app = new Hono()

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.BUILDER, 
    UserRole.CHANNEL_PARTNER,
    UserRole.CUSTOMER
  ]).optional().default(UserRole.CHANNEL_PARTNER),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
})

// Mount Better Auth handler (handles all Better Auth endpoints)
// This automatically creates:
// POST /sign-up
// POST /sign-in
// POST /sign-out
// GET /session
// POST /refresh
// POST /forgot-password
// POST /reset-password
// GET /verify-email
app.on(['GET', 'POST'], '/*', (c) => auth.handler(c.req.raw))

// Custom signup endpoint with role support
app.post('/signup', zValidator('json', signupSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    // Use Better Auth's sign up method
    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.fullName, // Better Auth uses 'name'
        data: {
          fullName: body.fullName,
          phone: body.phone || null,
          role: body.role,
        }
      },
      headers: c.req.raw.headers,
    })

    if (!result) {
      return c.json({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: 'Failed to create account'
        }
      }, 400)
    }

    return c.json({
      success: true,
      data: {
        user: result.user,
        session: result.session,
        message: 'Account created successfully. Please check your email to verify your account.'
      }
    }, 201)

  } catch (error: any) {
    console.error('Signup error:', error)
    
    return c.json({
      success: false,
      error: {
        code: 'SIGNUP_ERROR',
        message: error.message || 'An error occurred during signup'
      }
    }, 400)
  }
})

// Custom login endpoint
app.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: c.req.raw.headers,
    })

    if (!result) {
      return c.json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Invalid email or password'
        }
      }, 401)
    }

    return c.json({
      success: true,
      data: {
        user: result.user,
        session: result.session,
        message: 'Login successful'
      }
    })

  } catch (error: any) {
    console.error('Login error:', error)
    
    return c.json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: error.message || 'An error occurred during login'
      }
    }, 401)
  }
})

// Logout endpoint
app.post('/logout', async (c) => {
  try {
    await auth.api.signOut({
      headers: c.req.raw.headers,
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
        message: error.message || 'An error occurred during logout'
      }
    }, 400)
  }
})

// Get current session
app.get('/session', async (c) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      }, 401)
    }

    return c.json({
      success: true,
      data: {
        user: session.user,
        session: session.session
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

// Refresh token endpoint
app.post('/refresh', async (c) => {
  try {
    const result = await auth.api.refresh({
      headers: c.req.raw.headers,
    })

    if (!result) {
      return c.json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh session'
        }
      }, 401)
    }

    return c.json({
      success: true,
      data: {
        session: result.session,
        message: 'Session refreshed successfully'
      }
    })

  } catch (error: any) {
    console.error('Refresh error:', error)
    
    return c.json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh session'
      }
    }, 401)
  }
})

// Forgot password endpoint
app.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    await auth.api.forgetPassword({
      body: {
        email: body.email,
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
      },
      headers: c.req.raw.headers,
    })

    // Always return success for security (don't reveal if email exists)
    return c.json({
      success: true,
      data: {
        message: 'If an account with that email exists, we sent a password reset link.'
      }
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // Still return success for security
    return c.json({
      success: true,
      data: {
        message: 'If an account with that email exists, we sent a password reset link.'
      }
    })
  }
})

// Reset password endpoint
app.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    await auth.api.resetPassword({
      body: {
        token: body.token,
        password: body.password,
      },
      headers: c.req.raw.headers,
    })

    return c.json({
      success: true,
      data: {
        message: 'Password reset successfully. You can now login with your new password.'
      }
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    
    return c.json({
      success: false,
      error: {
        code: 'RESET_PASSWORD_ERROR',
        message: error.message || 'Failed to reset password. The link may have expired.'
      }
    }, 400)
  }
})

// Verify email endpoint
app.get('/verify-email', async (c) => {
  try {
    const token = c.req.query('token')
    
    if (!token) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Verification token is required'
        }
      }, 400)
    }

    await auth.api.verifyEmail({
      query: { token },
      headers: c.req.raw.headers,
    })

    return c.json({
      success: true,
      data: {
        message: 'Email verified successfully!'
      }
    })

  } catch (error: any) {
    console.error('Verify email error:', error)
    
    return c.json({
      success: false,
      error: {
        code: 'VERIFY_EMAIL_ERROR',
        message: error.message || 'Failed to verify email. The link may have expired.'
      }
    }, 400)
  }
})

export default app
