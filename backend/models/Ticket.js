import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["student", "admin", "faculty"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    demoKey: { type: String, unique: true, sparse: true },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    category: {
      type: String,
      enum: [
        "Hostel",
        "IT",
        "Faculty",
        "Infrastructure",
        "Library",
        "Canteen",
        "Campus",
        "Other",
      ],
      required: true,
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [commentSchema],
    location: { type: String, trim: true, maxlength: 180, default: "" },
    dueAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    activity: [
      {
        actorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        actorName: { type: String, required: true },
        actorRole: {
          type: String,
          enum: ["student", "admin", "faculty"],
          required: true,
        },
        kind: {
          type: String,
          enum: ["created", "updated", "comment"],
          required: true,
        },
        summary: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ category: 1, assignedFaculty: 1, createdAt: -1 });
export default mongoose.model("Ticket", ticketSchema);
