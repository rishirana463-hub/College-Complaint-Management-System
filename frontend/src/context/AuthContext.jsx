import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem("ccms_auth");
    return stored ? JSON.parse(stored) : { user: null, token: null };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncProfile = async () => {
      if (!auth.token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/profile");
        const updatedAuth = { ...auth, user: data };
        setAuth(updatedAuth);
        localStorage.setItem("ccms_auth", JSON.stringify(updatedAuth));
      } catch (_error) {
        localStorage.removeItem("ccms_auth");
        setAuth({ user: null, token: null });
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
  }, []);

  const saveAuth = (payload) => {
    setAuth(payload);
    localStorage.setItem("ccms_auth", JSON.stringify(payload));
  };

  const logout = () => {
    localStorage.removeItem("ccms_auth");
    setAuth({ user: null, token: null });
  };

  const value = useMemo(
    () => ({
      auth,
      loading,
      login: saveAuth,
      logout,
      isAuthenticated: Boolean(auth.token),
    }),
    [auth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
