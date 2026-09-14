import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import InboxRead from "../models/InboxRead.js";
import { sendStatusChangeEmail } from "../utils/sendEmail.js";

const statuses = ["Pending", "In Progress", "Resolved"];
const priorities = ["Low", "Medium", "High"];
const categories = [
  "Hostel",
  "IT",
  "Faculty",
  "Infrastructure",
  "Library",
  "Canteen",
  "Campus",
  "Other",
];
export const ticketScope = (user) =>
  user.role === "student"
    ? { userId: user._id }
    : user.role === "faculty"
      ? { category: "Faculty", assignedFaculty: user._id }
      : {};
const allowed = (ticket, user) =>
  user.role === "admin" ||
  (user.role === "student" &&
    String(ticket.userId?._id || ticket.userId) === String(user._id)) ||
  (user.role === "faculty" &&
    ticket.category === "Faculty" &&
    String(ticket.assignedFaculty?._id || ticket.assignedFaculty) ===
      String(user._id));
const populate = (query) =>
  query
    .populate("userId", "name email role")
    .populate("assignedFaculty", "name email");
const fail = (res, error, message) =>
  res
    .status(
      error.name === "VersionError"
        ? 409
        : ["ValidationError", "CastError"].includes(error.name)
          ? 400
          : 500,
    )
    .json({
      message:
        error.name === "VersionError"
          ? "This ticket changed in another session. Refresh and try again."
          : error.name === "ValidationError"
            ? "Please check the ticket fields."
            : message,
    });
const record = (ticket, user, kind, summary) =>
  ticket.activity.push({
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    kind,
    summary,
  });
const validText = (value, max) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
async function findAccessible(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "Invalid ticket ID" });
    return null;
  }
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return null;
  }
  if (!allowed(ticket, req.user)) {
    res.status(403).json({ message: "Access denied" });
    return null;
  }
  return ticket;
}
async function validateFaculty(id) {
  return (
    mongoose.isValidObjectId(id) &&
    Boolean(await User.exists({ _id: id, role: "faculty" }))
  );
}

export const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      assignedFaculty,
      location = "",
    } = req.body;
    if (
      !validText(title, 160) ||
      !validText(description, 10000) ||
      !categories.includes(category) ||
      typeof location !== "string" ||
      location.length > 180
    )
      return res
        .status(400)
        .json({
          message:
            "A title, description, valid category, and location under 180 characters are required.",
        });
    if (category === "Faculty" && !(await validateFaculty(assignedFaculty)))
      return res
        .status(400)
        .json({
          message:
            "Please select a valid faculty member for Faculty complaints",
        });
    const ticket = new Ticket({
      title,
      description,
      category,
      location,
      userId: req.user._id,
      assignedFaculty: category === "Faculty" ? assignedFaculty : null,
      comments: [
        {
          message: "Ticket created successfully.",
          authorName: "System",
          authorRole: "admin",
        },
      ],
    });
    record(ticket, req.user, "created", "Created this request");
    await ticket.save();
    return res.status(201).json(await populate(Ticket.findById(ticket._id)));
  } catch (error) {
    return fail(res, error, "Failed to create ticket");
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, category, search, priority } = req.query;
    const query = ticketScope(req.user);
    for (const [key, value, values] of [
      ["status", status, statuses],
      ["category", category, categories],
      ["priority", priority, priorities],
    ]) {
      if (value && !values.includes(value))
        return res.status(400).json({ message: "Invalid " + key + " filter" });
      if (value && !(key === "category" && req.user.role === "faculty"))
        query[key] = value;
    }
    if (search) {
      if (typeof search !== "string" || search.length > 200)
        return res
          .status(400)
          .json({ message: "Search must be text of at most 200 characters" });
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = ["title", "description", "location"].map((field) => ({
        [field]: { $regex: escaped, $options: "i" },
      }));
    }
    return res.json(await populate(Ticket.find(query)).sort({ createdAt: -1 }));
  } catch (error) {
    return fail(res, error, "Failed to fetch tickets");
  }
};
export const getTicketById = async (req, res) => {
  try {
    const ticket = await findAccessible(req, res);
    if (ticket) res.json(await populate(Ticket.findById(ticket._id)));
  } catch (error) {
    return fail(res, error, "Failed to fetch ticket");
  }
};
export const updateTicket = async (req, res) => {
  try {
    const ticket = await findAccessible(req, res);
    if (!ticket) return;
    const student = req.user.role === "student";
    if (student && ticket.status === "Resolved")
      return res
        .status(400)
        .json({ message: "Resolved tickets cannot be edited by students" });
    const fields = student
      ? ["title", "description", "category", "location", "assignedFaculty"]
      : req.user.role === "faculty"
        ? ["status", "priority", "dueAt"]
        : [
            "status",
            "priority",
            "dueAt",
            "category",
            "assignedFaculty",
            "location",
          ];
    if (Object.keys(req.body).some((field) => !fields.includes(field)))
      return res
        .status(403)
        .json({ message: "You cannot change one or more of these fields" });
    const next = req.body;
    if (
      (next.title !== undefined && !validText(next.title, 160)) ||
      (next.description !== undefined && !validText(next.description, 10000)) ||
      (next.status !== undefined && !statuses.includes(next.status)) ||
      (next.priority !== undefined && !priorities.includes(next.priority)) ||
      (next.category !== undefined && !categories.includes(next.category)) ||
      (next.location !== undefined &&
        (typeof next.location !== "string" || next.location.length > 180)) ||
      (next.dueAt !== undefined &&
        next.dueAt !== null &&
        (typeof next.dueAt !== "string" ||
          Number.isNaN(Date.parse(next.dueAt))))
    )
      return res
        .status(400)
        .json({ message: "Please check the ticket fields" });
    const nextCategory = next.category ?? ticket.category;
    const nextFaculty =
      next.assignedFaculty === undefined
        ? ticket.assignedFaculty
        : next.assignedFaculty;
    if (nextCategory === "Faculty" && !(await validateFaculty(nextFaculty)))
      return res
        .status(400)
        .json({
          message: "Faculty complaints need a valid assigned faculty member",
        });
    const previousStatus = ticket.status;
    const changes = [];
    const labels = {
      dueAt: "Deadline",
      assignedFaculty: "Assigned faculty",
      location: "Location",
      title: "Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      status: "Status",
    };
    for (const field of fields) {
      if (next[field] === undefined) continue;
      const value =
        field === "dueAt"
          ? next[field]
            ? new Date(next[field])
            : null
          : next[field];
      if (String(ticket[field] ?? "") === String(value ?? "")) continue;
      const before = ticket[field];
      ticket[field] = value;
      changes.push(
        ["status", "priority", "category"].includes(field)
          ? labels[field] + ": " + before + " -> " + value
          : labels[field] + " updated",
      );
    }
    if (nextCategory !== "Faculty") ticket.assignedFaculty = null;
    if (ticket.status !== previousStatus)
      ticket.resolvedAt = ticket.status === "Resolved" ? new Date() : null;
    if (changes.length) {
      record(ticket, req.user, "updated", changes.join("; "));
      await ticket.save();
      if (ticket.status !== previousStatus) {
        const owner = await User.findById(ticket.userId).select("email");
        if (owner) {
          try {
            await sendStatusChangeEmail({
              to: owner.email,
              ticketTitle: ticket.title,
              status: ticket.status,
            });
          } catch (error) {
            console.warn(
              "Ticket saved, but optional status email failed:",
              error.code || "delivery error",
            );
          }
        }
      }
    }
    return res.json(await populate(Ticket.findById(ticket._id)));
  } catch (error) {
    return fail(res, error, "Failed to update ticket");
  }
};
export const addComment = async (req, res) => {
  try {
    const ticket = await findAccessible(req, res);
    if (!ticket) return;
    const { message } = req.body;
    if (!validText(message, 5000))
      return res
        .status(400)
        .json({ message: "A reply between 1 and 5000 characters is required" });
    ticket.comments.push({
      message: message.trim(),
      authorName: req.user.name,
      authorRole: req.user.role,
    });
    record(ticket, req.user, "comment", "Added a reply");
    await ticket.save();
    return res.json(await populate(Ticket.findById(ticket._id)));
  } catch (error) {
    return fail(res, error, "Failed to add comment");
  }
};
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await findAccessible(req, res);
    if (!ticket) return;
    if (req.user.role === "faculty")
      return res.status(403).json({ message: "Faculty cannot delete tickets" });
    await ticket.deleteOne();
    return res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return fail(res, error, "Failed to delete ticket");
  }
};
export const getAdminSummary = async (_req, res) => {
  try {
    const [totalTickets, pending, inProgress, resolved, totalUsers] =
      await Promise.all([
        Ticket.countDocuments(),
        Ticket.countDocuments({ status: "Pending" }),
        Ticket.countDocuments({ status: "In Progress" }),
        Ticket.countDocuments({ status: "Resolved" }),
        User.countDocuments({ role: "student" }),
      ]);
    return res.json({
      totalTickets,
      pending,
      inProgress,
      resolved,
      totalUsers,
    });
  } catch (error) {
    return fail(res, error, "Failed to fetch dashboard summary");
  }
};
export const getFacultyUsers = async (_req, res) => {
  try {
    return res.json(
      await User.find({ role: "faculty" })
        .select("name email")
        .sort({ name: 1 }),
    );
  } catch (error) {
    return fail(res, error, "Failed to fetch faculty list");
  }
};

// Scope is evaluated on every read, so reassigned/private tickets never leak through old inbox entries.
async function scopedEvents(
  user,
  { limit = 200, excludeSelf = false, ids } = {},
) {
  const eventMatch = {
    ...(excludeSelf ? { "activity.actorId": { $ne: user._id } } : {}),
    ...(ids
      ? {
          "activity._id": {
            $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
          },
        }
      : {}),
  };
  return Ticket.aggregate([
    { $match: ticketScope(user) },
    { $unwind: "$activity" },
    { $match: eventMatch },
    { $sort: { "activity.createdAt": -1, "activity._id": -1 } },
    { $limit: limit },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            "$activity",
            { ticketId: "$_id", ticketTitle: "$title", category: "$category" },
          ],
        },
      },
    },
  ]);
}
export const getActivity = async (req, res) => {
  try {
    res.json((await scopedEvents(req.user)).slice(0, 200));
  } catch (error) {
    return fail(res, error, "Failed to fetch activity");
  }
};
export const getInbox = async (req, res) => {
  try {
    const events = await scopedEvents(req.user, {
      limit: 100,
      excludeSelf: true,
    });
    const reads = await InboxRead.find({
      userId: req.user._id,
      eventId: { $in: events.map((e) => e._id) },
    }).select("eventId");
    const readIds = new Set(reads.map((read) => String(read.eventId)));
    res.json(
      events.map((event) => ({
        ...event,
        read: readIds.has(String(event._id)),
      })),
    );
  } catch (error) {
    return fail(res, error, "Failed to fetch inbox");
  }
};
export const markInboxRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > 100 ||
      ids.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))
    )
      return res
        .status(400)
        .json({ message: "Select between 1 and 100 valid inbox entries" });
    const visible = new Set(
      (await scopedEvents(req.user, { ids, limit: 100 })).map((event) =>
        String(event._id),
      ),
    );
    if (ids.some((id) => !visible.has(id)))
      return res.status(403).json({ message: "Access denied" });
    await InboxRead.bulkWrite(
      [...new Set(ids)].map((eventId) => ({
        updateOne: {
          filter: { userId: req.user._id, eventId },
          update: { $setOnInsert: { readAt: new Date() } },
          upsert: true,
        },
      })),
    );
    res.json({ message: "Inbox updated" });
  } catch (error) {
    return fail(res, error, "Failed to update inbox");
  }
};
