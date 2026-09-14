import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function settleDashboard(page) {
  await page.locator(".metric-strip").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".blur-word")].every(
      (el) =>
        getComputedStyle(el).filter === "blur(0px)" ||
        getComputedStyle(el).filter === "none",
    ),
  );
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".metric-value")].length === 4 &&
      [...document.querySelectorAll(".metric-value")].every(
        (node) =>
          node.querySelector("[aria-hidden]")?.textContent ===
          node.querySelector(".sr-only")?.textContent,
      ),
  );
  for (const button of await page
    .getByRole("button", { name: "Dismiss notification" })
    .all())
    await button.click();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function login(page, role = "student") {
  const users = {
    student: ["rahul@test.college", "student123"],
    admin: ["admin@test.college", "admin123"],
    faculty: ["faculty@test.college", "faculty123"],
  };
  await page.goto("/login");
  await page.getByLabel("College email").fill(users[role][0]);
  await page.getByLabel("Password", { exact: true }).fill(users[role][1]);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(
    role === "admin"
      ? /\/admin$/
      : role === "faculty"
        ? /\/tickets$/
        : /\/dashboard$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
test("student overview, filter drill-down, persistence, and sign-out", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await expect(page.getByText("PRIORITY DESK", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Total tickets/ })).toContainText(
    "8",
  );
  await settleDashboard(page);
  await page.screenshot({
    path: "artifacts/dashboard-light.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /Pending review/ }).click();
  await expect(page).toHaveURL(/status=Pending/);
  await expect(page.getByRole("table")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "My tickets" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});
test("theme persists, command palette supports keyboard, and role routes are gated", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByText("PRIORITY DESK", { exact: true })).toBeVisible();
  await settleDashboard(page);
  await page.screenshot({
    path: "artifacts/dashboard-dark.png",
    fullPage: true,
  });
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Quick navigation" }),
  ).toBeVisible();
  await page.getByLabel("Search commands").fill("tickets");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tickets$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});
test("complaint submission and failed reply preserve the user's draft", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("link", { name: "New complaint", exact: true })
    .first()
    .click();
  await page
    .getByLabel("What needs attention?")
    .fill("Browser test: campus printer");
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("IT");
  await page
    .getByLabel("What happened?")
    .fill("Printer in the library is out of paper.");
  await page.getByRole("button", { name: "Submit complaint" }).click();
  await expect(page).toHaveURL(/\/tickets\/[a-f0-9]+$/);
  await expect(
    page.getByRole("heading", { name: "Browser test: campus printer" }),
  ).toBeVisible();
  await page.getByLabel("Add a reply").fill("Please check tray two.");
  await page.route("**/api/tickets/*/comments", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Test reply failure" }),
    }),
  );
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByLabel("Add a reply")).toHaveValue(
    "Please check tray two.",
  );
  await expect(page.getByRole("alert").first()).toBeVisible();
  await page.unroute("**/api/tickets/*/comments");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(
    page.getByText("Please check tray two.", { exact: true }),
  ).toBeVisible();
});
test("search has an empty state and data errors provide retry", async ({
  page,
}) => {
  await login(page);
  await page.goto("/tickets?search=nothing-matches-94623");
  await expect(
    page.getByRole("heading", { name: "No tickets match your filters" }),
  ).toBeVisible();
  await page.route("**/api/tickets?*", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Test load failure" }),
    }),
  );
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Something didn't load" }),
  ).toBeVisible();
  await page.unroute("**/api/tickets?*");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
test("faculty can only see assigned complaints and update status", async ({
  page,
}) => {
  await login(page, "faculty");
  await expect(
    page.getByRole("link", {
      name: "Request for assignment feedback",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Wi-Fi connectivity in Hostel Block A",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Request for assignment feedback", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("In Progress");
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("In Progress");
  await expect(
    page.getByRole("status").filter({ hasText: "Ticket status updated." }),
  ).toBeVisible();
});
test("admin summary, ticket controls, and accessibility in both themes", async ({
  page,
}) => {
  await login(page, "admin");
  await expect(page.getByText("PRIORITY DESK", { exact: true })).toBeVisible();
  await settleDashboard(page);
  await page.screenshot({
    path: "artifacts/admin-dashboard.png",
    fullPage: true,
  });
  const light = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(light.violations).toEqual([]);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  const dark = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(dark.violations).toEqual([]);
  await page
    .getByRole("link", { name: "Open the priority workspace", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Wi-Fi connectivity in Hostel Block A",
      exact: true,
    })
    .click();
  await page
    .getByRole("combobox", { name: "Priority", exact: true })
    .selectOption("Medium");
  await expect(
    page.getByRole("combobox", { name: "Priority", exact: true }),
  ).toHaveValue("Medium");
});
test("mobile navigation closes with Escape and pages do not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.getByText("PRIORITY DESK", { exact: true })).toBeVisible();
  await settleDashboard(page);
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Navigation", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Navigation", exact: true }),
  ).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "My tickets", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
});
test("reduced motion, registration, Google configuration and callback errors", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByLabel("Full name").fill("Browser New Student");
  await page.getByLabel("College email").fill("browser-new@test.college");
  await page.getByLabel("Password").fill("student123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Your workspace is ready" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/auth/callback?error=access_denied");
  await expect(
    page.getByRole("heading", { name: "Let's try that again" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: "artifacts/login.png", fullPage: true });
});
