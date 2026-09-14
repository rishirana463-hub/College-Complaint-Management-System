import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  GraduationCap,
  LayoutDashboard,
  Ticket,
  Plus,
  LogOut,
  ShieldCheck,
  Inbox,
  ChartNoAxesCombined,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor, navigationFor } from "../lib/navigation";
const icons = {
  overview: LayoutDashboard,
  tickets: Ticket,
  plus: Plus,
  inbox: Inbox,
  analytics: ChartNoAxesCombined,
  activity: Activity,
};
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <GraduationCap size={23} />
      </span>
      <span>
        campus<span className="brand-light">desk</span>
        <small>COMPLAINT MANAGEMENT</small>
      </span>
    </span>
  );
}
export default function Sidebar({ onNavigate }) {
  const { auth, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  return (
    <div className="sidebar-inner">
      <Link to={homeFor(auth.user.role)} onClick={onNavigate}>
        <Brand />
      </Link>
      <div className="workspace-switch">
        <span className="workspace-icon">C</span>
        <div>
          <strong>College workspace</strong>
          <small>{auth.user.role} portal</small>
        </div>
        <ShieldCheck size={17} />
      </div>
      <p className="nav-caption">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {navigationFor(auth.user.role).map((item) => {
          const Icon = icons[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.icon === "plus" && (
                <span className="nav-shortcut" aria-hidden="true">
                  +
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-symbol">
            <ShieldCheck size={22} />
          </span>
          <strong>A better campus, together.</strong>
          <p>Every report is a step toward a better day on campus.</p>
          <Link
            to={auth.user.role === "student" ? "/submit" : "/tickets"}
            onClick={onNavigate}
          >
            Make a difference <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          className="signout-button"
          onClick={() => {
            onNavigate?.();
            logout();
            navigate("/login", { replace: true });
            notify("You have been signed out.");
          }}
        >
          <LogOut size={18} />
          Sign out
        </button>
        <div className="sidebar-footer">
          CAMPUS OPERATIONS <span>03</span>
        </div>
      </div>
    </div>
  );
}
