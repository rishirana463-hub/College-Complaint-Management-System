import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  ArrowDownRight,
  Radio,
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
import SpotlightCard from "../components/reactbits/SpotlightCard";
import { categories, dateLabel, ticketCode } from "../lib/navigation";
import { isOverdue, sortTickets, ageLabel } from "../lib/tickets";

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
  const urgent = open.filter((t) => t.priority === "High" || isOverdue(t));
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
          <p className="eyebrow">
            CAMPUSDESK / {isAdmin ? "OPERATIONS" : "STUDENT WORKSPACE"}
          </p>
          <BlurText
            as="h1"
            text={
              isAdmin
                ? "Make room for a better campus."
                : "Welcome back, " + auth.user.name.split(" ")[0]
            }
            delay={45}
            stepDuration={0.2}
          />
          <p>A little less friction. A lot more progress.</p>
        </div>
        <div className="edition-date">
          <Radio size={16} />
          <span>
            {new Date().toLocaleDateString(undefined, {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })}
            <small>Your campus, in focus</small>
          </span>
        </div>
      </div>
      {resource.loading ? (
        <Skeleton />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <section className="mission-grid">
            <SpotlightCard
              className="mission-hero"
              spotlightColor="rgba(222,244,160,0.16)"
            >
              <div className="hero-grid-art" aria-hidden="true">
                <div />
                <div />
                <div />
                <i />
                <i />
                <i />
                <span className="art-cross">+</span>
              </div>
              <div className="hero-topline">
                <span className="signal-tag">
                  <span />
                  PRIORITY DESK
                </span>
                <span>01 / OVERVIEW</span>
              </div>
              <div className="hero-copy">
                <span className="hero-number">
                  {urgent.length.toString().padStart(2, "0")}
                </span>
                <h2>
                  {urgent.length ? (
                    <>
                      Requests need
                      <br />a closer look.
                    </>
                  ) : (
                    <>
                      A clearer queue.
                      <br />A better day.
                    </>
                  )}
                </h2>
                <p>
                  {urgent.length
                    ? "High-priority or overdue requests. Start here to make the biggest difference."
                    : "No high-priority or overdue requests right now. Keep the rest moving."}
                </p>
              </div>
              <Link
                className="hero-action"
                to={isAdmin ? "/tickets?sort=priority&view=board" : "/submit"}
              >
                {isAdmin
                  ? "Open the priority workspace"
                  : "Report something that matters"}
                <ArrowUpRight size={20} />
              </Link>
            </SpotlightCard>
            <section className="panel next-queue">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">UP NEXT</p>
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
            </section>
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
                  <p className="eyebrow">THE BIG PICTURE</p>
                  <h2>Every corner of campus</h2>
                </div>
                <Link className="text-link" to="/analytics">
                  Explore insights <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="service-grid">
                {categories.map((category, index) => {
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
                      <span className="service-index">0{index + 1}</span>
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
                  <p className="eyebrow">THE PAPER TRAIL</p>
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
                <p className="eyebrow">ON YOUR RADAR</p>
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
