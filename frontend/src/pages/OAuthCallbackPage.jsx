import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  completeGoogleSignIn,
  clearGoogleSession,
} from "../services/googleAuth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../lib/navigation";
import { ErrorState, Skeleton } from "../components/States";
export default function OAuthCallbackPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    let active = true;
    // Router location survives URL cleanup and StrictMode's second effect.
    const params = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.slice(1));
    const providerError =
      params.get("error_description") ||
      params.get("error") ||
      hash.get("error_description") ||
      hash.get("error");
    setError("");
    history.replaceState(history.state, "", location.pathname);
    if (providerError) {
      setError(
        "Google sign-in was cancelled or declined. You can try again from the login page.",
      );
      return;
    }
    completeGoogleSignIn(params.get("code"), params.get("sb_flow_id"))
      .then(({ data }) => {
        if (!active) return;
        login(data);
        notify("You're signed in with Google.");
        navigate(homeFor(data.user.role), { replace: true });
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Google sign-in couldn't be completed.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [location.search, location.hash, location.pathname]);
  return (
    <div className="session-screen">
      <p className="eyebrow">GOOGLE SIGN-IN</p>
      <h1>{error ? "Let's try that again" : "Opening your workspace..."}</h1>
      {error ? (
        <>
          <ErrorState message={error} />
          <Link
            className="btn-primary"
            to="/login"
            onClick={() => {
              void clearGoogleSession().catch(() => {});
            }}
          >
            Back to sign in
          </Link>
        </>
      ) : (
        <Skeleton variant="detail" />
      )}
    </div>
  );
}
