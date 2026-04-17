import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB, { stopMemoryServer } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import bootstrapData from "./utils/bootstrapData.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "College Complaint & Ticket Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await bootstrapData();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

process.on("SIGINT", async () => {
  await stopMemoryServer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopMemoryServer();
  process.exit(0);
});

startServer();
