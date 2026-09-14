import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../services/api";
import { readStored, writeStored } from "../lib/storage";
import { clearGoogleSession } from "../services/googleAuth";
const AuthContext = createContext(null);
const empty = { user: null, token: null };
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStored("ccms_auth", empty));
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const login = (payload) => {
    generation.current++;
    writeStored("ccms_auth", payload);
    setAuth(payload);
    setSessionError("");
    setLoading(false);
  };
  const logout = () => {
    generation.current++;
    writeStored("ccms_auth", null);
    setAuth(empty);
    setLoading(false);
    setSessionError("");
    void clearGoogleSession().catch(() => {});
  };
  useEffect(() => {
    const expired = () => logout();
    const sync = (event) => {
      if (event.key === "ccms_auth") {
        setAuth(readStored("ccms_auth", empty));
        setAttempt((a) => a + 1);
      }
    };
    window.addEventListener("ccms:expired", expired);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ccms:expired", expired);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    const stored = readStored("ccms_auth", empty);
    if (!stored.token) {
      setLoading(false);
      setSessionError("");
      return;
    }
    const current = ++generation.current;
    const controller = new AbortController();
    setLoading(true);
    setSessionError("");
    api
      .get("/auth/profile", { signal: controller.signal })
      .then(({ data }) => {
        if (generation.current === current) {
          const next = { token: stored.token, user: data };
          setAuth(next);
          writeStored("ccms_auth", next);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && generation.current === current)
          setSessionError(
            error.response?.data?.message ||
              "We couldn't verify your session. Check your connection and retry.",
          );
      })
      .finally(() => {
        if (generation.current === current) setLoading(false);
      });
    return () => {
      controller.abort();
      generation.current++;
    };
  }, [attempt]);
  return (
    <AuthContext.Provider
      value={{
        auth,
        loading,
        sessionError,
        retrySession: () => setAttempt((a) => a + 1),
        login,
        logout,
        isAuthenticated: Boolean(auth?.token && auth?.user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
