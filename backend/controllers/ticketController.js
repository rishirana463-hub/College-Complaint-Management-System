import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { sendStatusChangeEmail } from "../utils/sendEmail.js";

// Categories that are "public" — visible to all within their role scope
const PUBLIC_CATEGORIES = ["Hostel", "IT", "Infrastructure", "Library", "Canteen", "Campus", "Other"];

export const createTicket = async (req, res) => {
  try {
    const { title, description, category, assignedFaculty } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required" });
    }

    // If category is Faculty, assignedFaculty must be provided
    if (category === "Faculty" && !assignedFaculty) {
      return res.status(400).json({ message: "Please select a faculty member for Faculty complaints" });
    }

    // Validate assignedFaculty is actually a faculty user
    if (category === "Faculty" && assignedFaculty) {
      const facultyUser = await User.findById(assignedFaculty);
      if (!facultyUser || facultyUser.role !== "faculty") {
        return res.status(400).json({ message: "Invalid faculty member selected" });
      }
    }

    const ticket = await Ticket.create({
      title,
      description,
      category,
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

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("userId", "name email role")
      .populate("assignedFaculty", "name email");
    return res.status(201).json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create ticket", error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, category, search, priority } = req.query;
    const query = {};

    // --- Role-based visibility ---
    if (req.user.role === "student") {
      // Students only see their own tickets
      query.userId = req.user._id;
    } else if (req.user.role === "faculty") {
      // Faculty see only Faculty-category tickets assigned to them
      query.category = "Faculty";
      query.assignedFaculty = req.user._id;
    }
    // admin sees everything — no restrictions

    // Apply optional filters on top of role restrictions
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Category filter: for faculty role this is already locked to "Faculty"
    if (category && req.user.role !== "faculty") query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("userId", "name email role")
      .populate("assignedFaculty", "name email")
      .sort({ createdAt: -1 });

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("userId", "name email role")
      .populate("assignedFaculty", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Access rules
    if (req.user.role === "student" && ticket.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "faculty" &&
      (ticket.category !== "Faculty" || ticket.assignedFaculty?._id?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch ticket", error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("userId", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const previousStatus = ticket.status;
    const { status, priority, category, title, description } = req.body;

    if (req.user.role === "student") {
      if (ticket.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (ticket.status === "Resolved") {
        return res.status(400).json({ message: "Resolved tickets cannot be edited by students" });
      }

      ticket.title = title ?? ticket.title;
      ticket.description = description ?? ticket.description;
      ticket.category = category ?? ticket.category;
    } else if (req.user.role === "faculty") {
      // Faculty can only update status/priority on their assigned Faculty tickets
      if (ticket.category !== "Faculty" || ticket.assignedFaculty?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      ticket.status = status ?? ticket.status;
      ticket.priority = priority ?? ticket.priority;
    } else {
      // admin
      ticket.status = status ?? ticket.status;
      ticket.priority = priority ?? ticket.priority;
      ticket.category = category ?? ticket.category;
    }

    await ticket.save();

    if (ticket.status !== previousStatus) {
      await sendStatusChangeEmail({
        to: ticket.userId.email,
        ticketTitle: ticket.title,
        status: ticket.status,
      });
    }

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("userId", "name email role")
      .populate("assignedFaculty", "name email");
    return res.json(updatedTicket);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update ticket", error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate("userId", "name email role");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!message?.trim()) {
      return res.status(400).json({ message: "Comment message is required" });
    }

    // Access check
    if (req.user.role === "student" && ticket.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "faculty" &&
      (ticket.category !== "Faculty" || ticket.assignedFaculty?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    ticket.comments.push({
      message,
      authorName: req.user.name,
      authorRole: req.user.role,
    });

    await ticket.save();
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("userId", "name email role")
      .populate("assignedFaculty", "name email");
    return res.json(updatedTicket);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (req.user.role === "student" && ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Faculty cannot delete tickets
    if (req.user.role === "faculty") {
      return res.status(403).json({ message: "Faculty cannot delete tickets" });
    }

    await ticket.deleteOne();
    return res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete ticket", error: error.message });
  }
};

export const getAdminSummary = async (_req, res) => {
  try {
    const [totalTickets, pending, inProgress, resolved, totalUsers] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "Pending" }),
      Ticket.countDocuments({ status: "In Progress" }),
      Ticket.countDocuments({ status: "Resolved" }),
      User.countDocuments({ role: "student" }),
    ]);

    return res.json({ totalTickets, pending, inProgress, resolved, totalUsers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
};

// Get all faculty users (for student dropdown when submitting a Faculty ticket)
export const getFacultyUsers = async (req, res) => {
  try {
    const facultyList = await User.find({ role: "faculty" }).select("name email").sort({ name: 1 });
    return res.json(facultyList);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch faculty list", error: error.message });
  }
};
