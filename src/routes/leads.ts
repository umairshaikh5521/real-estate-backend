import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, leads } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "../lib/response";
import { authMiddleware } from "../middleware/auth";
import { paginationSchema, calculateOffset, uuidSchema } from "../lib/validation";

const app = new Hono();

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  status: z.string().optional(),
  source: z.string().optional(),
  assignedAgentId: z.string().uuid().optional().nullable(),
  projectInterestId: z.string().uuid().optional().nullable(),
  budget: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema.partial();

// Get all leads with pagination
app.get(
  "/",
  authMiddleware,
  zValidator("query", paginationSchema),
  async (c) => {
    try {
      const { page, limit } = c.req.valid("query");
      const offset = calculateOffset(page, limit);

      const [allLeads, countResult] = await Promise.all([
        db
          .select()
          .from(leads)
          .orderBy(desc(leads.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(leads),
      ]);

      const total = Number(countResult[0].count);

      return successResponse(c, allLeads, 200, {
        page,
        limit,
        total,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      return errorResponse(c, "FETCH_ERROR", "Failed to fetch leads", 500);
    }
  }
);

// Get single lead
app.get("/:id", authMiddleware, zValidator("param", z.object({ id: uuidSchema })), async (c) => {
  try {
    const { id } = c.req.valid("param");

    const lead = await db.select().from(leads).where(eq(leads.id, id)).limit(1);

    if (!lead || lead.length === 0) {
      return errorResponse(c, "NOT_FOUND", "Lead not found", 404);
    }

    return successResponse(c, lead[0]);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return errorResponse(c, "FETCH_ERROR", "Failed to fetch lead", 500);
  }
});

// Create new lead
app.post(
  "/",
  authMiddleware,
  zValidator("json", createLeadSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const newLead = await db
        .insert(leads)
        .values({
          ...data,
          status: data.status || "new",
        })
        .returning();

      return successResponse(c, newLead[0], 201);
    } catch (error) {
      console.error("Error creating lead:", error);
      return errorResponse(c, "CREATE_ERROR", "Failed to create lead", 500);
    }
  }
);

// Update lead
app.put(
  "/:id",
  authMiddleware,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateLeadSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      const updatedLead = await db
        .update(leads)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();

      if (!updatedLead || updatedLead.length === 0) {
        return errorResponse(c, "NOT_FOUND", "Lead not found", 404);
      }

      return successResponse(c, updatedLead[0]);
    } catch (error) {
      console.error("Error updating lead:", error);
      return errorResponse(c, "UPDATE_ERROR", "Failed to update lead", 500);
    }
  }
);

// Delete lead
app.delete(
  "/:id",
  authMiddleware,
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    try {
      const { id } = c.req.valid("param");

      const deletedLead = await db
        .delete(leads)
        .where(eq(leads.id, id))
        .returning();

      if (!deletedLead || deletedLead.length === 0) {
        return errorResponse(c, "NOT_FOUND", "Lead not found", 404);
      }

      return successResponse(c, { message: "Lead deleted successfully" });
    } catch (error) {
      console.error("Error deleting lead:", error);
      return errorResponse(c, "DELETE_ERROR", "Failed to delete lead", 500);
    }
  }
);

export default app;
