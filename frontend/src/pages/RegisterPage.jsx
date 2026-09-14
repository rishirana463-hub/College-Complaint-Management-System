import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../lib/navigation";
import AuthLayout from "../components/AuthLayout";
import GoogleButton from "../components/GoogleButton";
import { ErrorState, Skeleton } from "../components/States";
export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated,
    auth,
    loading,
    sessionError,
    retrySession,
    logout,
  } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      login(data);
      notify("Your student account is ready. Welcome!");
      navigate(homeFor(data.user.role), { replace: true });
    } catch (err) {
      const text =
        err.response?.data?.message ||
        "We couldn't create your account. Please try again.";
      setError(text);
      notify(text, "error");
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <div className="session-screen">
        <Skeleton />
      </div>
    );
  if (sessionError)
    return (
      <div className="session-screen">
        <ErrorState message={sessionError} retry={retrySession} />
        <button className="btn-secondary" onClick={logout}>
          Back to sign in
        </button>
      </div>
    );
  if (isAuthenticated) return <Navigate to={homeFor(auth.user.role)} replace />;
  return (
    <AuthLayout>
      <p className="eyebrow">JOIN YOUR CAMPUS</p>
      <h2>Your voice belongs here.</h2>
      <p className="auth-subtitle">Create a student account to get started.</p>
      <GoogleButton disabled={busy} />
      <div className="auth-divider">
        <span>or register with email</span>
      </div>
      <form className="form-stack" onSubmit={submit}>
        <label htmlFor="name">
          Full name
          <input
            id="name"
            className="input"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label htmlFor="email">
          College email
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            required
            placeholder="you@college.edu"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label htmlFor="password">
          Password
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span className="field-hint">
            Choose a password you don't use anywhere else.
          </span>
        </label>
        {error && (
          <div className="inline-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn-primary full-width" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <p className="auth-note">
        Faculty and admin access is assigned by your college administrator.
      </p>
    </AuthLayout>
  );
}
