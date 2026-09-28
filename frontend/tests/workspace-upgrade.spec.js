import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page, role = "admin") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await page
    .getByLabel("College email")
    .fill(role === "admin" ? "admin@test.college" : "rahul@test.college");
  await page
    .getByLabel("Password", { exact: true })
    .fill(role === "admin" ? "admin123" : "student123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(role === "admin" ? /\/admin$/ : /\/dashboard$/);
}

test("priority desk opens exactly the open high-priority or overdue tickets", async ({
  page,
}) => {
  await login(page);
  const base = {
    category: "IT",
    createdAt: new Date().toISOString(),
    description: "Example issue",
    activity: [],
    userId: { name: "Example student" },
  };
  const examples = [
    { title: "High priority", priority: "High", status: "Pending" },
    {
      title: "Past deadline",
      priority: "Low",
      status: "In Progress",
      dueAt: "2020-01-01T00:00:00.000Z",
    },
    {
      title: "Already resolved",
      priority: "High",
      status: "Resolved",
      dueAt: "2020-01-01T00:00:00.000Z",
    },
    { title: "Routine request", priority: "Medium", status: "Pending" },
  ].map((ticket, index) => ({
    ...base,
    ...ticket,
    _id: String(index + 1).padStart(24, "0"),
  }));
  await page.route(
    (url) => url.pathname === "/api/tickets",
    (route) => route.fulfill({ json: examples }),
  );
  await page.reload();
  await expect(page.locator(".priority-total")).toHaveText("2 tickets");
  await page
    .getByRole("link", { name: "View tickets needing attention" })
    .click();
  await expect(page).toHaveURL(/attention=true/);
  await expect(page.locator(".ticket-table tbody tr")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "High priority", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Past deadline", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Already resolved", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page).toHaveURL(/sort=priority/);
  await expect(page).not.toHaveURL(/attention=/);
  await expect(page.locator(".ticket-table tbody tr")).toHaveCount(4);
});

test("mobile staff can inspect, select, and filter tickets without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/tickets?category=IT&sort=oldest&view=list");
  await expect(page.locator(".ticket-table tbody tr").first()).toBeVisible();
  const row = page.locator(".ticket-table tbody tr").first();
  for (const cell of await row.locator("td").all()) {
    const box = await cell.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  await row.getByRole("checkbox").check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  const remove = page.getByRole("button", {
    name: "Remove category filter: IT",
  });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/category=/);
  await expect(page).toHaveURL(/sort=oldest/);
  await expect(page).toHaveURL(/view=list/);
  await expect(page.getByText("1 selected", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Overdue", exact: true }),
  ).toBeInViewport();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("a student's empty workspace offers a complaint action, not a filter reset", async ({
  page,
}) => {
  await login(page, "student");
  await page.route(
    (url) => url.pathname === "/api/tickets",
    (route) => route.fulfill({ json: [] }),
  );
  await page.goto("/tickets");
  await expect(
    page.getByRole("heading", { name: "No tickets yet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear filters", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".ticket-workspace")
    .getByRole("link", { name: "New complaint" })
    .click();
  await expect(page).toHaveURL(/\/submit$/);
});
