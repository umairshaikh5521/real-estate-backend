import { Hono } from "hono";
import { serve } from "@hono/node-server";
import * as dotenv from "dotenv";
import { corsMiddleware } from "./middleware/cors";
import { loggerMiddleware } from "./middleware/logger";
import { errorHandler } from "./middleware/error-handler";
import routes from "./routes";

// Load environment variables
dotenv.config();

// Create Hono app
const app = new Hono();

// Global middleware
app.use("*", corsMiddleware);
app.use("*", loggerMiddleware);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      message: "Real Estate CRM/ERP API",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      endpoints: {
        health: "/api/health",
        leads: "/api/leads",
        projects: "/api/projects",
        bookings: "/api/bookings (coming soon)",
        agents: "/api/agents (coming soon)",
        units: "/api/units (coming soon)",
      },
    },
  });
});

// Mount API routes
app.route("/api", routes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404
  );
});

// Error handler
app.onError(errorHandler);

// Start server (for local development)
if (process.env.NODE_ENV !== "production") {
  const port = parseInt(process.env.PORT || "8000");
  console.log(`🚀 Server starting on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

// Export for Vercel
export default app;
