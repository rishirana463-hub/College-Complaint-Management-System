import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  LockKeyhole,
  MessageSquare,
  CalendarDays,
  UserRound,
  Tag,
  ShieldCheck,
  MapPin,
  History,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useResource from "../hooks/useResource";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { EmptyState, ErrorState, Skeleton } from "../components/States";
import { dateLabel, ticketCode } from "../lib/navigation";
import { isOverdue } from "../lib/tickets";
export default function TicketDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { notify } = useToast();
  const {
    data: ticket,
    error,
    loading,
    reload,
  } = useResource("/tickets/" + id);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [mutationError, setMutationError] = useState("");
  const reduced = useReducedMotion();
  const canManage =
    auth.user.role === "admin" ||
    (auth.user.role === "faculty" &&
      ticket?.category === "Faculty" &&
      ticket.assignedFaculty?._id === (auth.user._id || auth.user.id));
  const update = async (field, value) => {
    setBusy(field);
    setMutationError("");
    try {
      await api.put("/tickets/" + id, { [field]: value });
      notify(
        field === "status"
          ? "Ticket status updated."
          : field === "dueAt"
            ? "Ticket deadline updated."
            : "Ticket priority updated.",
      );
      reload();
    } catch (err) {
      const text =
        err.response?.data?.message ||
        "Your change wasn't saved. Please try again.";
      setMutationError(text);
      notify(text, "error");
    } finally {
      setBusy("");
    }
  };
  const send = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy("comment");
    setMutationError("");
    try {
      await api.post("/tickets/" + id + "/comments", {
        message: message.trim(),
      });
      setMessage("");
      notify("Your reply has been added.");
      reload();
    } catch (err) {
      const text =
        err.response?.data?.message ||
        "Your reply wasn't sent. Your draft is still here.";
      setMutationError(text);
      notify(text, "error");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="page-stack">
      <Link className="text-link back-link" to="/tickets">
        <ArrowLeft size={16} />
        Back to tickets
      </Link>
      {loading ? (
        <Skeleton variant="detail" />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <>
          <PageHeader
            eyebrow={ticketCode(ticket._id)}
            title={ticket.title}
            subtitle={
              "Submitted on " +
              new Date(ticket.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }
            actions={<StatusBadge value={ticket.status} />}
          />
          <div className="detail-grid">
            <div className="page-stack">
              <section className="panel panel-padding">
                <div className="section-title">
                  <Tag size={18} />
                  <h2>About this request</h2>
                </div>
                <p className="ticket-description">{ticket.description}</p>
                {ticket.location && (
                  <p className="board-due">
                    <MapPin size={15} />
                    {ticket.location}
                  </p>
                )}
                {ticket.category === "Faculty" && (
                  <div className="info-box">
                    <LockKeyhole size={18} />
                    <p>
                      This private complaint is visible to its author, the
                      assigned faculty member, and administrators.
                    </p>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Conversation{" "}
                      <span className="count-pill">
                        {ticket.comments?.length || 0}
                      </span>
                    </h2>
                    <p>Keep everyone in the loop.</p>
                  </div>
                  <MessageSquare size={19} />
                </div>
                <div className="conversation-list">
                  {ticket.comments?.length ? (
                    ticket.comments.map((comment, index) => (
                      <motion.article
                        key={index}
                        className="comment"
                        initial={reduced ? false : { opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="activity-avatar">
                          {comment.authorName.slice(0, 1)}
                        </span>
                        <div>
                          <div className="comment-heading">
                            <strong>{comment.authorName}</strong>
                            <span className="role-label">
                              {comment.authorRole}
                            </span>
                            <time dateTime={comment.createdAt}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p>{comment.message}</p>
                        </div>
                      </motion.article>
                    ))
                  ) : (
                    <EmptyState
                      compact
                      title="Start the conversation"
                      description="Add a detail or ask a question to help this request move forward."
                    />
                  )}
                </div>
                <form onSubmit={send} className="reply-form">
                  <label htmlFor="reply">Add a reply</label>
                  <textarea
                    id="reply"
                    className="input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share an update or add more context..."
                    required
                    maxLength={5000}
                    rows={3}
                    disabled={busy === "comment"}
                  />
                  <div className="reply-footer">
                    <small>Be clear, constructive, and kind.</small>
                    <button
                      className="btn-primary"
                      disabled={Boolean(busy) || !message.trim()}
                    >
                      <Send size={16} />
                      {busy === "comment" ? "Sending..." : "Send reply"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
            <aside className="page-stack">
              <section className="panel panel-padding">
                <h2>Ticket details</h2>
                <dl className="ticket-properties">
                  <div>
                    <dt>
                      <CalendarDays size={15} />
                      Deadline
                    </dt>
                    <dd className={isOverdue(ticket) ? "overdue" : ""}>
                      {ticket.dueAt
                        ? new Date(ticket.dueAt).toLocaleString()
                        : "Not set"}
                      {isOverdue(ticket) ? " (overdue)" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <UserRound size={15} />
                      Raised by
                    </dt>
                    <dd>{ticket.userId?.name || "Deleted user"}</dd>
                  </div>
                  <div>
                    <dt>
                      <Tag size={15} />
                      Category
                    </dt>
                    <dd>{ticket.category}</dd>
                  </div>
                  <div>
                    <dt>
                      <CalendarDays size={15} />
                      Last updated
                    </dt>
                    <dd>{dateLabel(ticket.updatedAt)}</dd>
                  </div>
                  {ticket.assignedFaculty && (
                    <div>
                      <dt>
                        <ShieldCheck size={15} />
                        Assigned faculty
                      </dt>
                      <dd>{ticket.assignedFaculty.name}</dd>
                    </div>
                  )}
                </dl>
                {canManage ? (
                  <div className="management-fields">
                    <label>
                      Status
                      <select
                        className="input"
                        value={ticket.status}
                        disabled={Boolean(busy)}
                        onChange={(e) => update("status", e.target.value)}
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                      </select>
                    </label>
                    <label>
                      Priority
                      <select
                        className="input"
                        value={ticket.priority}
                        disabled={Boolean(busy)}
                        onChange={(e) => update("priority", e.target.value)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </label>
                    <small>Changes are saved automatically.</small>
                    <form
                      className="form-stack"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = new FormData(e.currentTarget).get(
                          "deadline",
                        );
                        update(
                          "dueAt",
                          value ? new Date(value).toISOString() : null,
                        );
                      }}
                    >
                      <label>
                        Set deadline
                        <input
                          className="input"
                          type="datetime-local"
                          name="deadline"
                          defaultValue={
                            ticket.dueAt
                              ? new Date(
                                  new Date(ticket.dueAt).getTime() -
                                    new Date(ticket.dueAt).getTimezoneOffset() *
                                      60000,
                                )
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          disabled={Boolean(busy)}
                        />
                      </label>
                      <button
                        className="btn-secondary"
                        disabled={Boolean(busy)}
                      >
                        Save deadline
                      </button>
                      <small>
                        Local time. Leave blank to remove the deadline.
                      </small>
                    </form>
                  </div>
                ) : (
                  <div className="property-priority">
                    <span>Priority</span>
                    <StatusBadge value={ticket.priority} type="priority" />
                  </div>
                )}
              </section>
              <section className="panel panel-padding">
                <h2>Resolution journey</h2>
                <ol className="journey">
                  {["Pending", "In Progress", "Resolved"].map(
                    (status, index) => (
                      <li
                        key={status}
                        className={
                          ["Pending", "In Progress", "Resolved"].indexOf(
                            ticket.status,
                          ) >= index
                            ? "complete"
                            : ""
                        }
                      >
                        <span>{index + 1}</span>
                        <div>
                          <strong>{status}</strong>
                          <small>
                            {
                              [
                                "Your request has been received",
                                "The team is working on it",
                                "The issue has been addressed",
                              ][index]
                            }
                          </small>
                        </div>
                      </li>
                    ),
                  )}
                </ol>
              </section>
              <section className="panel panel-padding">
                <div className="section-title">
                  <History size={18} />
                  <h2>Activity timeline</h2>
                </div>
                {ticket.activity?.length ? (
                  <ol className="audit-trail">
                    {[...ticket.activity].reverse().map((event) => (
                      <li key={event._id}>
                        <strong>{event.actorName}</strong>
                        <p>{event.summary}</p>
                        <small>
                          {new Date(event.createdAt).toLocaleString()}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="field-hint">
                    New changes will be recorded here. This ticket predates
                    activity tracking.
                  </p>
                )}
              </section>
            </aside>
          </div>
          {mutationError && (
            <div className="inline-error" role="alert">
              {mutationError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
