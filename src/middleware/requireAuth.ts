import { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { UserRole } from '../types'

/**
 * Middleware to require authentication
 * Attaches user to context if authenticated
 */
export const requireAuth = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session || !session.user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401)
    }

    // Attach user to context
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role as UserRole,
      emailVerified: session.user.emailVerified || false,
    })

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    }, 401)
  }
}

/**
 * Middleware to require specific roles
 * Must be used after requireAuth middleware
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401)
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        }
      }, 403)
    }

    await next()
  }
}

/**
 * Middleware to optionally attach user if authenticated
 * Doesn't fail if not authenticated
 */
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session && session.user) {
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as UserRole,
        emailVerified: session.user.emailVerified || false,
      })
    }

    await next()
  } catch (error) {
    // Silently continue if auth fails
    await next()
  }
}
