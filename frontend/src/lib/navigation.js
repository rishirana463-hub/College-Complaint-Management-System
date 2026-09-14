export const homeFor = (role) =>
  role === "admin" ? "/admin" : role === "faculty" ? "/tickets" : "/dashboard";

export const navigationFor = (role) => [
  ...(role !== "faculty"
    ? [{ label: "Overview", path: homeFor(role), icon: "overview" }]
    : []),
  {
    label:
      role === "admin"
        ? "All tickets"
        : role === "faculty"
          ? "Assigned tickets"
          : "My tickets",
    path: "/tickets",
    icon: "tickets",
  },
  ...(role === "student"
    ? [{ label: "New complaint", path: "/submit", icon: "plus" }]
    : []),
  { label: "Inbox", path: "/inbox", icon: "inbox" },
  { label: "Insights", path: "/analytics", icon: "analytics" },
  { label: "Activity log", path: "/activity", icon: "activity" },
];

export const categories = [
  "Hostel",
  "IT",
  "Faculty",
  "Infrastructure",
  "Library",
  "Canteen",
  "Campus",
  "Other",
];
export const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
export const ticketCode = (id) => `TKT-${id.slice(-6).toUpperCase()}`;
