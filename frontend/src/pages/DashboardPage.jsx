import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  ArrowDownRight,
  Clock3,
  ShieldCheck,
  CornerDownRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useResource from "../hooks/useResource";
import { EmptyState, ErrorState, Skeleton } from "../components/States";
import StatusBadge from "../components/StatusBadge";
import TicketTable from "../components/TicketTable";
import CountUp from "../components/reactbits/CountUp";
import BlurText from "../components/reactbits/BlurText";
import BorderGlow from "../components/reactbits/BorderGlow";
import { categories, dateLabel, ticketCode } from "../lib/navigation";
import { needsAttention, sortTickets, ageLabel } from "../lib/tickets";

export default function DashboardPage() {
  const { auth } = useAuth();
  const isAdmin = auth.user.role === "admin";
  const resource = useResource("/tickets");
  const tickets = resource.data || [];
  const counts = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "Pending").length,
    progress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  };
  const open = tickets.filter((t) => t.status !== "Resolved");
  const urgent = tickets.filter(needsAttention);
  const next = sortTickets(open, "priority").slice(0, 3);
  const activity = tickets
    .flatMap((t) => (t.activity || []).map((e) => ({ ...e, ticket: t })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  const rate = counts.total
    ? Math.round((counts.resolved / counts.total) * 100)
    : 0;
  return (
    <div className="page-stack mission-page">
      <div className="mission-heading">
        <div>
          <BlurText
            as="h1"
            text={
              isAdmin
                ? "Campus overview"
                : "Welcome back, " + auth.user.name.split(" ")[0]
            }
            delay={45}
            stepDuration={0.2}
          />
          <p>
            {isAdmin
              ? "Review priorities and help every request move forward."
              : "Your complaints, conversations, and next steps in one place."}
          </p>
        </div>
        <Link
          className="btn-primary dashboard-primary"
          to={isAdmin ? "/tickets?status=Pending" : "/submit"}
        >
          {isAdmin ? <ArrowRight size={17} /> : <Plus size={17} />}
          {isAdmin ? "Review pending tickets" : "New complaint"}
        </Link>
      </div>
      {resource.loading ? (
        <Skeleton />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <section className="mission-grid">
            <BorderGlow
              as="section"
              backgroundColor="var(--ink)"
              borderRadius={12}
              className="priority-summary"
              aria-labelledby="priority-heading"
            >
              <div className="priority-summary-heading">
                <h2 id="priority-heading">Priority desk</h2>
                <span className="priority-total">
                  {urgent.length} {urgent.length === 1 ? "ticket" : "tickets"}
                </span>
              </div>
              <h3>
                {urgent.length
                  ? urgent.length === 1
                    ? "One request needs a closer look."
                    : "Requests need a closer look."
                  : "No urgent requests right now."}
              </h3>
              <p>
                {isAdmin
                  ? "Start with open tickets marked high priority or past their deadline."
                  : "Your open tickets marked high priority or past their deadline appear here."}
              </p>
              <Link
                className="priority-summary-action"
                to={
                  urgent.length
                    ? "/tickets?attention=true&sort=priority"
                    : "/tickets"
                }
              >
                {urgent.length
                  ? "View tickets needing attention"
                  : "View all tickets"}
                <ArrowUpRight size={18} />
              </Link>
            </BorderGlow>
            <BorderGlow as="section" className="panel next-queue">
              <div className="panel-heading">
                <div>
                  <h2>
                    {isAdmin ? "Move the queue forward" : "Your open requests"}
                  </h2>
                </div>
                <ArrowDownRight size={22} />
              </div>
              {next.length ? (
                <ol>
                  {next.map((ticket, index) => (
                    <li key={ticket._id}>
                      <span className="queue-index">0{index + 1}</span>
                      <Link to={"/tickets/" + ticket._id}>
                        <span className="queue-title">{ticket.title}</span>
                        <span className="queue-meta">
                          {ticket.category} <span>/</span>{" "}
                          {ageLabel(ticket.createdAt)}
                        </span>
                      </Link>
                      <StatusBadge value={ticket.priority} type="priority" />
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState
                  compact
                  title="Nothing waiting"
                  description="New requests will land here."
                />
              )}
              <Link className="queue-footer" to="/tickets?status=Pending">
                See the waiting list <ArrowRight size={16} />
              </Link>
            </BorderGlow>
          </section>
          <section
            className="metrics-grid metric-strip"
            aria-label="Ticket overview"
          >
            {[
              ["Total tickets", counts.total, "All requests", ""],
              [
                "Pending review",
                counts.pending,
                "Ready for triage",
                "?status=Pending",
              ],
              [
                "In progress",
                counts.progress,
                "Work underway",
                "?status=In+Progress",
              ],
              [
                "Resolved",
                counts.resolved,
                rate + "% of all requests",
                "?status=Resolved",
              ],
            ].map(([label, value, note, filter], index) => (
              <Link
                key={label}
                to={"/tickets" + filter}
                className="metric-card"
              >
                <div className="metric-top">
                  <span>{label}</span>
                  <span className={"metric-dot metric-dot-" + index} />
                </div>
                <div className="metric-value">
                  <CountUp to={value} />
                  <ArrowUpRight size={18} />
                </div>
                <p>{note}</p>
              </Link>
            ))}
          </section>
          <section className="operations-grid">
            <div className="panel service-panel">
              <div className="panel-heading">
                <div>
                  <h2>Every corner of campus</h2>
                </div>
                <Link className="text-link" to="/analytics">
                  Explore insights <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="service-grid">
                {categories.map((category) => {
                  const count = tickets.filter(
                    (t) => t.category === category && t.status !== "Resolved",
                  ).length;
                  return (
                    <Link
                      key={category}
                      className={
                        "service-cell " + (count ? "has-requests" : "")
                      }
                      to={"/tickets?category=" + category}
                    >
                      <strong>{category}</strong>
                      <span className="service-count">
                        {count}
                        <small>open</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </Link>
                  );
                })}
              </div>
              <div className="service-footnote">
                <ShieldCheck size={14} />
                Counts follow your account's ticket permissions.
              </div>
            </div>
            <section className="panel activity-preview">
              <div className="panel-heading">
                <div>
                  <h2>Latest activity</h2>
                </div>
                <Link
                  to="/activity"
                  className="icon-button"
                  aria-label="Open activity log"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              {activity.length ? (
                <div className="compact-timeline">
                  {activity.map((event) => (
                    <Link key={event._id} to={"/tickets/" + event.ticket._id}>
                      <span className="timeline-point" />
                      <div>
                        <strong>{event.actorName}</strong>
                        <p>{event.summary}</p>
                        <small>
                          {ticketCode(event.ticket._id)} /{" "}
                          {dateLabel(event.createdAt)}
                        </small>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="activity-onboarding">
                  <Clock3 size={28} />
                  <h3>A history you can trust.</h3>
                  <p>
                    New replies and ticket changes will be recorded here. Older
                    tickets keep their existing conversations.
                  </p>
                  <Link className="text-link" to="/tickets">
                    Make the next move <CornerDownRight size={16} />
                  </Link>
                </div>
              )}
            </section>
          </section>
          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  Recent tickets{" "}
                  <span className="count-pill">{counts.total}</span>
                </h2>
              </div>
              <Link className="text-link" to="/tickets">
                View all tickets <ArrowRight size={16} />
              </Link>
            </div>
            {tickets.length ? (
              <TicketTable
                tickets={sortTickets(tickets, "newest").slice(0, 5)}
                showAuthor={isAdmin}
              />
            ) : (
              <EmptyState
                title="Your workspace is ready"
                description="Start with one request. Track every step from here."
                action={
                  !isAdmin && (
                    <Link to="/submit" className="btn-primary">
                      <Plus size={16} />
                      Create a complaint
                    </Link>
                  )
                }
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
