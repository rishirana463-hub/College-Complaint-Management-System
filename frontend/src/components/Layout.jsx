import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Bell,
  LogOut,
} from "lucide-react";
import Sidebar, { Brand } from "./Sidebar";
import DockNavigation from "./DockNavigation";
import CommandPalette from "./CommandPalette";
import Dialog from "./Dialog";
import { ErrorBoundary, Skeleton } from "./States";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { homeFor, navigationFor } from "../lib/navigation";
import { googleConfigured, startGoogleSignIn } from "../services/googleAuth";
import { useToast } from "../context/ToastContext";
import useResource from "../hooks/useResource";
export default function Layout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { theme, preference, setPreference, toggleTheme } = useTheme();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const accountMenu = useRef(null);
  const inbox = useResource("/tickets/inbox");
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) inbox.reload();
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("ccms:inbox", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("ccms:inbox", refresh);
    };
  }, [inbox.reload]);
  const title =
    navigationFor(auth.user.role).find(
      (item) => item.path === location.pathname,
    )?.label || "Ticket details";
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    document.title = title + " | Campusdesk";
    setMobileOpen(false);
    accountMenu.current?.removeAttribute("open");
  }, [location.pathname, title]);
  return (
    <div className="app-shell dock-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="workspace-main">
        <header className="topbar">
          <Link
            className="workspace-brand"
            to={homeFor(auth.user.role)}
            aria-label="Campusdesk home"
          >
            <Brand />
          </Link>
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="command-trigger"
              aria-label="Quick search"
              onClick={() => setCommandOpen(true)}
            >
              <Search size={17} />
              <span className="command-label">Quick search...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Link
              className="icon-button inbox-trigger"
              to="/inbox"
              aria-label={
                "Open inbox" +
                (inbox.data?.some((e) => !e.read) ? ", unread updates" : "")
              }
            >
              <Bell size={19} />
              {inbox.data?.some((e) => !e.read) && (
                <span className="unread-dot" />
              )}
            </Link>
            <button
              className="icon-button"
              aria-label={
                "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
              }
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <details
              className="profile-menu"
              ref={accountMenu}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.removeAttribute("open");
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  event.currentTarget.removeAttribute("open");
              }}
            >
              <summary aria-label="Account and appearance">
                <span className="avatar">
                  {auth.user.name?.slice(0, 1).toUpperCase()}
                </span>
                <ChevronDown size={15} />
              </summary>
              <div className="profile-popover">
                <strong>{auth.user.name}</strong>
                <small>{auth.user.email}</small>
                <span className="role-label">{auth.user.role}</span>
                <label>
                  Appearance
                  <select
                    className="input"
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                  >
                    <option value="system">System preference</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                {googleConfigured && !auth.user.googleConnected && (
                  <button
                    className="btn-secondary full-width connect-google"
                    onClick={() =>
                      startGoogleSignIn().catch((error) =>
                        notify(error.message, "error"),
                      )
                    }
                  >
                    Connect Google
                  </button>
                )}
                {auth.user.googleConnected && (
                  <p className="field-hint">Google account connected</p>
                )}
                <button
                  className="btn-secondary profile-signout"
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                    notify("You have been signed out.");
                  }}
                >
                  <LogOut size={17} /> Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<Skeleton />}>
              <motion.div
                key={location.pathname}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
          <footer className="content-footer">
            <span>Small actions. Better campus.</span>
            <span>College Complaint & Ticket Management</span>
          </footer>
        </main>
      </div>
      <DockNavigation
        unreadCount={(inbox.data || []).filter((event) => !event.read).length}
      />
      <Dialog
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Navigation"
        className="mobile-nav-dialog"
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Dialog>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
    </div>
  );
}
