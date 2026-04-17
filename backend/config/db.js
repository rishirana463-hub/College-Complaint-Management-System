import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
      return;
    }

    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri("college-complaint-system");
    await mongoose.connect(memoryUri);
    console.log("MongoDB memory server connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
export const stopMemoryServer = async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
};
