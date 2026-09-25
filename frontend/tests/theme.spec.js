import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a loading decorative book never blocks the login form", async ({ page }) => {
  let bookRequest;
  await page.route("**/models/vintage-book-optimized.glb", (route) => {
    bookRequest = route;
  });
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect.poll(() => Boolean(bookRequest)).toBe(true);
  const email = page.getByLabel("College email");
  await expect(email).toBeVisible();
  await email.fill("draft@example.test");
  await expect(email).toBeFocused();
  await bookRequest.continue();
  await expect(page.locator(".campus-book:not([aria-hidden]) canvas")).toBeVisible();
  await expect(email).toHaveValue("draft@example.test");
  await expect(email).toBeFocused();
});

for (const theme of ["light", "dark"]) {
  test(`navy theme keeps login readable in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/login");
    const email = page.getByLabel("College email");
    await expect(email).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".auth-layout")).toHaveCSS(
      "background-color",
      "rgb(27, 29, 58)",
    );
    await email.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(email).toBeFocused();
    await expect(email).toHaveCSS("outline-color", "rgb(169, 177, 251)");
    await page.getByRole("button", { name: "Sign in", exact: true }).hover();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({
      path: `artifacts/login-navy-${theme}.png`,
      fullPage: true,
    });
  });
}

test("navy login and registration fit mobile with keyboard-visible focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  for (const path of ["/login", "/register"]) {
    await page.goto(path);
    await expect(page.getByLabel("College email")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("College email").click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByLabel("College email")).toBeFocused();
    await expect(page.getByLabel("College email")).toHaveCSS(
      "outline-style",
      "solid",
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({
      path: `artifacts${path}-navy-mobile.png`,
      fullPage: true,
    });
  }
});
