import { Hono } from "hono";
import authRouter from "./auth";
import leadsRouter from "./leads";
import projectsRouter from "./projects";

const app = new Hono();

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Mount auth routes
app.route("/auth", authRouter);

// Mount route modules (these will need authentication)
app.route("/leads", leadsRouter);
app.route("/projects", projectsRouter);

// TODO: Add more routes
// app.route("/bookings", bookingsRouter);
// app.route("/agents", agentsRouter);
// app.route("/units", unitsRouter);
// app.route("/payments", paymentsRouter);

export default app;
