import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", formData);
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : data.user.role === "faculty" ? "/tickets" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(140deg,_#eef6f3_0%,_#dbece8_40%,_#0f172a_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-[36px] bg-white p-6 shadow-soft md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Create Account</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Join the complaint management portal</h1>
        <p className="mt-2 text-sm text-slate-500">Register as a student or admin and start managing tickets.</p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input className="input md:col-span-2" placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <select className="input md:col-span-2" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">{error}</p>}
          <button className="btn-primary md:col-span-2" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-semibold text-brand-700" to="/login">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
