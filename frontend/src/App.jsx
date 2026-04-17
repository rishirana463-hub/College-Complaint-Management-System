import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SubmitTicketPage from "./pages/SubmitTicketPage";
import TicketsPage from "./pages/TicketsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { auth, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? (auth.user?.role === "admin" ? "/admin" : auth.user?.role === "faculty" ? "/tickets" : "/dashboard") : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit" element={<SubmitTicketPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["student", "admin", "faculty"]} />}>
        <Route path="/tickets" element={<TicketsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>
    </Routes>
  );
};

export default App;
