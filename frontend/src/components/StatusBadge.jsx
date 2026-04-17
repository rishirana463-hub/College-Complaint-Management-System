const statusClasses = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-sky-100 text-sky-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

const priorityClasses = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-violet-100 text-violet-700",
  High: "bg-rose-100 text-rose-700",
};

const StatusBadge = ({ value, type = "status" }) => {
  const className = type === "priority" ? priorityClasses[value] : statusClasses[value];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
};

export default StatusBadge;
