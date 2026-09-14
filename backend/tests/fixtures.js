import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
export async function seedTestWorkspace() {
  const [student, admin, faculty, otherFaculty] = await User.create([
    {
      name: "Rahul Sharma",
      email: "rahul@test.college",
      password: "student123",
      role: "student",
    },
    {
      name: "Ananya Mehta",
      email: "admin@test.college",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Dr. Priya Kapoor",
      email: "faculty@test.college",
      password: "faculty123",
      role: "faculty",
    },
    {
      name: "Dr. Arjun Rao",
      email: "other@test.college",
      password: "faculty123",
      role: "faculty",
    },
  ]);
  const examples = [
    [
      "Wi-Fi connectivity in Hostel Block A",
      "IT",
      "In Progress",
      "High",
      "The connection drops during evening study hours on the second floor.",
    ],
    [
      "Water cooler needs maintenance",
      "Hostel",
      "Pending",
      "Medium",
      "The water cooler near room 204 has been leaking since Monday.",
    ],
    [
      "Library reading room lighting",
      "Library",
      "Resolved",
      "Low",
      "Three lights above the quiet study area are not working.",
    ],
    [
      "Projector display in Lecture Hall 3",
      "Infrastructure",
      "In Progress",
      "High",
      "The projector display flickers and makes lecture slides difficult to read.",
    ],
    [
      "Canteen seating area cleanliness",
      "Canteen",
      "Resolved",
      "Medium",
      "The tables near the east entrance need more frequent cleaning.",
    ],
    [
      "Request for assignment feedback",
      "Faculty",
      "Pending",
      "Medium",
      "Could we review the feedback on the recent assignment?",
    ],
    [
      "Pathway lighting near the library",
      "Campus",
      "Resolved",
      "Low",
      "The pathway lights switch off before the library closes.",
    ],
    [
      "Hostel common room fan",
      "Hostel",
      "Pending",
      "Low",
      "The ceiling fan in the common room makes a loud noise.",
    ],
  ];
  const tickets = await Ticket.create(
    examples.map(([title, category, status, priority, description], index) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(index / 2));
      return {
        title,
        category,
        status,
        priority,
        description,
        userId: student._id,
        assignedFaculty: category === "Faculty" ? faculty._id : null,
        createdAt: date,
        updatedAt: date,
        comments: [
          {
            message: "Ticket submitted. Thanks for taking a look.",
            authorName: student.name,
            authorRole: "student",
            createdAt: date,
          },
          ...(status !== "Pending"
            ? [
                {
                  message:
                    status === "Resolved"
                      ? "The team has addressed this issue. Thank you for reporting it."
                      : "The support team is looking into this. We'll share an update soon.",
                  authorName: admin.name,
                  authorRole: "admin",
                  createdAt: new Date(),
                },
              ]
            : []),
        ],
      };
    }),
  );
  return { student, admin, faculty, otherFaculty, tickets };
}
