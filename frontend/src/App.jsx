import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Skeleton } from "./components/States";
import { useAuth } from "./context/AuthContext";
import { homeFor } from "./lib/navigation";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SubmitTicketPage = lazy(() => import("./pages/SubmitTicketPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
export default function App() {
  const { auth, isAuthenticated, loading } = useAuth();
  return (
    <Suspense
      fallback={
        <div className="session-screen">
          <Skeleton />
        </div>
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            loading ? (
              <div className="session-screen">
                <Skeleton />
              </div>
            ) : (
              <Navigate
                to={isAuthenticated ? homeFor(auth.user.role) : "/login"}
                replace
              />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route
          element={
            <ProtectedRoute allowedRoles={["student", "faculty", "admin"]} />
          }
        >
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/submit" element={<SubmitTicketPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<DashboardPage />} />
            </Route>
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/inbox" element={<ActivityPage key="inbox" inbox />} />
            <Route path="/activity" element={<ActivityPage key="activity" />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
