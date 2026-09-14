export async function verifyGoogleIdentity(
  accessToken,
  {
    fetchImpl = fetch,
    url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY,
  } = {},
) {
  if (!url || !key)
    throw Object.assign(
      new Error(
        "Google sign-in is not configured yet. Please use email sign-in.",
      ),
      { status: 503 },
    );
  if (
    typeof accessToken !== "string" ||
    !accessToken ||
    accessToken.length > 16000
  )
    throw Object.assign(new Error("A Google session is required."), {
      status: 400,
    });
  let response;
  try {
    response = await fetchImpl(url.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { apikey: key, Authorization: "Bearer " + accessToken },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw Object.assign(
      new Error("The sign-in provider couldn't be reached. Please try again."),
      { status: 503 },
    );
  }
  if (!response.ok)
    throw Object.assign(
      new Error(
        response.status >= 500
          ? "The sign-in provider is temporarily unavailable."
          : "Your Google session expired. Please sign in again.",
      ),
      { status: response.status >= 500 ? 503 : 401 },
    );
  const identity = await response.json();
  const google = identity.identities?.find(
    (item) => item.provider === "google",
  );
  if (
    !identity.id ||
    !identity.email ||
    !identity.email_confirmed_at ||
    !google ||
    google.identity_data?.email_verified !== true ||
    google.identity_data?.email?.toLowerCase() !== identity.email.toLowerCase()
  ) {
    throw Object.assign(
      new Error("Please sign in with a verified Google account."),
      { status: 401 },
    );
  }
  return {
    id: identity.id,
    email: identity.email.trim().toLowerCase(),
    name:
      google.identity_data.full_name ||
      google.identity_data.name ||
      identity.email.split("@")[0],
  };
}
