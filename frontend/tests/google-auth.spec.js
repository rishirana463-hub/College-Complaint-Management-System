import { test, expect } from "@playwright/test";

const provider = "https://campusdesk-auth.example";
async function mockProvider(page) {
  const calls = { exchanges: 0, sessions: 0 };
  await page.route(`${provider}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/settings"))
      return route.fulfill({ json: { external: { google: true } } });
    if (url.pathname.endsWith("/authorize")) {
      expect(url.searchParams.get("provider")).toBe("google");
      expect(url.searchParams.get("code_challenge")).toBeTruthy();
      const callback = new URL(url.searchParams.get("redirect_to"));
      expect(callback.origin).toBe("http://127.0.0.1:4173");
      expect(callback.pathname).toBe("/auth/callback");
      callback.searchParams.set("code", `test-code-${calls.exchanges + 1}`);
      return route.fulfill({
        status: 302,
        headers: { location: callback.href },
      });
    }
    if (url.pathname.endsWith("/token")) {
      calls.exchanges++;
      expect(route.request().postDataJSON().code_verifier).toBeTruthy();
      return route.fulfill({
        json: {
          access_token: "mock-provider-access-token",
          refresh_token: "mock-provider-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            email: "rahul@test.college",
          },
        },
      });
    }
    if (url.pathname.endsWith("/logout")) return route.fulfill({ status: 204 });
    return route.abort();
  });
  await page.route("**/api/auth/google", async (route) => {
    calls.sessions++;
    expect(route.request().postDataJSON()).toEqual({
      accessToken: "mock-provider-access-token",
    });
    // Only the isolated fixture API is used; no real provider or database traffic.
    const response = await page.request.post(
      "http://127.0.0.1:5101/api/auth/login",
      {
        data: { email: "rahul@test.college", password: "student123" },
      },
    );
    expect(response.ok()).toBeTruthy();
    return route.fulfill({ json: await response.json() });
  });
  return calls;
}

test("Google button completes PKCE, persists login, and supports signing in again", async ({
  page,
}) => {
  const calls = await mockProvider(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(calls).toEqual({ exchanges: 1, sessions: 1 });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(calls).toEqual({ exchanges: 2, sessions: 2 });
});

test("provider outage stays on login and lets the user retry", async ({
  page,
}) => {
  await mockProvider(page);
  await page.route(`${provider}/auth/v1/settings`, (route) => route.abort());
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Continue with Google" });
  await button.click();
  await expect(
    page.getByText(/can't reach the authentication service/),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(button).toBeEnabled();
  await page.unroute(`${provider}/auth/v1/settings`);
  await button.click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("cancelled and missing-code callbacks never exchange credentials", async ({
  page,
}) => {
  const calls = await mockProvider(page);
  for (const suffix of ["?error=access_denied", "#error=access_denied"]) {
    await page.goto(`/auth/callback${suffix}`);
    await expect(page.getByText(/cancelled or declined/)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/callback$/);
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  }
  await page.goto("/auth/callback");
  await expect(page.getByText(/sign-in link has expired/)).toBeVisible();
  expect(calls).toEqual({ exchanges: 0, sessions: 0 });
});

test("account-link errors are displayed and a new attempt can succeed", async ({
  page,
}) => {
  const calls = await mockProvider(page);
  await page.route("**/api/auth/google", (route) =>
    route.fulfill({
      status: 409,
      json: {
        message: "Sign in with your password, then choose Connect Google.",
      },
    }),
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(
    page.getByText(/Sign in with your password, then choose Connect Google/),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.unroute("**/api/auth/google");
  await page.route("**/api/auth/google", async (route) => {
    const response = await page.request.post(
      "http://127.0.0.1:5101/api/auth/login",
      {
        data: { email: "rahul@test.college", password: "student123" },
      },
    );
    return route.fulfill({ json: await response.json() });
  });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(calls.exchanges).toBe(2);
});
