import { z } from "zod";

// Common validation schemas
export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Calculate offset from page number
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};
