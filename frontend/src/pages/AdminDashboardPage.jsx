import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState({ totalTickets: 0, pending: 0, inProgress: 0, resolved: 0, totalUsers: 0 });

  useEffect(() => {
    const loadSummary = async () => {
      const { data } = await api.get("/tickets/summary/admin");
      setSummary(data);
    };

    loadSummary();
  }, []);

  return (
    <Layout
      title="Admin Dashboard"
      subtitle="Review campus-wide complaints, assign urgency, and keep resolution progress moving."
      actions={<Link className="btn-primary" to="/tickets">Manage Tickets</Link>}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Students" value={summary.totalUsers} />
        <MetricCard label="All Complaints" value={summary.totalTickets} />
        <MetricCard label="Pending" value={summary.pending} />
        <MetricCard label="In Progress" value={summary.inProgress} />
        <MetricCard label="Resolved" value={summary.resolved} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Admin actions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ActionCard title="Review pending issues" description="Focus on unresolved complaints and update status quickly." link="/tickets?status=Pending" />
            <ActionCard title="High priority attention" description="Open tickets with urgent impact and assign resources." link="/tickets?priority=High" />
          </div>
        </div>
        <div className="card bg-slate-950 text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Response Playbook</p>
          <h2 className="mt-4 text-2xl font-semibold">Keep tickets actionable</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Move new issues from Pending to In Progress as soon as ownership is clear.</li>
            <li>Use priority badges to surface urgent campus-impacting complaints.</li>
            <li>Reply in comments so students see visible progress instead of silence.</li>
          </ul>
        </div>
      </section>
    </Layout>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="card">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
  </div>
);

const ActionCard = ({ title, description, link }) => (
  <Link to={link} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white">
    <h3 className="font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    <span className="mt-4 inline-block text-sm font-semibold text-brand-700">Open</span>
  </Link>
);

export default AdminDashboardPage;
