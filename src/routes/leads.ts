import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/index.js'
import { leads, users, agents } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/requireAuth.js'
import { UserRole } from '../types/index.js'

const app = new Hono()

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional(),
  phone: z.string().min(10, 'Valid phone number required'),
  referralCode: z.string().optional(),
  projectInterest: z.string().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
})

// Public endpoint - Create lead from website (with referral code)
app.post('/public', zValidator('json', createLeadSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    let assignedAgentId = null
    let channelPartnerId = null
    
    // If referral code provided, find the channel partner
    if (body.referralCode) {
      const [channelPartner] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.referralCode, body.referralCode.toUpperCase()),
          eq(users.role, UserRole.CHANNEL_PARTNER),
          eq(users.isActive, true)
        ))
        .limit(1)
      
      if (!channelPartner) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REFERRAL_CODE',
            message: 'Invalid or inactive referral code'
          }
        }, 400)
      }
      
      // Find agent record for this channel partner
      const [agentRecord] = await db
        .select()
        .from(agents)
        .where(eq(agents.userId, channelPartner.id))
        .limit(1)
      
      if (agentRecord) {
        assignedAgentId = agentRecord.id
        channelPartnerId = channelPartner.id
      }
    }
    
    // Create lead
    const [newLead] = await db.insert(leads).values({
      name: body.name,
      email: body.email || null,
      phone: body.phone,
      status: 'new',
      source: body.referralCode ? 'referral' : 'website',
      assignedAgentId,
      budget: body.budget?.toString(),
      notes: body.notes || null,
      metadata: {
        referralCode: body.referralCode,
        channelPartnerId,
        submittedFrom: 'website'
      }
    }).returning()
    
    return c.json({
      success: true,
      data: {
        lead: newLead,
        message: body.referralCode 
          ? 'Lead submitted successfully! Your channel partner will contact you soon.'
          : 'Lead submitted successfully! We will contact you soon.'
      }
    }, 201)
    
  } catch (error: unknown) {
    console.error('Create lead error:', error)
    return c.json({
      success: false,
      error: {
        code: 'LEAD_CREATION_ERROR',
        message: 'Failed to submit lead'
      }
    }, 500)
  }
})

// Protected endpoint - Get leads for current user
app.get('/', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    
    // If channel partner, get their assigned leads
    if (user.role === UserRole.CHANNEL_PARTNER) {
      // Get agent record for this user
      const [agentRecord] = await db
        .select()
        .from(agents)
        .where(eq(agents.userId, user.id))
        .limit(1)
      
      if (!agentRecord) {
        return c.json({
          success: true,
          data: {
            leads: [],
            total: 0
          }
        })
      }
      
      // Get leads assigned to this agent
      const userLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.assignedAgentId, agentRecord.id))
        .orderBy(desc(leads.createdAt))
      
      return c.json({
        success: true,
        data: {
          leads: userLeads,
          total: userLeads.length
        }
      })
    }
    
    // Admin/Builder get all leads
    const allLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
    
    return c.json({
      success: true,
      data: {
        leads: allLeads,
        total: allLeads.length
      }
    })
    
  } catch (error: unknown) {
    console.error('Get leads error:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch leads'
      }
    }, 500)
  }
})

// Get lead by ID
app.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1)
    
    if (!lead) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lead not found'
        }
      }, 404)
    }
    
    return c.json({
      success: true,
      data: { lead }
    })
    
  } catch (error: unknown) {
    console.error('Get lead error:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch lead'
      }
    }, 500)
  }
})

export default app
