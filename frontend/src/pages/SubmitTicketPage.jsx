import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, LockKeyhole, Send, Lightbulb } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import api from "../services/api";
import useResource from "../hooks/useResource";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "../components/States";
import { categories } from "../lib/navigation";
import SpotlightCard from "../components/reactbits/SpotlightCard";
export default function SubmitTicketPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Hostel",
    assignedFaculty: "",
    location: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isPrivate = form.category === "Faculty";
  const faculty = useResource("/tickets/faculty-users", { enabled: isPrivate });
  const reduced = useReducedMotion();
  const set = (field, value) =>
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "category" ? { assignedFaculty: "" } : {}),
    }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Please add a title and description.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/tickets", {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        assignedFaculty: isPrivate ? form.assignedFaculty : undefined,
      });
      notify("Complaint submitted. You can track it here.");
      navigate("/tickets/" + data._id);
    } catch (err) {
      const text =
        err.response?.data?.message ||
        "We couldn't submit your complaint. Your details are still here.";
      setError(text);
      notify(text, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="LET'S MAKE IT BETTER"
        title="New complaint"
        subtitle="Tell us what's happening. We'll help you keep track of what happens next."
      />
      <div className="composer-grid">
        <form className="panel complaint-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <h2>Describe your issue</h2>
              <p>A few clear details can make all the difference.</p>
            </div>
            <span className="subtle-tag">New request</span>
          </div>
          <div className="panel-padding form-stack">
            <label htmlFor="title">
              What needs attention?
              <input
                id="title"
                className="input"
                placeholder="e.g. Wi-Fi is down in Hostel Block A"
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              <span className="field-hint">
                Keep the title specific and easy to scan.{" "}
                <span>{form.title.length}/160</span>
              </span>
            </label>
            <label htmlFor="category">
              Category
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  className="faculty-picker"
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduced ? undefined : { opacity: 0, height: 0 }}
                >
                  <div className="info-box">
                    <LockKeyhole size={18} />
                    <p>
                      Private request: only you, the selected faculty member,
                      and administrators can see it.
                    </p>
                  </div>
                  {faculty.loading ? (
                    <Skeleton variant="field" />
                  ) : faculty.error ? (
                    <ErrorState
                      message={faculty.error}
                      retry={faculty.reload}
                    />
                  ) : faculty.data?.length ? (
                    <label htmlFor="faculty">
                      Assign to a faculty member
                      <select
                        id="faculty"
                        className="input"
                        value={form.assignedFaculty}
                        required
                        onChange={(e) => set("assignedFaculty", e.target.value)}
                      >
                        <option value="">Select faculty</option>
                        {faculty.data.map((person) => (
                          <option key={person._id} value={person._id}>
                            {person.name} ({person.email})
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <EmptyState
                      compact
                      title="No faculty members available"
                      description="Please contact your administrator to set up a faculty account before submitting this category."
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <label htmlFor="description">
              <span className="sr-only">Issue details</span>
              What happened?
              <textarea
                id="description"
                className="input"
                required
                rows={7}
                maxLength={10000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Where is the issue? When did it start? Who is affected? Include anything the team needs to know."
              />
              <span className="field-hint">
                Please avoid sharing passwords or sensitive personal
                information.
              </span>
            </label>
            <label htmlFor="location">
              Location (optional)
              <input
                id="location"
                className="input"
                maxLength={180}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Building, floor, room or campus area"
              />
              <span className="field-hint">
                A precise location helps the team find the issue.
              </span>
            </label>
            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}
            <div className="form-footer">
              <Link className="btn-secondary" to="/tickets">
                Cancel
              </Link>
              <button
                className="btn-primary"
                disabled={
                  busy ||
                  (isPrivate &&
                    (faculty.loading ||
                      Boolean(faculty.error) ||
                      !form.assignedFaculty))
                }
              >
                <Send size={16} />
                {busy ? "Submitting..." : "Submit complaint"}
              </button>
            </div>
          </div>
        </form>
        <aside className="page-stack">
          <SpotlightCard className="preview-card">
            <p className="eyebrow">LIVE PREVIEW</p>
            <div className="preview-labels">
              <span className="subtle-tag">{form.category}</span>
              {isPrivate && (
                <span>
                  <LockKeyhole size={12} />
                  Private
                </span>
              )}
            </div>
            <h2>
              {form.title.trim() || "Your next step toward a better campus."}
            </h2>
            <p className="preview-description">
              {form.description.trim() ||
                "Your complaint preview will appear here as you add details."}
            </p>
            <div className="preview-status">
              <span className="live-dot" />
              Ready when you are
            </div>
          </SpotlightCard>
          <section className="panel panel-padding">
            <div className="section-title">
              <Lightbulb size={20} />
              <h2>A helpful report includes</h2>
            </div>
            <ul className="tips-list">
              {[
                "A precise location or room number",
                "When the issue started",
                "How it affects you or others",
                "Any steps you've already tried",
              ].map((tip) => (
                <li key={tip}>
                  <Check size={16} />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
          <section className="next-steps">
            <h3>What happens next?</h3>
            <p>
              Submitted <ArrowRight size={12} /> Reviewed{" "}
              <ArrowRight size={12} /> Resolved
            </p>
            <span>Follow updates and reply from your ticket page.</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
