import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/index.js'
import { leads, users, channelPartners, followUps, activities } from '../db/schema.js'
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

const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'converted', 'lost']).optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
})

const createFollowUpSchema = z.object({
  scheduledAt: z.string(), // ISO date string
  type: z.enum(['call', 'meeting', 'email', 'whatsapp']),
  notes: z.string().optional(),
  reminder: z.boolean().optional(),
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

// Update lead
app.put('/:id', requireAuth, zValidator('json', updateLeadSchema), async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const body = c.req.valid('json')
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      }, 401)
    }
    
    // Check if lead exists
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1)
    
    if (!existingLead) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lead not found'
        }
      }, 404)
    }
    
    // Track what changed for activity log
    const changes: string[] = []
    if (body.status && body.status !== existingLead.status) {
      changes.push(`Status changed from ${existingLead.status} to ${body.status}`)
    }
    if (body.notes && body.notes !== existingLead.notes) {
      changes.push('Notes updated')
    }
    
    // Update lead
    const [updatedLead] = await db
      .update(leads)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(leads.id, id))
      .returning()
    
    // Log activity
    if (changes.length > 0) {
      await db.insert(activities).values({
        entityType: 'lead',
        entityId: id,
        userId: user.id,
        activityType: 'lead_updated',
        description: changes.join(', '),
        metadata: { changes: body }
      })
    }
    
    return c.json({
      success: true,
      data: {
        lead: updatedLead,
        message: 'Lead updated successfully'
      }
    })
    
  } catch (error: unknown) {
    console.error('Update lead error:', error)
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update lead'
      }
    }, 500)
  }
})

// Create follow-up for a lead
app.post('/:id/follow-ups', requireAuth, zValidator('json', createFollowUpSchema), async (c) => {
  try {
    const leadId = c.req.param('id')
    const user = c.get('user')
    const body = c.req.valid('json')
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      }, 401)
    }
    
    // Check if lead exists
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
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
    
    // Create follow-up
    const [newFollowUp] = await db.insert(followUps).values({
      leadId,
      userId: user.id,
      scheduledAt: new Date(body.scheduledAt),
      type: body.type,
      notes: body.notes || null,
      reminder: body.reminder !== false,
      status: 'pending'
    }).returning()
    
    // Log activity
    await db.insert(activities).values({
      entityType: 'lead',
      entityId: leadId,
      userId: user.id,
      activityType: 'follow_up_scheduled',
      description: `Follow-up ${body.type} scheduled for ${new Date(body.scheduledAt).toLocaleString()}`,
      metadata: { followUpId: newFollowUp.id, type: body.type }
    })
    
    return c.json({
      success: true,
      data: {
        followUp: newFollowUp,
        message: 'Follow-up scheduled successfully'
      }
    }, 201)
    
  } catch (error: unknown) {
    console.error('Create follow-up error:', error)
    return c.json({
      success: false,
      error: {
        code: 'FOLLOW_UP_ERROR',
        message: 'Failed to create follow-up'
      }
    }, 500)
  }
})

// Get follow-ups for a lead
app.get('/:id/follow-ups', requireAuth, async (c) => {
  try {
    const leadId = c.req.param('id')
    
    const leadFollowUps = await db
      .select()
      .from(followUps)
      .where(eq(followUps.leadId, leadId))
      .orderBy(desc(followUps.scheduledAt))
    
    return c.json({
      success: true,
      data: {
        followUps: leadFollowUps,
        total: leadFollowUps.length
      }
    })
    
  } catch (error: unknown) {
    console.error('Get follow-ups error:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch follow-ups'
      }
    }, 500)
  }
})

// Update follow-up (mark as complete)
app.put('/follow-ups/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const body = await c.req.json()
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      }, 401)
    }
    
    const [updatedFollowUp] = await db
      .update(followUps)
      .set({
        status: body.status || 'completed',
        completedAt: new Date(),
        notes: body.notes || undefined,
        updatedAt: new Date()
      })
      .where(eq(followUps.id, id))
      .returning()
    
    // Log activity
    if (updatedFollowUp) {
      await db.insert(activities).values({
        entityType: 'lead',
        entityId: updatedFollowUp.leadId,
        userId: user.id,
        activityType: 'follow_up_completed',
        description: `Follow-up ${updatedFollowUp.type} completed`,
        metadata: { followUpId: updatedFollowUp.id }
      })
    }
    
    return c.json({
      success: true,
      data: {
        followUp: updatedFollowUp,
        message: 'Follow-up updated successfully'
      }
    })
    
  } catch (error: unknown) {
    console.error('Update follow-up error:', error)
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update follow-up'
      }
    }, 500)
  }
})

// Get activities for a lead
app.get('/:id/activities', requireAuth, async (c) => {
  try {
    const leadId = c.req.param('id')
    
    const leadActivities = await db
      .select({
        id: activities.id,
        activityType: activities.activityType,
        description: activities.description,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email
        }
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(and(
        eq(activities.entityType, 'lead'),
        eq(activities.entityId, leadId)
      ))
      .orderBy(desc(activities.createdAt))
    
    return c.json({
      success: true,
      data: {
        activities: leadActivities,
        total: leadActivities.length
      }
    })
    
  } catch (error: unknown) {
    console.error('Get activities error:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch activities'
      }
    }, 500)
  }
})

export default app
