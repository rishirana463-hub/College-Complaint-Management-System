import { test, expect } from "@playwright/test";

test("login branding renders, responds to the pointer, and survives a lost graphics context", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/login");
  const identity = page.locator(".auth-story .login-identity");
  const logo = identity.locator(".dithered-logo");
  const name = identity.getByRole("img", { name: "Campusdesk" });
  await expect(logo).toHaveAttribute("data-rendered", "true");
  await expect(name).toHaveAttribute("data-rendered", "true");
  const before = await logo
    .locator("canvas")
    .evaluate((canvas) => canvas.toDataURL());
  await logo.hover();
  await expect
    .poll(() => logo.locator("canvas").evaluate((canvas) => canvas.toDataURL()))
    .not.toBe(before);
  await name.locator("canvas").evaluate((canvas) => {
    canvas
      .getContext("webgl2")
      .getExtension("WEBGL_lose_context")
      .loseContext();
  });
  await expect(name.locator(".warp-text-fallback")).toBeVisible();
  await page.getByLabel("College email").fill("draft@example.test");
  await page.getByLabel("College email").press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await expect(page.getByLabel("College email")).toHaveValue(
    "draft@example.test",
  );
});

test("changing motion preference restores a steady Campusdesk name and logo", async ({
  page,
}) => {
  await page.goto("/login");
  const identity = page.locator(".auth-story .login-identity");
  await expect(identity.locator(".warp-text")).toHaveAttribute(
    "data-rendered",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(identity.locator(".warp-text canvas")).toHaveCount(0);
  await expect(identity.locator(".warp-text-fallback")).toBeVisible();
  await expect(identity.locator(".dithered-logo")).toHaveAttribute(
    "data-rendered",
    "true",
  );
  const logo = identity.locator(".dithered-logo canvas");
  const before = await logo.evaluate((canvas) => canvas.toDataURL());
  await logo.hover();
  await page.waitForTimeout(200);
  expect(await logo.evaluate((canvas) => canvas.toDataURL())).toBe(before);
  await page.getByLabel("College email").fill("student@example.test");
});

test("missing logo artwork leaves a usable login and a readable product name", async ({
  page,
}) => {
  await page.route("**/images/campusdesk-mark.svg", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await expect(page.locator(".auth-story .warp-text-fallback")).toHaveText(
    "Campusdesk",
  );
  await page.getByLabel("College email").fill("rahul@test.college");
  await page.getByLabel("Password", { exact: true }).fill("student123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("panel glow follows edges without blocking ticket actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/login");
  await page.getByLabel("College email").fill("admin@test.college");
  await page.getByLabel("Password", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const panel = page.locator(".priority-summary.border-glow-card");
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await expect
    .poll(() =>
      panel.evaluate((el) =>
        Number(el.style.getPropertyValue("--edge-proximity")),
      ),
    )
    .toBeGreaterThan(95);
  await expect
    .poll(() =>
      panel
        .locator(".edge-light")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.8);
  await panel.getByRole("link").click();
  await expect(page).toHaveURL(/\/tickets\?/);
  await expect(
    page.locator(".ticket-workspace.border-glow-card"),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".ticket-workspace > .edge-light")).toBeHidden();
  await page.locator(".ticket-title").first().click();
  await expect(page).toHaveURL(/\/tickets\/[a-f0-9]+$/);
});
