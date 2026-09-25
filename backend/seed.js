import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { seedDemoData } from "./utils/demoData.js";

dotenv.config();

try {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo data is disabled in production.");
  if (!process.env.MONGO_URI)
    throw new Error(
      "No persistent demo database configured. Start the backend normally to use the temporary demo workspace.",
    );
  if (!process.argv.includes("--confirm-demo"))
    throw new Error(
      "This adds demo accounts with public passwords. Use npm run seed -- --confirm-demo only for a disposable development database.",
    );
  await connectDB();
  const { added, examples } = await seedDemoData();
  console.log(
    `Added ${added} of ${examples} example complaints. Existing data was preserved.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
