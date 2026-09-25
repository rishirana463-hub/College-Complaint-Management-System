export function createGoogleAuthFlow({ getClient, createSession }) {
  let attempt;
  let generation = 0;

  return {
    reset() {
      generation++;
      attempt = undefined;
    },
    complete(code, flowId) {
      if (typeof code !== "string" || !code.trim())
        return Promise.reject(
          new Error(
            "This sign-in link has expired. Please start again from the login page.",
          ),
        );
      // Share single-use exchanges across StrictMode effects, never across logins.
      if (attempt?.code === code && attempt.flowId === flowId)
        return attempt.promise;
      const current = ++generation;
      const assertCurrent = () => {
        if (current !== generation)
          throw new Error(
            "This sign-in attempt was cancelled. Please sign in again.",
          );
      };
      const promise = Promise.resolve().then(async () => {
        const client = await getClient();
        assertCurrent();
        const { data, error } = await client.auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
        assertCurrent();
        if (error) throw error;
        if (!data?.session?.access_token)
          throw new Error(
            "Your sign-in link has expired. Please sign in again.",
          );
        const session = await createSession(data.session.access_token);
        assertCurrent();
        return session;
      });
      attempt = { code, flowId, promise };
      return promise;
    },
  };
}

export async function checkGoogleProvider(url, key, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Google sign-in can't reach the authentication service. Check your connection; the app's Supabase project URL may need correcting. Email sign-in is still available.",
    );
  }
  if (response.status === 401 || response.status === 403)
    throw new Error(
      "Google sign-in configuration needs attention: check the Supabase project URL and public key.",
    );
  if (!response.ok)
    throw new Error(
      "The sign-in provider is temporarily unavailable. Please try again or use email sign-in.",
    );
  let settings;
  try {
    settings = await response.json();
  } catch {
    throw new Error(
      "The authentication service returned an invalid response. Please use email sign-in and check the Supabase project URL.",
    );
  }
  if (settings?.external?.google !== true)
    throw new Error(
      "Google sign-in is not enabled for this Supabase project. Enable Google in Authentication / Sign In / Providers, or use email sign-in.",
    );
}
