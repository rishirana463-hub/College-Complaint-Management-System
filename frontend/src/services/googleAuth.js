import api from "./api";
import { createGoogleAuthFlow, checkGoogleProvider } from "./googleAuthFlow.js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
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
  await checkGoogleProvider(url, key);
  flow.reset();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}
const flow = createGoogleAuthFlow({
  getClient: getAuthClient,
  createSession: (accessToken) => api.post("/auth/google", { accessToken }),
});
export const completeGoogleSignIn = (code, flowId) =>
  flow.complete(code, flowId);
export async function clearGoogleSession() {
  flow.reset();
  if (googleConfigured) {
    const client = await getAuthClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
}
