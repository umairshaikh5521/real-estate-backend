import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyAccessToken } from '../lib/jwt.js'
import { UserRole } from '../types/index.js'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const requireAuth = async (c: Context, next: Next) => {
  try {
    const accessToken = getCookie(c, 'accessToken')
    
    if (!accessToken) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401)
    }
    
    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      }, 401)
    }
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
    
    if (!user || !user.isActive) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive'
        }
      }, 401)
    }
    
    // Attach user to context
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      emailVerified: user.emailVerified,
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

export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const accessToken = getCookie(c, 'accessToken')
    
    if (accessToken) {
      const payload = verifyAccessToken(accessToken)
      
      if (payload) {
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
        
        if (user && user.isActive) {
          c.set('user', {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            emailVerified: user.emailVerified,
          })
        }
      }
    }
    
    await next()
  } catch (error) {
    // Silently continue if auth fails
    await next()
  }
}
