import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", formData);
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#0f172a_0%,_#1f3a33_50%,_#dbece8_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(180deg,_#1f3a33,_#0f172a)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Campus Support</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight">Complaint tracking that actually keeps students informed.</h1>
            <p className="mt-6 max-w-lg text-base text-slate-200">
              Raise issues, follow updates, and keep every campus service request in one clean workflow.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-200">Student demo</p>
              <p className="mt-2 font-semibold">rahul@student.com / student123</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-200">Admin demo</p>
              <p className="mt-2 font-semibold">admin@college.com / admin123</p>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 md:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Welcome Back</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Login to your account</h2>
            <p className="mt-2 text-sm text-slate-500">Use your student or admin credentials to continue.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <input className="input" type="email" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <input className="input" type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button className="btn-primary w-full" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Need an account?{" "}
              <Link className="font-semibold text-brand-700" to="/register">
                Register here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
