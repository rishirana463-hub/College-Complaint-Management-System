export default function StatusBadge({ value, type = "status" }) {
  return (
    <span
      className={
        "badge badge-" +
        value.toLowerCase().replaceAll(" ", "-") +
        (type === "priority" ? " priority-badge" : "")
      }
    >
      <span className="badge-dot" />
      {value}
    </span>
  );
}
