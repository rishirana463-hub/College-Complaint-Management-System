import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCheck,
  ArrowUpRight,
  RefreshCw,
  Inbox,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "../components/States";
import useResource from "../hooks/useResource";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { ticketCode } from "../lib/navigation";

export default function ActivityPage({ inbox = false }) {
  const resource = useResource(inbox ? "/tickets/inbox" : "/tickets/activity");
  const { notify } = useToast();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const entries = resource.data || [];
  const filtered = entries.filter(
    (e) =>
      filter === "all" || (filter === "unread" ? !e.read : e.kind === filter),
  );
  const unread = entries.filter((e) => !e.read);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) resource.reload();
    }, 30000);
    return () => clearInterval(timer);
  }, [resource.reload]);
  const mark = async (ids) => {
    setBusy(true);
    try {
      await api.post("/tickets/inbox/read", { ids });
      notify("Marked as read.");
      resource.reload();
      window.dispatchEvent(new Event("ccms:inbox"));
    } catch (e) {
      notify(
        e.response?.data?.message || "Could not update the inbox.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={inbox ? "WORKSPACE / INBOX" : "WORKSPACE / ACTIVITY"}
        title={inbox ? "Your inbox" : "Nothing lost in the handoff."}
        subtitle={
          inbox
            ? "Updates from other people, without the noise. Automatically checked every 30 seconds."
            : "A recorded history of requests, decisions, and conversations."
        }
        actions={
          <div className="toolbar-actions">
            <button
              className="btn-secondary"
              onClick={resource.reload}
              disabled={resource.loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            {inbox && (
              <button
                className="btn-primary"
                disabled={busy || !unread.length}
                onClick={() => mark(unread.map((e) => e._id))}
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
        }
      />
      <section className="panel activity-workspace">
        <div className="ticket-tabs">
          {(inbox
            ? [
                ["all", "All updates"],
                ["unread", "Unread (" + unread.length + ")"],
              ]
            : [
                ["all", "All activity"],
                ["created", "Requests"],
                ["updated", "Changes"],
                ["comment", "Replies"],
              ]
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              className={filter === value ? "selected" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {resource.loading && !resource.data ? (
          <Skeleton variant="list" />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.reload} />
        ) : !filtered.length ? (
          <EmptyState
            title={
              inbox ? "You're all caught up" : "The next chapter starts here"
            }
            description={
              inbox
                ? "Updates from other people on tickets you can access will appear here."
                : "New activity is recorded from this upgrade onward. Existing conversations remain on each ticket."
            }
          />
        ) : (
          <ol className="event-list">
            {filtered.map((event) => (
              <li
                key={event._id}
                className={inbox && !event.read ? "event-unread" : ""}
              >
                <span className="event-avatar">
                  {event.actorName.slice(0, 1)}
                </span>
                <div className="event-body">
                  <div>
                    <strong>{event.actorName}</strong>
                    <span className="role-label">{event.actorRole}</span>
                    {inbox && !event.read && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                  </div>
                  <p>{event.summary}</p>
                  <Link to={"/tickets/" + event.ticketId}>
                    {ticketCode(event.ticketId)}{" "}
                    <span>{event.ticketTitle}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
                <div className="event-trailing">
                  <time dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {inbox && !event.read && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => mark([event._id])}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="activity-disclaimer">
          {inbox ? <Inbox size={14} /> : <Activity size={14} />}Showing up to{" "}
          {inbox ? "100 recent updates from other people" : "200 recent events"}
          . Private-ticket visibility is always respected.
        </div>
      </section>
    </div>
  );
}
