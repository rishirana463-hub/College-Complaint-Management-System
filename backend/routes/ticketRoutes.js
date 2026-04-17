import express from "express";
import {
  addComment,
  createTicket,
  deleteTicket,
  getAdminSummary,
  getFacultyUsers,
  getTicketById,
  getTickets,
  updateTicket,
} from "../controllers/ticketController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getTickets);
router.post("/", authorize("student", "admin"), createTicket);
router.get("/summary/admin", authorize("admin"), getAdminSummary);
router.get("/faculty-users", authorize("student", "admin"), getFacultyUsers);
router.get("/:id", getTicketById);
router.put("/:id", updateTicket);
router.post("/:id/comments", addComment);
router.delete("/:id", deleteTicket);

export default router;
