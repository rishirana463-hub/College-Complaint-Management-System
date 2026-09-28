import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page, role = "student") {
  await page.goto("/login");
  await page
    .getByLabel("College email")
    .fill(role === "student" ? "rahul@test.college" : role + "@test.college");
  await page.getByLabel("Password", { exact: true }).fill(role + "123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(
    role === "student"
      ? /\/dashboard$/
      : role === "admin"
        ? /\/admin$/
        : /\/tickets$/,
  );
}

test("dock magnifies near the pointer and supports keyboard page navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const dock = page.getByRole("navigation", { name: "Dock navigation" });
  const tickets = dock.getByRole("link", { name: "My tickets", exact: true });
  const tile = tickets.locator(".magnetic-dock-tile");
  await tickets.hover();
  await expect
    .poll(() =>
      tile.evaluate(
        (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
      ),
    )
    .toBeGreaterThan(1.1);
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      tile.evaluate(
        (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
      ),
    )
    .toBeLessThan(1.01);
  await tickets.focus();
  await expect(tickets.locator(".magnetic-dock-tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tickets.locator(".magnetic-dock-tooltip")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(
    dock.getByRole("link", { name: "New complaint", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/submit$/);
  await expect(
    dock.getByRole("link", { name: "New complaint", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Home");
  await expect(
    dock.getByRole("link", { name: "Overview", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    dock.getByRole("link", { name: "Activity log", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    dock.getByRole("link", { name: "Overview", exact: true }),
  ).toBeFocused();
});

test("dock stays still in reduced motion, tracks detail routes, and exposes unread updates", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.route("**/api/tickets/inbox", (route) =>
    route.fulfill({ json: [{ _id: "unread-example", read: false }] }),
  );
  await page.reload();
  const dock = page.getByRole("navigation", { name: "Dock navigation" });
  await expect(
    dock.getByRole("link", { name: "Inbox, 1 unread updates" }),
  ).toBeVisible();
  const tickets = dock.getByRole("link", { name: "My tickets", exact: true });
  await tickets.hover();
  await expect(tickets.locator(".magnetic-dock-tile")).toHaveCSS(
    "transform",
    "none",
  );
  await tickets.click();
  await page.locator(".ticket-title").first().click();
  await expect(tickets).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Account and appearance").click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Account and appearance")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeHidden();
});

for (const role of ["student", "admin", "faculty"]) {
  test(`${role} dock fits a small phone and includes only their navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await login(page, role);
    const dock = page.getByRole("navigation", { name: "Dock navigation" });
    await expect(dock.getByRole("link")).toHaveCount(
      role === "student" ? 6 : role === "admin" ? 5 : 4,
    );
    await expect(
      dock.getByRole("link", { name: "New complaint", exact: true }),
    ).toHaveCount(role === "student" ? 1 : 0);
    for (const link of await dock.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await dock.getByRole("link", { name: /tickets$/ }).click();
    await expect(page).toHaveURL(/\/tickets$/);
    await expect(page.locator(".ticket-table")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = await page.locator(".content-footer").boundingBox();
    const dockBox = await dock.boundingBox();
    expect(footer.y + footer.height).toBeLessThanOrEqual(dockBox.y);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
