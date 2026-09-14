import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../lib/navigation";
import AuthLayout from "../components/AuthLayout";
import GoogleButton from "../components/GoogleButton";
import { Skeleton, ErrorState } from "../components/States";
export default function LoginPage() {
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
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      notify("Welcome back, " + data.user.name.split(" ")[0] + ".");
      navigate(homeFor(data.user.role), { replace: true });
    } catch (err) {
      const text =
        err.response?.data?.message ||
        "We couldn't sign you in. Check your connection and try again.";
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
    <AuthLayout showBook showThemeToggle={false}>
      <p className="eyebrow">WELCOME BACK</p>
      <h2>Make yourself at home.</h2>
      <p className="auth-subtitle">Sign in to your campus workspace.</p>
      <GoogleButton disabled={busy} />
      <div className="auth-divider">
        <span>or continue with email</span>
      </div>
      <form className="form-stack" onSubmit={submit}>
        <label htmlFor="email">
          College email
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="you@college.edu"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label htmlFor="password">
          Password
          <div className="password-field">
            <input
              id="password"
              className="input"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && (
          <div className="inline-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn-primary full-width" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        New to Campusdesk? <Link to="/register">Create an account</Link>
      </p>
      <p className="auth-note">
        Students, faculty, and administrators share one workspace.
        <br />
        Your account takes you to the right place.
      </p>
    </AuthLayout>
  );
}
