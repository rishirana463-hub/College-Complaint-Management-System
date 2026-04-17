import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { auth, logout } = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const isFaculty = auth.user?.role === "faculty";

  const navItems = isAdmin
    ? [{ label: "Admin Dashboard", path: "/admin" }, { label: "All Tickets", path: "/tickets" }]
    : isFaculty
    ? [{ label: "My Assigned Tickets", path: "/tickets" }]
    : [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Submit Complaint", path: "/submit" },
        { label: "My Tickets", path: "/tickets" },
      ];

  const portalLabel = isAdmin ? "Admin Portal" : isFaculty ? "Faculty Portal" : "Student Portal";

  return (
    <aside className="relative flex w-full max-w-xs flex-col gap-6 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,_#050816_0%,_#09101f_46%,_#0f1d2c_100%)] p-6 text-white shadow-soft">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(91,159,141,0.28),_transparent_70%)]" />
        <div className="absolute -right-12 bottom-16 h-36 w-36 rounded-full bg-brand-400/10 blur-2xl" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-200/80">{portalLabel}</p>
        <Link to={isAdmin ? "/admin" : isFaculty ? "/tickets" : "/dashboard"} className="mt-3 block text-2xl font-bold tracking-tight">
          College Ticket System
        </Link>
        <p className="mt-2 text-sm text-slate-300">
          {auth.user?.name} ({auth.user?.role})
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Today</p>
        <p className="mt-2 text-sm text-slate-200">Keep your submissions precise so the right team can act faster.</p>
      </div>

      <nav className="relative flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[linear-gradient(135deg,_#4c9482,_#32695e)] text-white shadow-lg shadow-brand-950/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={logout} className="btn-secondary relative w-full border-white/10 bg-white text-slate-900">
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
