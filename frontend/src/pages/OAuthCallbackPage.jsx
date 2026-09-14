import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { exchangeGoogleCode, clearGoogleSession } from "../services/googleAuth";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../lib/navigation";
import { ErrorState, Skeleton } from "../components/States";
let completion;
function complete(code) {
  if (!code)
    return Promise.reject(
      new Error(
        "This sign-in link has expired. Please start again from the login page.",
      ),
    );
  completion ||= exchangeGoogleCode(code).then((accessToken) =>
    api.post("/auth/google", { accessToken }),
  );
  return completion;
}
export default function OAuthCallbackPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const providerError =
      params.get("error_description") || params.get("error");
    if (providerError) {
      setError(
        "Google sign-in was cancelled or declined. You can try again from the login page.",
      );
      history.replaceState(null, "", "/auth/callback");
      return;
    }
    complete(params.get("code"))
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
          history.replaceState(null, "", "/auth/callback");
        }
      });
    return () => {
      active = false;
    };
  }, []);
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
              completion = undefined;
              void clearGoogleSession();
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
