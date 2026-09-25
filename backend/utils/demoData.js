import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

const accounts = [
  {
    name: "Admin User",
    email: "admin@college.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Rahul Sharma",
    email: "rahul@student.com",
    password: "student123",
    role: "student",
  },
  {
    name: "Priya Verma",
    email: "priya@student.com",
    password: "student123",
    role: "student",
  },
  {
    name: "Dr. Meera Shah",
    email: "faculty@college.com",
    password: "faculty123",
    role: "faculty",
  },
];

const examples = [
  [
    "Wi-Fi drops during evening study hours",
    "IT",
    "In Progress",
    "High",
    "Hostel Block A, second floor",
    "The connection drops repeatedly between 7 and 10 PM, interrupting online classes and assignment uploads.",
    "The network team has isolated an overloaded access point and scheduled a replacement.",
  ],
  [
    "Water cooler leaking near room 204",
    "Hostel",
    "Pending",
    "High",
    "Hostel Block B, room 204",
    "Water is pooling beneath the drinking-water cooler. Please inspect the pipe connection and dry the walkway.",
    "",
  ],
  [
    "Projector flickering in Lecture Hall 3",
    "Infrastructure",
    "In Progress",
    "High",
    "Academic Block, Lecture Hall 3",
    "The projected image flickers every few minutes, making slides difficult to read during lectures.",
    "A technician is checking the HDMI cable and projector lamp.",
  ],
  [
    "Reading-room lights replaced",
    "Library",
    "Resolved",
    "Low",
    "Central Library, quiet study area",
    "Three ceiling lights above the reading desks were not working, leaving the area too dim for study.",
    "The lamps were replaced and the lighting was checked with the library team.",
  ],
  [
    "More frequent cleaning of canteen tables",
    "Canteen",
    "Resolved",
    "Medium",
    "Main Canteen, east seating area",
    "Tables remained uncleared after the lunch rush. Please add a cleaning round before afternoon classes.",
    "An additional post-lunch cleaning round is now included in the housekeeping schedule.",
  ],
  [
    "Request for feedback on programming assignment",
    "Faculty",
    "Pending",
    "Medium",
    "Computer Science Department",
    "I would appreciate a short feedback session to understand the marking and improve my next assignment.",
    "",
  ],
  [
    "Pathway lights switch off before library closing",
    "Campus",
    "In Progress",
    "High",
    "Walkway between library and Hostel C",
    "The pathway becomes dark before the library closes at 9 PM. Please check the timer and faulty lamps.",
    "The timer has been adjusted; two lamps are awaiting replacement.",
  ],
  [
    "Common-room ceiling fan making noise",
    "Hostel",
    "Pending",
    "Low",
    "Hostel Block C, common room",
    "The ceiling fan makes a rattling sound at higher speeds. Please inspect it before the next evening study session.",
    "",
  ],
  [
    "Library printer connection restored",
    "IT",
    "Resolved",
    "Medium",
    "Central Library, printing desk",
    "The shared printer was showing offline from the student computers, preventing students from printing notes.",
    "The print queue was cleared and the network connection restored. A test page printed successfully.",
  ],
  [
    "Bicycle parking signage needs updating",
    "Campus",
    "Pending",
    "Low",
    "North Gate bicycle stands",
    "The parking signs are faded, and bicycles are being left across the entrance. Please replace the signs.",
    "",
  ],
  [
    "Lab consultation session arranged",
    "Faculty",
    "Resolved",
    "Medium",
    "Physics Laboratory 2",
    "Could we arrange a consultation to review the experiment calculations before submitting the lab record?",
    "A consultation was held and the calculation steps were reviewed with the students.",
  ],
  [
    "Lost-and-found collection hours unclear",
    "Other",
    "In Progress",
    "Low",
    "Student Services Office",
    "The noticeboard and website list different collection hours. Please confirm the correct hours in both places.",
    "Student Services is updating the noticeboard and website with a single collection schedule.",
  ],
];

export async function seedDemoData({ now = new Date() } = {}) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo data is disabled in production.");

  // Refuse to repurpose an unrelated account that uses a demo email address.
  const existing = await User.find({
    email: { $in: accounts.map((a) => a.email) },
  });
  for (const user of existing) {
    const account = accounts.find((a) => a.email === user.email);
    if (
      user.role !== account.role ||
      !(await user.matchPassword(account.password))
    )
      throw new Error(
        `Demo account conflict: ${account.email}. Existing accounts were not changed.`,
      );
  }
  const users = [];
  for (const account of accounts)
    users.push(
      existing.find((u) => u.email === account.email) ||
        (await User.create(account)),
    );
  const [admin, rahul, priya, faculty] = users;
  await Ticket.init();
  let added = 0;
  const day = 86400000;
  for (const [index, example] of examples.entries()) {
    const [title, category, status, priority, location, description, reply] =
      example;
    const student = index % 3 === 1 ? priya : rahul;
    const responder = category === "Faculty" ? faculty : admin;
    const createdAt = new Date(now.getTime() - (index + 2) * day);
    const updatedAt = new Date(createdAt.getTime() + day);
    const comments = [
      {
        message: "Example complaint submitted for the Campusdesk demo.",
        authorName: student.name,
        authorRole: student.role,
        createdAt,
      },
    ];
    const activity = [
      {
        actorId: student._id,
        actorName: student.name,
        actorRole: student.role,
        kind: "created",
        summary: "Submitted a demo complaint",
        createdAt,
      },
    ];
    if (reply) {
      comments.push({
        message: reply,
        authorName: responder.name,
        authorRole: responder.role,
        createdAt: updatedAt,
      });
      activity.push({
        actorId: responder._id,
        actorName: responder.name,
        actorRole: responder.role,
        kind: "updated",
        summary: `Status changed: Pending -> ${status}`,
        createdAt: updatedAt,
      });
      activity.push({
        actorId: responder._id,
        actorName: responder.name,
        actorRole: responder.role,
        kind: "comment",
        summary: "Added a demo support update",
        createdAt: updatedAt,
      });
    }
    const result = await Ticket.updateOne(
      { demoKey: `campusdesk-example-v1-${index + 1}` },
      {
        $setOnInsert: {
          title,
          category,
          status,
          priority,
          location,
          description: `[Demo example] ${description}`,
          userId: student._id,
          assignedFaculty: category === "Faculty" ? faculty._id : null,
          dueAt:
            status === "Resolved"
              ? new Date(updatedAt.getTime() + day)
              : new Date(now.getTime() + (priority === "High" ? -1 : 3) * day),
          resolvedAt: status === "Resolved" ? updatedAt : null,
          comments,
          activity,
          createdAt,
          updatedAt: reply ? updatedAt : createdAt,
        },
      },
      { upsert: true, runValidators: true, timestamps: false },
    );
    added += result.upsertedCount;
  }
  return { added, examples: examples.length };
}
