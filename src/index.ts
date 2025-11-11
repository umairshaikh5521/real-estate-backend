import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import authRoutes from './routes/auth.js'
import leadsRoutes from './routes/leads.js'
import projectsRoutes from './routes/projects.js'

const app = new Hono()

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use('*', logger())

// Root endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      message: 'Real Estate CRM/ERP API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/*',
        leads: '/api/leads',
        projects: '/api/projects',
      }
    }
  })
})

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  })
})

// Mount auth routes
app.route('/api/auth', authRoutes)

// Mount leads routes
app.route('/api/leads', leadsRoutes)

// Mount projects routes
app.route('/api/projects', projectsRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error occurred:', err)
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    }
  }, 500)
})

// Start server for local development
const port = parseInt(process.env.PORT || '8000')
console.log(`🚀 Server starting on http://localhost:${port}`)
console.log(`📚 API Docs: http://localhost:${port}/`)
console.log(`🔐 Auth endpoints: http://localhost:${port}/api/auth/*`)

serve({
  fetch: app.fetch,
  port,
})

export default app
