import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import FilterBar from "../components/FilterBar";
import TicketCard from "../components/TicketCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultFilters = { search: "", category: "", status: "", priority: "" };

const TicketsPage = () => {
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    status: searchParams.get("status") || "",
    priority: searchParams.get("priority") || "",
  });
  const [error, setError] = useState("");

  const fetchTickets = async (appliedFilters = filters) => {
    try {
      const params = Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value));
      const { data } = await api.get("/tickets", { params });
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchTickets({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "",
      priority: searchParams.get("priority") || "",
    });
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTickets(filters);
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters]);

  const handleTicketUpdate = async (id, payload) => {
    await api.put(`/tickets/${id}`, payload);
    fetchTickets();
  };

  const handleAddComment = async (id, message) => {
    await api.post(`/tickets/${id}/comments`, { message });
    fetchTickets();
  };

  const isAdmin = auth.user?.role === "admin";
  const isFaculty = auth.user?.role === "faculty";
  const showPriorityFilter = isAdmin || isFaculty;

  return (
    <Layout
      title={isAdmin ? "All Complaints" : isFaculty ? "My Assigned Complaints" : "My Complaints"}
      subtitle={isFaculty ? "Faculty tickets assigned to you — respond and update status." : "Search, filter, and manage tickets from one place."}
    >
      <FilterBar filters={filters} showPriority={showPriorityFilter} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} />
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <section className="grid gap-5">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket._id}
            ticket={ticket}
            isAdmin={isAdmin}
            onStatusChange={(id, status) => handleTicketUpdate(id, { status })}
            onPriorityChange={(id, priority) => handleTicketUpdate(id, { priority })}
            onAddComment={handleAddComment}
          />
        ))}
        {!tickets.length && <div className="card text-sm text-slate-500">No tickets match the current filters.</div>}
      </section>
    </Layout>
  );
};

export default TicketsPage;
