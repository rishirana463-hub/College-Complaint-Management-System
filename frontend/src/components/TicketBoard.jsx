import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  CalendarClock,
  GripVertical,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { statuses, isOverdue, ageLabel } from "../lib/tickets";
import { dateLabel, ticketCode } from "../lib/navigation";
export default function TicketBoard({ tickets, canManage, onMove, busy }) {
  const [target, setTarget] = useState("");
  return (
    <div className="kanban-board" aria-label="Ticket board">
      {statuses.map((status, index) => {
        const items = tickets.filter((t) => t.status === status);
        return (
          <section
            key={status}
            className={
              "kanban-column stage-" +
              index +
              (target === status ? " drop-target" : "")
            }
            aria-label={status + " column"}
            onDragOver={(e) => {
              if (canManage && !busy) {
                e.preventDefault();
                setTarget(status);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setTarget("");
            }}
            onDrop={(e) => {
              e.preventDefault();
              setTarget("");
              const id = e.dataTransfer.getData("text/plain");
              if (
                canManage &&
                !busy &&
                tickets.some((t) => t._id === id && t.status !== status)
              )
                onMove(id, status);
            }}
          >
            <header>
              <span className="stage-dot" />
              <h2>{status}</h2>
              <span className="count-pill">{items.length}</span>
            </header>
            <div className="kanban-cards">
              {items.map((ticket) => (
                <article
                  key={ticket._id}
                  className="board-ticket"
                  draggable={canManage && !busy}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", ticket._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setTarget("")}
                >
                  <div className="board-card-top">
                    <span>{ticketCode(ticket._id)}</span>
                    {canManage && <GripVertical size={15} aria-hidden="true" />}
                  </div>
                  <Link to={"/tickets/" + ticket._id} className="board-title">
                    {ticket.title}
                    <ArrowUpRight size={15} />
                  </Link>
                  <p className="board-excerpt">{ticket.description}</p>
                  <div className="board-tags">
                    <span className="subtle-tag">
                      {ticket.category === "Faculty" && (
                        <LockKeyhole size={11} />
                      )}{" "}
                      {ticket.category}
                    </span>
                    <StatusBadge value={ticket.priority} type="priority" />
                  </div>
                  {ticket.dueAt && (
                    <p
                      className={
                        "board-due " + (isOverdue(ticket) ? "overdue" : "")
                      }
                    >
                      <CalendarClock size={13} />
                      {isOverdue(ticket) ? "Overdue" : "Due"}{" "}
                      {dateLabel(ticket.dueAt)}
                    </p>
                  )}
                  <footer>
                    <span>
                      {ticket.userId?.name?.split(" ")[0] || "Student"}{" "}
                      <small>/ {ageLabel(ticket.createdAt)}</small>
                    </span>
                    <span>
                      <MessageSquare size={13} />
                      {ticket.comments?.length || 0}
                    </span>
                  </footer>
                  {canManage && (
                    <label className="board-move">
                      <span className="sr-only">Move {ticket.title}</span>
                      <select
                        aria-label={"Move " + ticket.title}
                        value={ticket.status}
                        disabled={Boolean(busy)}
                        onChange={(e) => onMove(ticket._id, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </article>
              ))}
              {!items.length && (
                <div className="board-empty">
                  {canManage
                    ? "Drop a ticket here, or use its status menu."
                    : "No requests in this stage."}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
