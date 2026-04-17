import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Ticket from "./models/Ticket.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    await Ticket.deleteMany();
    await User.deleteMany();

    const [admin, studentOne, studentTwo] = await User.create([
      { name: "Admin User", email: "admin@college.com", password: "admin123", role: "admin" },
      { name: "Rahul Sharma", email: "rahul@student.com", password: "student123", role: "student" },
      { name: "Priya Verma", email: "priya@student.com", password: "student123", role: "student" }
    ]);

    await Ticket.create([
      {
        title: "Wi-Fi not working in Hostel Block A",
        description: "Internet connectivity has been down for two days on the second floor.",
        status: "In Progress",
        category: "IT",
        priority: "High",
        userId: studentOne._id,
        comments: [
          { message: "Reported by student.", authorName: studentOne.name, authorRole: "student" },
          { message: "Network team has been assigned.", authorName: admin.name, authorRole: "admin" }
        ],
      },
      {
        title: "Broken classroom projector",
        description: "Projector in Lecture Hall 3 flickers continuously during classes.",
        status: "Pending",
        category: "Infrastructure",
        priority: "Medium",
        userId: studentTwo._id,
        comments: [{ message: "Need this fixed before next week.", authorName: studentTwo.name, authorRole: "student" }],
      },
    ]);

    console.log("Seed data inserted successfully");
    console.log("Admin login: admin@college.com / admin123");
    console.log("Student login: rahul@student.com / student123");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedData();
