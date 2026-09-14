import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Columns3,
  List,
  Download,
  BookmarkPlus,
  X,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import TicketTable from "../components/TicketTable";
import TicketBoard from "../components/TicketBoard";
import Dialog from "../components/Dialog";
import { EmptyState, ErrorState, Skeleton } from "../components/States";
import useResource from "../hooks/useResource";
import api from "../services/api";
import { readStored, writeStored } from "../lib/storage";
import {
  sortTickets,
  exportTickets,
  isOverdue,
  statuses,
} from "../lib/tickets";

export default function TicketsPage() {
  const { auth } = useAuth();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const storageKey = "ccms_views_" + (auth.user.id || auth.user._id);
  const [views, setViews] = useState(() => {
    const value = readStored(storageKey, []);
    return Array.isArray(value)
      ? value
          .filter(
            (v) => typeof v.name === "string" && typeof v.query === "string",
          )
          .slice(0, 8)
      : [];
  });
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState("");
  const [bulkStatus, setBulkStatus] = useState("In Progress");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const filters = Object.fromEntries(
    ["search", "category", "status", "priority"].map((key) => [
      key,
      params.get(key) || "",
    ]),
  );
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  ).toString();
  const resource = useResource("/tickets?" + query, { delay: 250 });
  const order = params.get("sort") || "newest";
  const mode = params.get("view") === "board" ? "board" : "list";
  const overdue = params.get("overdue") === "true";
  const tickets = sortTickets(
    (resource.data || []).filter((t) => !overdue || isOverdue(t)),
    order,
  );
  const [pageState, setPageState] = useState({ query: "", page: 1 });
  const pageKey = params.toString();
  const totalPages = Math.max(1, Math.ceil(tickets.length / 10));
  const page = Math.min(
    pageState.query === pageKey ? pageState.page : 1,
    totalPages,
  );
  const visibleIds = selected.filter((id) => tickets.some((t) => t._id === id));
  const isStudent = auth.user.role === "student";
  const change = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
    setSelected([]);
  };
  const move = async (id, status) => {
    setBusy(id);
    try {
      await api.put("/tickets/" + id, { status });
      notify("Ticket moved to " + status + ".");
      resource.reload();
    } catch (error) {
      notify(
        error.response?.data?.message || "The ticket could not be moved.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };
  const bulkMove = async () => {
    setBusy("bulk");
    setConfirmBulk(false);
    const failed = [];
    // Sequential updates avoid flooding the API. Each ticket is independently authorized.
    for (const id of visibleIds) {
      try {
        await api.put("/tickets/" + id, { status: bulkStatus });
      } catch {
        failed.push(id);
      }
    }
    notify(
      failed.length
        ? visibleIds.length -
            failed.length +
            " updated; " +
            failed.length +
            " failed. Failed tickets remain selected for retry."
        : visibleIds.length + " tickets updated.",
      failed.length ? "error" : "success",
    );
    setSelected(failed);
    setBusy("");
    resource.reload();
  };
  const save = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    const updated = [
      ...views,
      {
        id: crypto.randomUUID(),
        name: viewName.trim(),
        query: params.toString(),
      },
    ].slice(-8);
    setViews(updated);
    writeStored(storageKey, updated);
    setSaveOpen(false);
    setViewName("");
    notify("View saved on this browser.");
  };
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="OPERATIONS / WORKSPACE"
        title={
          isStudent
            ? "My tickets"
            : auth.user.role === "faculty"
              ? "Assigned tickets"
              : "All tickets"
        }
        subtitle="Less searching. More moving things forward."
        actions={
          <div className="toolbar-actions">
            <button
              className="btn-secondary"
              disabled={resource.loading || !tickets.length}
              onClick={() => {
                exportTickets(tickets);
                notify("Filtered tickets exported.");
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
            {isStudent && (
              <Link className="btn-primary" to="/submit">
                <Plus size={16} />
                New complaint
              </Link>
            )}
          </div>
        }
      />
      <div className="workspace-toolbar">
        <div className="view-toggle" aria-label="Workspace layout">
          <button
            aria-pressed={mode === "list"}
            onClick={() => change("view", "list")}
          >
            <List size={16} />
            List
          </button>
          <button
            aria-pressed={mode === "board"}
            onClick={() => change("view", "board")}
          >
            <Columns3 size={16} />
            Board
          </button>
        </div>
        <span className="workspace-result-count">
          {resource.loading ? "Updating..." : tickets.length + " requests"}
        </span>
        <label className="sort-control">
          Sort by
          <select
            value={order}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority</option>
            <option value="due">Deadline</option>
          </select>
        </label>
        <button className="btn-secondary" onClick={() => setSaveOpen(true)}>
          <BookmarkPlus size={16} />
          Save view
        </button>
      </div>
      {views.length > 0 && (
        <div className="saved-views">
          <span>Saved views</span>
          {views.map((view) => (
            <div key={view.id}>
              <button
                onClick={() => {
                  setParams(new URLSearchParams(view.query));
                  setSelected([]);
                }}
              >
                {view.name}
              </button>
              <button
                aria-label={"Delete saved view " + view.name}
                onClick={() => {
                  const next = views.filter((v) => v.id !== view.id);
                  setViews(next);
                  writeStored(storageKey, next);
                  notify("Saved view removed.");
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <section
        className={
          mode === "list" ? "panel ticket-workspace" : "ticket-workspace"
        }
      >
        <div className="ticket-tabs" aria-label="Quick status filters">
          {["", ...statuses].map((status) => (
            <button
              key={status}
              className={filters.status === status ? "selected" : ""}
              aria-pressed={filters.status === status}
              onClick={() => change("status", status)}
            >
              {status || "All tickets"}
            </button>
          ))}
          <button
            className={overdue ? "selected" : ""}
            aria-pressed={overdue}
            onClick={() => change("overdue", overdue ? "" : "true")}
          >
            Overdue
          </button>
        </div>
        <FilterBar
          filters={filters}
          isFaculty={auth.user.role === "faculty"}
          onChange={change}
          onReset={() => {
            setParams({ view: mode });
            setSelected([]);
          }}
        />
        {!isStudent && visibleIds.length > 0 && (
          <div className="bulk-toolbar">
            <CheckCheck size={18} />
            <strong>{visibleIds.length} selected</strong>
            <label>
              <span className="sr-only">Bulk status</span>
              <select
                aria-label="Bulk status"
                value={bulkStatus}
                disabled={Boolean(busy)}
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              className="btn-primary"
              disabled={Boolean(busy)}
              onClick={() => setConfirmBulk(true)}
            >
              {busy ? "Updating..." : "Apply status"}
            </button>
            <button
              className="text-link"
              disabled={Boolean(busy)}
              onClick={() => setSelected([])}
            >
              Clear selection
            </button>
          </div>
        )}
        {resource.loading ? (
          <div className="panel-padding">
            <Skeleton variant="list" />
          </div>
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.reload} />
        ) : !tickets.length ? (
          <EmptyState
            title={
              Object.values(filters).some(Boolean) || overdue
                ? "No tickets match your filters"
                : "No tickets yet"
            }
            description="New requests will appear here. Try clearing your filters."
            action={
              <button
                className="btn-secondary"
                onClick={() => setParams({ view: mode })}
              >
                Clear filters
              </button>
            }
          />
        ) : mode === "board" ? (
          <TicketBoard
            tickets={tickets}
            canManage={!isStudent}
            onMove={move}
            busy={busy}
          />
        ) : (
          <>
            <TicketTable
              tickets={tickets.slice((page - 1) * 10, page * 10)}
              showAuthor={!isStudent}
              selected={visibleIds}
              onSelect={
                isStudent
                  ? undefined
                  : (id) =>
                      setSelected((old) =>
                        old.includes(id)
                          ? old.filter((v) => v !== id)
                          : [...old, id],
                      )
              }
              selectionDisabled={Boolean(busy)}
            />
            <div className="pagination">
              <span>
                Showing {(page - 1) * 10 + 1}-
                {Math.min(page * 10, tickets.length)} of {tickets.length}{" "}
                tickets
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() =>
                    setPageState({ query: pageKey, page: page - 1 })
                  }
                >
                  <ArrowLeft size={17} />
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPageState({ query: pageKey, page: page + 1 })
                  }
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {mode === "board" && !isStudent && (
        <p className="field-hint">
          Drag cards between stages, or use each card's status menu with your
          keyboard. Changes are saved to the database.
        </p>
      )}
      <Dialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save this view"
      >
        <form className="form-stack" onSubmit={save}>
          <p>
            Save the current filters, sort order, and layout. Up to 8 views are
            stored for your account on this browser.
          </p>
          <label>
            View name
            <input
              autoFocus
              className="input"
              required
              maxLength={40}
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="e.g. High-priority IT requests"
            />
          </label>
          <button className="btn-primary">Save view</button>
        </form>
      </Dialog>
      <Dialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title="Update selected tickets?"
      >
        <div className="form-stack">
          <p>
            Move {visibleIds.length} tickets to <strong>{bulkStatus}</strong>.
            Each change will appear in the ticket activity timeline.
          </p>
          <button className="btn-primary" onClick={bulkMove}>
            Confirm update
          </button>
        </div>
      </Dialog>
    </div>
  );
}
