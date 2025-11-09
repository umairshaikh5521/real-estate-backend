import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/index.js'
import { leads, users, channelPartners } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/requireAuth.js'
import { UserRole, type AppContext } from '../types/index.js'

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
    
    let assignedChannelPartnerId = null
    let channelPartnerUserId = null
    
    // If referral code provided, find the channel partner
    if (body.referralCode) {
      const [channelPartnerUser] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.referralCode, body.referralCode.toUpperCase()),
          eq(users.role, UserRole.CHANNEL_PARTNER),
          eq(users.isActive, true)
        ))
        .limit(1)
      
      if (!channelPartnerUser) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REFERRAL_CODE',
            message: 'Invalid or inactive referral code'
          }
        }, 400)
      }
      
      // Find channel partner record
      const [channelPartnerRecord] = await db
        .select()
        .from(channelPartners)
        .where(eq(channelPartners.userId, channelPartnerUser.id))
        .limit(1)
      
      if (channelPartnerRecord) {
        assignedChannelPartnerId = channelPartnerRecord.id
        channelPartnerUserId = channelPartnerUser.id
      }
    }
    
    // Create lead
    const [newLead] = await db.insert(leads).values({
      name: body.name,
      email: body.email || null,
      phone: body.phone,
      status: 'new',
      source: body.referralCode ? 'referral' : 'website',
      assignedChannelPartnerId: assignedChannelPartnerId || null,
      budget: body.budget?.toString() || null,
      notes: body.notes || null,
      metadata: body.referralCode || channelPartnerUserId ? {
        referralCode: body.referralCode || undefined,
        channelPartnerUserId: channelPartnerUserId || undefined,
        submittedFrom: 'website'
      } : null
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
    
    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit lead';
    
    return c.json({
      success: false,
      error: {
        code: 'LEAD_CREATION_ERROR',
        message: errorMessage
      }
    }, 500)
  }
})

// Protected endpoint - Get leads for current user
app.get('/', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found in context'
        }
      }, 401)
    }
    
    // If channel partner, get their assigned leads
    if (user.role === UserRole.CHANNEL_PARTNER) {
      // Get channel partner record for this user
      const [channelPartnerRecord] = await db
        .select()
        .from(channelPartners)
        .where(eq(channelPartners.userId, user.id))
        .limit(1)
      
      if (!channelPartnerRecord) {
        return c.json({
          success: true,
          data: {
            leads: [],
            total: 0
          }
        })
      }
      
      // Get leads assigned to this channel partner
      const userLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.assignedChannelPartnerId, channelPartnerRecord.id))
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
