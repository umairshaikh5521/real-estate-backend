import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "../lib/response.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { paginationSchema, calculateOffset, uuidSchema } from "../lib/validation.js";

const app = new Hono();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  totalUnits: z.number().int().positive().default(0),
  availableUnits: z.number().int().min(0).default(0),
  priceRangeMin: z.string().optional().nullable(),
  priceRangeMax: z.string().optional().nullable(),
  images: z.any().optional().nullable(),
  documents: z.any().optional().nullable(),
  amenities: z.any().optional().nullable(),
});

const updateProjectSchema = createProjectSchema.partial();

// Get all projects
app.get(
  "/",
  requireAuth,
  zValidator("query", paginationSchema),
  async (c) => {
    try {
      const { page, limit } = c.req.valid("query");
      const offset = calculateOffset(page, limit);

      const [allProjects, countResult] = await Promise.all([
        db
          .select()
          .from(projects)
          .orderBy(desc(projects.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(projects),
      ]);

      const total = Number(countResult[0].count);

      return successResponse(c, allProjects, 200, {
        page,
        limit,
        total,
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      return errorResponse(c, "FETCH_ERROR", "Failed to fetch projects", 500);
    }
  }
);

// Get single project
app.get("/:id", requireAuth, zValidator("param", z.object({ id: uuidSchema })), async (c) => {
  try {
    const { id } = c.req.valid("param");

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project || project.length === 0) {
      return errorResponse(c, "NOT_FOUND", "Project not found", 404);
    }

    return successResponse(c, project[0]);
  } catch (error) {
    console.error("Error fetching project:", error);
    return errorResponse(c, "FETCH_ERROR", "Failed to fetch project", 500);
  }
});

// Create new project
app.post(
  "/",
  requireAuth,
  zValidator("json", createProjectSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const newProject = await db
        .insert(projects)
        .values({
          ...data,
          status: data.status || "planning",
        })
        .returning();

      return successResponse(c, newProject[0], 201);
    } catch (error) {
      console.error("Error creating project:", error);
      return errorResponse(c, "CREATE_ERROR", "Failed to create project", 500);
    }
  }
);

// Update project
app.put(
  "/:id",
  requireAuth,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateProjectSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      const updatedProject = await db
        .update(projects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!updatedProject || updatedProject.length === 0) {
        return errorResponse(c, "NOT_FOUND", "Project not found", 404);
      }

      return successResponse(c, updatedProject[0]);
    } catch (error) {
      console.error("Error updating project:", error);
      return errorResponse(c, "UPDATE_ERROR", "Failed to update project", 500);
    }
  }
);

// Delete project
app.delete(
  "/:id",
  requireAuth,
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    try {
      const { id } = c.req.valid("param");

      const deletedProject = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      if (!deletedProject || deletedProject.length === 0) {
        return errorResponse(c, "NOT_FOUND", "Project not found", 404);
      }

      return successResponse(c, { message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      return errorResponse(c, "DELETE_ERROR", "Failed to delete project", 500);
    }
  }
);

export default app;
