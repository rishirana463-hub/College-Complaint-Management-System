import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

const DashboardPage = () => {
  const { auth } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const loadTickets = async () => {
      const { data } = await api.get("/tickets");
      setTickets(data);
    };

    loadTickets();
  }, []);

  const counts = {
    total: tickets.length,
    pending: tickets.filter((ticket) => ticket.status === "Pending").length,
    inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
  };

  return (
    <Layout
      title={`Hello, ${auth.user?.name}`}
      subtitle="Track your submitted complaints, monitor updates from the admin team, and continue the conversation when more details are needed."
      actions={<Link className="btn-primary" to="/submit">New Complaint</Link>}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Complaints" value={counts.total} />
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="In Progress" value={counts.inProgress} />
        <StatCard label="Resolved" value={counts.resolved} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
          <Link className="text-sm font-semibold text-brand-700" to="/tickets">View all</Link>
        </div>
        <div className="mt-5 grid gap-4">
          {tickets.slice(0, 3).map((ticket) => (
            <div key={ticket._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={ticket.status} />
                <StatusBadge value={ticket.priority} type="priority" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{ticket.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
            </div>
          ))}
          {!tickets.length && <p className="text-sm text-slate-500">No complaints submitted yet.</p>}
        </div>
      </section>
    </Layout>
  );
};

const StatCard = ({ label, value }) => (
  <div className="card bg-slate-950 text-white">
    <p className="text-sm text-slate-300">{label}</p>
    <p className="mt-3 text-4xl font-bold">{value}</p>
  </div>
);

export default DashboardPage;
