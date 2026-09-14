import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowUpRight, BarChart3 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { ErrorState, Skeleton, EmptyState } from "../components/States";
import useResource from "../hooks/useResource";
import { categories } from "../lib/navigation";
import { isOverdue, exportTickets } from "../lib/tickets";
import { useToast } from "../context/ToastContext";
export default function AnalyticsPage() {
  const resource = useResource("/tickets");
  const [range, setRange] = useState(30);
  const { notify } = useToast();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - range + 1);
  const tickets = (resource.data || []).filter(
    (t) => new Date(t.createdAt) >= start,
  );
  const resolved = tickets.filter((t) => t.status === "Resolved");
  const timed = resolved.filter(
    (t) => t.resolvedAt && new Date(t.resolvedAt) >= new Date(t.createdAt),
  );
  const average = timed.length
    ? (
        timed.reduce(
          (sum, t) =>
            sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / 3600000,
          0,
        ) / timed.length
      ).toFixed(1)
    : null;
  const days = Array.from({ length: range }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return {
      date,
      count: tickets.filter(
        (t) => new Date(t.createdAt) >= date && new Date(t.createdAt) < end,
      ).length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="WORKSPACE / INSIGHTS"
        title="See the pattern. Change the outcome."
        subtitle="Real ticket data. Clear definitions. No invented trends."
        actions={
          <div className="toolbar-actions">
            <label className="sort-control">
              <span className="sr-only">Reporting period</span>
              <select
                aria-label="Reporting period"
                value={range}
                onChange={(e) => setRange(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <button
              className="btn-secondary"
              disabled={!tickets.length || resource.loading}
              onClick={() => {
                exportTickets(tickets);
                notify("Report exported.");
              }}
            >
              <Download size={16} />
              Export report
            </button>
          </div>
        }
      />
      {resource.loading ? (
        <Skeleton />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="analytics-metrics">
            {[
              ["Requests received", tickets.length, "Created in this period"],
              [
                "Resolution rate",
                (tickets.length
                  ? Math.round((resolved.length / tickets.length) * 100)
                  : 0) + "%",
                "Currently resolved / period requests",
              ],
              [
                "Mean resolution",
                average === null ? "N/A" : average + "h",
                timed.length + " tickets with recorded resolution times",
              ],
              [
                "Overdue requests",
                tickets.filter(isOverdue).length,
                "Open period requests past their deadline",
              ],
            ].map(([label, value, note]) => (
              <section className="panel analytics-stat" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <small>{note}</small>
              </section>
            ))}
          </div>
          <section className="panel analytics-volume">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">REQUEST VOLUME</p>
                <h2>When campus needs a hand</h2>
              </div>
              <span className="subtle-tag">
                {tickets.length} requests / {range} days
              </span>
            </div>
            {tickets.length ? (
              <>
                <div
                  className="analytics-bars"
                  role="img"
                  aria-label={days
                    .map(
                      (d) =>
                        d.date.toLocaleDateString() +
                        ": " +
                        d.count +
                        " requests",
                    )
                    .join("; ")}
                >
                  {days.map((d) => (
                    <div
                      key={d.date.toISOString()}
                      className="analytics-bar-track"
                      title={d.date.toLocaleDateString() + ": " + d.count}
                    >
                      <div
                        style={{
                          height: (d.count / max) * 100 + "%",
                          minHeight: d.count ? 4 : 1,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="analytics-axis">
                  <span>
                    {start.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>Daily submissions</span>
                  <span>Today</span>
                </div>
                <details className="chart-data">
                  <summary>View accessible data table</summary>
                  <div
                    className="chart-data-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Daily submissions data"
                  >
                    <table>
                      <caption>Daily ticket submissions</caption>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Requests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((d) => (
                          <tr key={d.date.toISOString()}>
                            <td>{d.date.toLocaleDateString()}</td>
                            <td>{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <EmptyState
                title="No requests in this period"
                description="Choose a longer period to include older tickets."
              />
            )}
          </section>
          <div className="analytics-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SERVICE PERFORMANCE</p>
                  <h2>Where to focus next</h2>
                </div>
                <BarChart3 size={20} />
              </div>
              <div className="table-scroll">
                <table className="ticket-table">
                  <caption className="sr-only">
                    Requests by category in the selected period
                  </caption>
                  <thead>
                    <tr>
                      <th>Service area</th>
                      <th>Total</th>
                      <th>Open</th>
                      <th>Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const group = tickets.filter(
                        (t) => t.category === category,
                      );
                      return (
                        <tr key={category}>
                          <td>
                            <Link
                              className="text-link"
                              to={"/tickets?category=" + category}
                            >
                              {category}
                              <ArrowUpRight size={13} />
                            </Link>
                          </td>
                          <td>{group.length}</td>
                          <td>
                            {
                              group.filter((t) => t.status !== "Resolved")
                                .length
                            }
                          </td>
                          <td>
                            {
                              group.filter((t) => t.status === "Resolved")
                                .length
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel panel-padding analytics-method">
              <p className="eyebrow">READING THIS REPORT</p>
              <h2>Good decisions start with honest numbers.</h2>
              <p>
                The period filters tickets by creation date, in your local
                timezone. Resolution rate uses their current status, not the
                number closed during the period.
              </p>
              <p>
                Mean resolution uses the latest recorded resolution time. Older
                resolved tickets without that timestamp are excluded. Reopening
                clears the resolution timestamp.
              </p>
              <p>
                No deadline means no overdue flag. All numbers follow your
                role's access permissions.
              </p>
              <Link className="btn-secondary" to="/tickets?overdue=true">
                Review overdue tickets
                <ArrowRightIcon />
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={16} />;
}
