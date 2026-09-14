import dotenv from "dotenv";
import connectDB, { stopMemoryServer } from "./config/db.js";
import bootstrapData from "./utils/bootstrapData.js";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();

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
