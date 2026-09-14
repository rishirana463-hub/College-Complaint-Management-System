import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, SunMoon, LogOut, Ticket } from "lucide-react";
import Dialog from "./Dialog";
import { navigationFor } from "../lib/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { EmptyState } from "./States";
import useResource from "../hooks/useResource";
export default function CommandPalette({ open, onClose }) {
  const { auth, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const search = useResource(
    "/tickets?search=" + encodeURIComponent(query.trim().slice(0, 200)),
    { enabled: open && query.trim().length >= 2, delay: 250 },
  );
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  const items = [
    ...navigationFor(auth.user.role).map((item) => ({
      label: item.label,
      action: () => navigate(item.path),
      icon: ArrowRight,
    })),
    { label: "Switch color theme", action: toggleTheme, icon: SunMoon },
    { label: "Sign out", action: logout, icon: LogOut },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  if (query.trim().length >= 2 && !search.loading && !search.error) {
    items.push(
      ...(search.data || [])
        .slice(0, 6)
        .map((ticket) => ({
          label: ticket.title,
          action: () => navigate("/tickets/" + ticket._id),
          icon: Ticket,
        })),
    );
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Quick navigation"
      className="command-dialog"
    >
      <div className="search-input">
        <Search size={19} />
        <input
          autoFocus
          aria-label="Search commands"
          placeholder="Search tickets, pages, or actions..."
          value={query}
          maxLength={200}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              document.querySelector("[data-command]")?.focus();
            }
            if (e.key === "Enter" && items[0]) {
              onClose();
              items[0].action();
            }
          }}
        />
      </div>
      <div className="command-list">
        {query.trim().length >= 2 && search.loading && (
          <p className="field-hint">Searching your tickets...</p>
        )}
        {query.trim().length >= 2 && search.error && (
          <p className="inline-error" role="alert">
            {search.error}
          </p>
        )}
        {items.map((item, index) => (
          <button
            key={item.label}
            data-command
            onKeyDown={(e) => {
              if (["ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                const buttons =
                  e.currentTarget.parentElement.querySelectorAll("button");
                buttons[
                  (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                    buttons.length
                ]?.focus();
              }
            }}
            onClick={() => {
              onClose();
              item.action();
            }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            <kbd>Enter</kbd>
          </button>
        ))}
        {!items.length && (
          <EmptyState
            compact
            title="No commands found"
            description="Try a ticket title, overview, inbox, or theme."
          />
        )}
      </div>
      <p className="command-hint">
        Arrow keys to move <span>Enter to open</span> Esc to close
      </p>
    </Dialog>
  );
}
