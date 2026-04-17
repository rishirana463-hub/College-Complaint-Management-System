import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const ALL_CATEGORIES = ["Hostel", "IT", "Faculty", "Infrastructure", "Library", "Canteen", "Campus", "Other"];

const FACULTY_ONLY = "Faculty";

const categoryGuidance = {
  Hostel: "Rooms, sanitation, water supply, mess, or maintenance issues.",
  IT: "Internet, systems, portal access, lab devices, or software support.",
  Faculty: "Teaching conduct, academic coordination, or classroom handling. This ticket will be sent privately to the selected faculty member.",
  Infrastructure: "Buildings, furniture, electricity, transport, and facilities.",
  Library: "Book access, timings, seating, and digital catalog concerns.",
  Canteen: "Food quality, hygiene, pricing, timing, or service at campus canteens.",
  Campus: "Campus cleanliness, security, common areas, events, or general campus facilities.",
  Other: "Anything that does not fit the main operational categories.",
};

const categoryVisibility = {
  Faculty: { label: "Private", color: "bg-rose-50 text-rose-700 border-rose-200" },
  Hostel: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  IT: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  Infrastructure: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  Library: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  Canteen: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  Campus: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
  Other: { label: "General", color: "bg-sky-50 text-sky-700 border-sky-200" },
};

const SubmitTicketPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", description: "", category: "Hostel", assignedFaculty: "" });
  const [facultyList, setFacultyList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Load faculty list when category switches to Faculty
  useEffect(() => {
    if (formData.category === FACULTY_ONLY) {
      setLoadingFaculty(true);
      api.get("/tickets/faculty-users")
        .then(({ data }) => setFacultyList(data))
        .catch(() => setFacultyList([]))
        .finally(() => setLoadingFaculty(false));
    } else {
      // Reset assigned faculty when switching away
      setFormData((prev) => ({ ...prev, assignedFaculty: "" }));
    }
  }, [formData.category]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (formData.category === FACULTY_ONLY && !formData.assignedFaculty) {
      setError("Please select a faculty member to assign this complaint to.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        ...(formData.category === FACULTY_ONLY && { assignedFaculty: formData.assignedFaculty }),
      };
      await api.post("/tickets", payload);
      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const visibility = categoryVisibility[formData.category];

  return (
    <Layout
      title="Submit Complaint"
      subtitle="Turn a frustrating issue into a trackable request with the right category, a clear title, and enough context for faster action."
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card overflow-hidden border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,250,249,0.95))] p-0">
          <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(91,159,141,0.18),_transparent_42%),linear-gradient(135deg,_#fbfffe,_#f3f7f6)] px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">Complaint Composer</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Describe the issue with confidence</h2>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
                Most useful tickets include location, urgency, and who is affected.
              </div>
            </div>
          </div>

          <form className="grid gap-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Title</span>
                <input
                  className="input"
                  placeholder="Ex: Water cooler on Hostel Block B ground floor is leaking"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Category</span>
                <select className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Faculty picker — shown only for Faculty category */}
            {formData.category === FACULTY_ONLY && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                  <p className="text-sm font-semibold text-rose-800">Private Ticket — Assign to Faculty Member</p>
                </div>
                <p className="text-xs text-rose-600 mb-3">
                  This complaint will only be visible to you, the selected faculty member, and admin. Please choose carefully.
                </p>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">Select Faculty Member</span>
                  {loadingFaculty ? (
                    <div className="input flex items-center gap-2 text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 inline-block" />
                      Loading faculty...
                    </div>
                  ) : (
                    <select
                      className="input"
                      value={formData.assignedFaculty}
                      onChange={(e) => setFormData({ ...formData, assignedFaculty: e.target.value })}
                    >
                      <option value="">— Select a faculty member —</option>
                      {facultyList.map((f) => (
                        <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                      ))}
                    </select>
                  )}
                  {!loadingFaculty && facultyList.length === 0 && (
                    <p className="mt-2 text-xs text-rose-600">No faculty accounts found. Please contact the administrator.</p>
                  )}
                </label>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Detailed description</span>
              <textarea
                className="input min-h-52"
                placeholder="What happened, where did it happen, since when, and how is it affecting students?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <InsightCard label="Visibility" value={visibility.label} colorClass={visibility.color} />
              <InsightCard label="Title length" value={`${formData.title.trim().length} chars`} colorClass="bg-slate-50 text-slate-800 border-slate-200" />
              <InsightCard label="Details written" value={`${formData.description.trim().split(/\s+/).filter(Boolean).length} words`} colorClass="bg-amber-50 text-amber-800 border-amber-100" />
            </div>

            {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">After submission, you can track status updates and continue the conversation in your ticket list.</p>
              <button className="btn-primary w-full md:w-fit" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(160deg,_#0d1728_0%,_#183444_100%)] p-6 text-white shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Live Preview</p>
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">{formData.category}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${visibility.color}`}>{visibility.label}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold leading-tight">
                {formData.title.trim() || "Your complaint title will appear here"}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                {formData.description.trim() || "Add detailed context so admins can understand the issue, assign priority, and resolve it quickly."}
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <PreviewRow label="Current category note" value={categoryGuidance[formData.category]} />
              <PreviewRow label="Expected workflow" value="Submitted → Reviewed → In Progress → Resolved" />
            </div>
          </section>

          <section className="card border-white/70 bg-white/80">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">Visibility rules</p>
            <div className="mt-5 space-y-4">
              <TipBlock
                title="🔒 Faculty tickets are private"
                text="When you pick the Faculty category, only you, the selected faculty member, and admin can see this ticket."
              />
              <TipBlock
                title="🌐 Other categories are general"
                text="Hostel, IT, Canteen, Campus and similar tickets go to the general admin queue and are resolved by relevant staff."
              />
              <TipBlock
                title="Keep the title direct"
                text="Lead with the actual problem, not a generic phrase like 'Please help' or 'Urgent issue'."
              />
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
};

const InsightCard = ({ label, value, colorClass }) => (
  <div className={`rounded-3xl border p-4 ${colorClass}`}>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{label}</p>
    <p className="mt-2 text-lg font-semibold">{value}</p>
  </div>
);

const PreviewRow = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm text-slate-100">{value}</p>
  </div>
);

const TipBlock = ({ title, text }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

export default SubmitTicketPage;
