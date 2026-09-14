import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/navigation";
import { ErrorState, Skeleton } from "./States";
export default function ProtectedRoute({ allowedRoles }) {
  const { auth, loading, sessionError, retrySession, isAuthenticated, logout } =
    useAuth();
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
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.user.role))
    return <Navigate to={homeFor(auth.user.role)} replace />;
  return <Outlet />;
}
