import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

const bootstrapData = async () => {
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0) {
    return;
  }

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

  console.log("Demo data bootstrapped");
};

export default bootstrapData;
