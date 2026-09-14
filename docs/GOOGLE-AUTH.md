# Google Sign-In Setup

Campusdesk keeps tickets and all application profiles in MongoDB. Supabase is used only as the Google authentication broker. No PostgreSQL migration is required.

## 1. Create and configure Supabase

1. Create a Supabase project.
2. In Project Settings / API, find the project URL and publishable key (the legacy public anon key also works). These are the only Supabase values the application needs.
3. In Authentication / Sign In / Providers, enable Google.
4. In Google Cloud, configure the OAuth consent screen and create a Web application OAuth client. Use the basic openid, email, and profile scopes.
5. Add the Supabase callback URL shown on its Google provider page to Google's authorized redirect URIs, typically https://YOUR_PROJECT.supabase.co/auth/v1/callback.
6. Enter the Google client ID and client secret in Supabase's Google provider configuration. The Google client secret belongs in Supabase, never in a VITE variable.
7. Add http://localhost:5173/auth/callback and your production https://YOUR_DOMAIN/auth/callback to Supabase's redirect allow list. Set its Site URL to your production frontend URL.
8. If Google's consent screen is in testing mode, add the Google accounts you will use as test users.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-google

## 2. Configure the app

Add these values to frontend/.env and the Vercel frontend environment:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Add the matching values to backend/.env and the backend hosting environment:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
CLIENT_URL=http://localhost:5173
```

Keep the existing MONGO_URI. Set JWT_SECRET to a long, random secret before production. Never put a service-role key or database password in frontend environment variables. Restart both development servers after environment changes; rebuild/redeploy the frontend after changing VITE variables.

Until configuration exists, the Google button is visibly unavailable and email login keeps working. No fake Google login is used.

## 3. Verify the lifecycle

1. Use a Google account with no existing Campusdesk profile. Click Continue with Google, complete consent, and confirm that you land on the student overview.
2. Refresh and confirm that you remain signed in. The API verifies the app session and loads the role from MongoDB.
3. Sign out, then sign in with Google again. Confirm the same profile and tickets appear.
4. For an existing password account, sign in normally first. Open the account menu in the top bar, choose Connect Google, and use the matching Google email. This proves ownership before linking and preserves the account's tickets and staff role.
5. Cancel a Google sign-in and confirm that the callback gives a clear route back to login.
6. Attempt an admin URL from a student session and confirm that it returns to the student's home.

The API verifies the Supabase access token with its trusted /auth/v1/user endpoint, requires a confirmed Google identity, and ignores browser-supplied roles. New profiles are always students. Existing emails are never silently linked without an authenticated session for that account.

## Staff roles

Public registration no longer lets visitors grant themselves faculty or admin privileges. Existing staff accounts are preserved. To promote an existing account, a trusted operator runs this from backend with the correct MONGO_URI:

```sh
npm run set-role -- teacher@college.edu faculty
npm run set-role -- administrator@college.edu admin
```

This uses database access on the backend machine; there is no public role-promotion endpoint. Refresh or sign in again after a role change.

## Deployment

Set Vercel's Root Directory to frontend, Build Command to npm run build, and Output Directory to dist. frontend/vercel.json handles direct links to authenticated routes and /auth/callback.

The Express server needs a separate Node host with access to MongoDB Atlas. VITE_API_URL must point to its HTTPS /api URL; CLIENT_URL must equal the frontend's exact HTTPS origin. Atlas's IP access list must allow the backend host. Opening Atlas or Compass is not required for the app to run.

## Sessions

Application sessions use the existing 7-day JWT format. Refresh revalidates the token against the backend. Sign-out removes the local application session, clears the local Supabase session, and synchronizes other tabs. As with the original JWT architecture, copied app tokens remain valid until expiry; server-side token revocation is not implemented. A temporary API outage shows a retry screen rather than silently discarding the stored login.

