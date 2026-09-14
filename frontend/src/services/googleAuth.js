const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const googleConfigured = Boolean(url && key);
let clientPromise;
export function getAuthClient() {
  if (!googleConfigured)
    throw new Error(
      "Google sign-in isn't available yet. Please use email and password.",
    );
  clientPromise ||= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    }),
  );
  return clientPromise;
}
export async function startGoogleSignIn() {
  const client = await getAuthClient();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}
let exchangePromise;
export function exchangeGoogleCode(code) {
  // A callback code is single-use; share the request across StrictMode remounts.
  exchangePromise ||= getAuthClient().then(async (client) => {
    const { data, error } = code
      ? await client.auth.exchangeCodeForSession(code)
      : await client.auth.getSession();
    if (error || !data.session)
      throw (
        error ||
        new Error("Your sign-in link has expired. Please sign in again.")
      );
    return data.session.access_token;
  });
  return exchangePromise;
}
export async function clearGoogleSession() {
  exchangePromise = undefined;
  if (googleConfigured) {
    const client = await getAuthClient();
    await client.auth.signOut({ scope: "local" });
  }
}
