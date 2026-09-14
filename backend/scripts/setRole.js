import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
const [email, role] = process.argv.slice(2);
if (
  !email ||
  !["student", "faculty", "admin"].includes(role) ||
  !process.env.MONGO_URI
) {
  console.error(
    "Usage: npm run set-role -- person@college.edu student|faculty|admin (requires MONGO_URI)",
  );
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { role },
      { new: true, runValidators: true },
    );
    if (!user)
      throw new Error("No account found. Ask this person to register first.");
    console.log(
      "Updated " +
        user.email +
        " to " +
        user.role +
        ". Their next session refresh will use the new role.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
