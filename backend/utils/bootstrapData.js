import { seedDemoData } from "./demoData.js";

export default async function bootstrapData() {
  // Demo credentials and sample complaints belong only in temporary local storage.
  if (process.env.MONGO_URI || process.env.NODE_ENV === "production") return;
  const { added } = await seedDemoData();
  console.log(`Demo workspace ready: ${added} example complaints added.`);
}
