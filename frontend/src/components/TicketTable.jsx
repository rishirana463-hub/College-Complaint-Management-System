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
      <table className="ticket-table" role="table">
        <caption className="sr-only">Tickets and their current status</caption>
        <thead role="rowgroup">
          <tr role="row">
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
        <tbody role="rowgroup">
          {tickets.map((ticket) => (
            <tr
              key={ticket._id}
              role="row"
              className={
                selected.includes(ticket._id) ? "ticket-selected" : undefined
              }
            >
              {onSelect && (
                <td className="selection-cell" role="cell">
                  <input
                    type="checkbox"
                    aria-label={"Select " + ticket.title}
                    checked={selected.includes(ticket._id)}
                    disabled={selectionDisabled}
                    onChange={() => onSelect(ticket._id)}
                  />
                </td>
              )}
              <td className="ticket-name-cell" role="cell">
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
              <td role="cell" className="ticket-status-cell">
                <span className="mobile-cell-label" aria-hidden="true">
                  Status
                </span>
                <StatusBadge value={ticket.status} />
              </td>
              <td role="cell" className="ticket-priority-cell">
                <span className="mobile-cell-label" aria-hidden="true">
                  Priority
                </span>
                <StatusBadge value={ticket.priority} type="priority" />
              </td>
              <td className="table-secondary ticket-owner-cell" role="cell">
                <span className="mobile-cell-label" aria-hidden="true">
                  {showAuthor ? "Raised by" : "Category"}
                </span>
                {showAuthor
                  ? ticket.userId?.name || "Deleted user"
                  : ticket.category}
              </td>
              <td className="table-secondary ticket-date-cell" role="cell">
                <span className="mobile-cell-label" aria-hidden="true">
                  Created
                </span>
                <time dateTime={ticket.createdAt}>
                  {dateLabel(ticket.createdAt)}
                </time>
              </td>
              <td className="ticket-open-cell" role="cell">
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
