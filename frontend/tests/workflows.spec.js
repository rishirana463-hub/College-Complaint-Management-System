import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page, role = "admin") {
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
async function accessibility(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
}
test("board saves real status changes, saved views persist, and exports download", async ({
  page,
}) => {
  await login(page);
  await page.goto("/tickets?view=board&category=IT");
  const move = page.getByRole("combobox", {
    name: "Move Wi-Fi connectivity in Hostel Block A",
    exact: true,
  });
  await move.selectOption("Resolved");
  await expect(
    page
      .getByRole("region", { name: "Resolved column" })
      .getByRole("link", {
        name: "Wi-Fi connectivity in Hostel Block A",
        exact: true,
      }),
  ).toBeVisible();
  await page.reload();
  await expect(move).toHaveValue("Resolved");
  await move.selectOption("In Progress");
  await expect(
    page
      .getByRole("region", { name: "In Progress column" })
      .getByRole("link", {
        name: "Wi-Fi connectivity in Hostel Block A",
        exact: true,
      }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await page.getByLabel("View name").fill("IT board");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save view", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.getByRole("button", { name: "IT board", exact: true }).click();
  await expect(page).toHaveURL(/view=board/);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/campusdesk-tickets-.*\.csv/);
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain("Wi-Fi connectivity");
  expect(csv).not.toContain("Water cooler");
  await accessibility(page);
  await page.screenshot({
    path: "artifacts/workspace-board.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete saved view IT board" })
    .click();
  await expect(
    page.getByRole("button", { name: "IT board", exact: true }),
  ).toHaveCount(0);
});

test("bulk updates require confirmation and appear in the activity timeline", async ({
  page,
}) => {
  await login(page);
  await page.goto("/tickets?category=Hostel");
  await page
    .getByRole("checkbox", {
      name: "Select Water cooler needs maintenance",
      exact: true,
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Select Hostel common room fan",
      exact: true,
    })
    .check();
  await page
    .getByRole("combobox", { name: "Bulk status", exact: true })
    .selectOption("In Progress");
  await page.getByRole("button", { name: "Apply status" }).click();
  await expect(
    page.getByRole("dialog", { name: "Update selected tickets?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm update" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "2 tickets updated." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Water cooler needs maintenance", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("In Progress");
  await expect(
    page.getByText("Status: Pending -> In Progress", { exact: true }),
  ).toBeVisible();
});

test("deadlines persist, overdue filters work, and inbox reads survive refresh", async ({
  page,
}) => {
  await login(page);
  await page.goto("/tickets?category=Hostel");
  await page
    .getByRole("link", { name: "Water cooler needs maintenance", exact: true })
    .click();
  await page.getByLabel("Set deadline").fill("2025-01-01T12:00");
  await page.getByRole("button", { name: "Save deadline" }).click();
  await expect(
    page.getByText("Deadline updated", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Set deadline")).toHaveValue("2025-01-01T12:00");
  await page.goto("/tickets?overdue=true&view=board");
  await expect(page.getByText("Overdue Jan 1")).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "student");
  await page.goto("/inbox");
  await expect(
    page.getByText("Deadline updated", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark all read", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unread (0)", exact: true }),
  ).toBeVisible();
  await accessibility(page);
  await page.screenshot({ path: "artifacts/inbox.png", fullPage: true });
});

test("insights have real date filters, accessible data, and mobile board fits", async ({
  page,
}) => {
  await login(page);
  await page.goto("/analytics");
  await expect(
    page.getByRole("heading", { name: "When campus needs a hand" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Reporting period" })
    .selectOption("7");
  await expect(page.getByText(/requests \/ 7 days/)).toBeVisible();
  await page.getByText("View accessible data table").click();
  await expect(
    page.getByRole("table", { name: "Daily ticket submissions" }),
  ).toBeVisible();
  await accessibility(page);
  await page.screenshot({ path: "artifacts/insights.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tickets?view=board");
  await expect(
    page.getByRole("region", { name: "Pending column" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await accessibility(page);
  await page.screenshot({ path: "artifacts/board-mobile.png", fullPage: true });
});

test("command search finds actual tickets and students cannot manage board status", async ({
  page,
}) => {
  await login(page, "student");
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search commands").fill("water cooler");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Water cooler needs maintenance/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Water cooler needs maintenance",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveCount(0);
  await page.goto("/tickets?view=board");
  await expect(
    page.getByRole("region", { name: "In Progress column" }),
  ).toBeVisible();
  await expect(page.locator(".board-move")).toHaveCount(0);
});
