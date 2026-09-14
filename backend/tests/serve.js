import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { seedTestWorkspace } from "./fixtures.js";
process.env.JWT_SECRET = "isolated-browser-test-secret-at-least-32-characters";
process.env.EMAIL_ENABLED = "false";
process.env.CLIENT_URL = "http://127.0.0.1:4173,http://127.0.0.1:4174";
const memory = await MongoMemoryServer.create();
await mongoose.connect(memory.getUri("campusdesk-browser-tests"));
await seedTestWorkspace();
const server = createApp().listen(5101, "127.0.0.1", () =>
  console.log("Isolated test API ready on 5101"),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  await memory.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
