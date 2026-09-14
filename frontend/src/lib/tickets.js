export const statuses = ["Pending", "In Progress", "Resolved"];
export const isOverdue = (ticket) =>
  ticket.status !== "Resolved" &&
  ticket.dueAt &&
  new Date(ticket.dueAt) < new Date();
export const ageLabel = (date) => {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date)) / 86400000),
  );
  return days ? days + "d ago" : "Today";
};
export function sortTickets(tickets, order) {
  return [...tickets].sort((a, b) =>
    order === "priority"
      ? { High: 0, Medium: 1, Low: 2 }[a.priority] -
          { High: 0, Medium: 1, Low: 2 }[b.priority] ||
        new Date(a.createdAt) - new Date(b.createdAt)
      : order === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : order === "due"
          ? (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) -
            (b.dueAt ? new Date(b.dueAt).getTime() : Infinity)
          : new Date(b.createdAt) - new Date(a.createdAt),
  );
}
export function exportTickets(tickets) {
  // Neutralize spreadsheet formulas as well as CSV quotes in user-controlled text.
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [
    [
      "ID",
      "Title",
      "Category",
      "Status",
      "Priority",
      "Location",
      "Created",
      "Deadline",
      "Resolved",
    ],
    ...tickets.map((t) => [
      t._id,
      t.title,
      t.category,
      t.status,
      t.priority,
      t.location,
      t.createdAt,
      t.dueAt,
      t.resolvedAt,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    "campusdesk-tickets-" + new Date().toISOString().slice(0, 10) + ".csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
