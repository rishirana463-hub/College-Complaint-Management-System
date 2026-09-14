import { Link } from "react-router-dom";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { dateLabel, ticketCode } from "../lib/navigation";
export default function TicketTable({
  tickets,
  showAuthor = false,
  selected = [],
  onSelect,
  selectionDisabled = false,
}) {
  return (
    <div className="table-scroll">
      <table className="ticket-table">
        <caption className="sr-only">Tickets and their current status</caption>
        <thead>
          <tr>
            {onSelect && (
              <th scope="col">
                <span className="sr-only">Select tickets</span>
              </th>
            )}
            <th scope="col">Ticket</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">{showAuthor ? "Raised by" : "Category"}</th>
            <th scope="col">Created</th>
            <th scope="col">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id}>
              {onSelect && (
                <td className="selection-cell">
                  <input
                    type="checkbox"
                    aria-label={"Select " + ticket.title}
                    checked={selected.includes(ticket._id)}
                    disabled={selectionDisabled}
                    onChange={() => onSelect(ticket._id)}
                  />
                </td>
              )}
              <td>
                <Link className="ticket-title" to={"/tickets/" + ticket._id}>
                  {ticket.title}
                </Link>
                <span className="ticket-meta">
                  {ticketCode(ticket._id)}
                  {ticket.category === "Faculty" && (
                    <>
                      <LockKeyhole size={11} />
                      Private
                    </>
                  )}
                </span>
              </td>
              <td>
                <StatusBadge value={ticket.status} />
              </td>
              <td>
                <StatusBadge value={ticket.priority} type="priority" />
              </td>
              <td className="table-secondary">
                {showAuthor
                  ? ticket.userId?.name || "Deleted user"
                  : ticket.category}
              </td>
              <td className="table-secondary">
                <time dateTime={ticket.createdAt}>
                  {dateLabel(ticket.createdAt)}
                </time>
              </td>
              <td>
                <Link
                  className="icon-button"
                  to={"/tickets/" + ticket._id}
                  aria-label={"Open " + ticket.title}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
