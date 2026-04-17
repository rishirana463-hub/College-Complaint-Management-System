import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { auth, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 p-6" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user?.role)) {
    return <Navigate to={auth.user?.role === "admin" ? "/admin" : auth.user?.role === "faculty" ? "/tickets" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
