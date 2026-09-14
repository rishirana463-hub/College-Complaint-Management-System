import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (process.env.CLIENT_URL || "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim()),
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.get("/", (_req, res) =>
    res.json({
      message: "College Complaint & Ticket Management API is running",
    }),
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use((req, res) =>
    res.status(404).json({ message: "Route not found: " + req.path }),
  );
  app.use((error, _req, res, _next) =>
    res
      .status(error.status || 500)
      .json({
        message:
          error.type === "entity.parse.failed"
            ? "Invalid request data."
            : "The request could not be processed.",
      }),
  );
  return app;
}
