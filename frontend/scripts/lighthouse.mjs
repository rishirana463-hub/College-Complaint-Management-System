import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const origin = "http://127.0.0.1:4174";
const chrome = await launch({
  chromePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
});
let browser;
try {
  browser = await chromium.connectOverCDP(
    "http://127.0.0.1:" + chrome.port,
  );
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.goto(origin + "/login");
  const response = await fetch("http://127.0.0.1:5101/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@test.college", password: "admin123" }),
  });
  if (!response.ok) throw new Error("Isolated test API is not available.");
  const auth = await response.json();
  await page.evaluate((value) => {
    localStorage.setItem("ccms_auth", JSON.stringify(value));
    localStorage.setItem("ccms_theme", JSON.stringify("light"));
  }, auth);
  await page.goto(origin + "/admin");
  await page.getByText("PRIORITY DESK", { exact: true }).waitFor();
  await mkdir("artifacts", { recursive: true });
  const results = [];
  for (const mode of ["desktop", "mobile"]) {
    const report = await lighthouse(origin + "/admin", {
      port: chrome.port,
      output: ["html", "json"],
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      disableStorageReset: true,
      ...(mode === "desktop"
        ? {
            formFactor: "desktop",
            screenEmulation: {
              mobile: false,
              width: 1440,
              height: 1000,
              deviceScaleFactor: 1,
              disabled: false,
            },
          }
        : {}),
    });
    await writeFile("artifacts/lighthouse-" + mode + ".html", report.report[0]);
    await writeFile("artifacts/lighthouse-" + mode + ".json", report.report[1]);
    const result = {
      mode,
      url: report.lhr.finalDisplayedUrl,
      scores: Object.fromEntries(
        Object.entries(report.lhr.categories).map(([key, category]) => [
          key,
          Math.round(category.score * 100),
        ]),
      ),
      failedAudits: Object.values(report.lhr.audits)
        .filter((audit) => audit.score !== null && audit.score < 0.9)
        .map((audit) => ({
          id: audit.id,
          title: audit.title,
          score: audit.score,
          displayValue: audit.displayValue,
        })),
    };
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }
  await writeFile(
    "artifacts/lighthouse-summary.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser?.close().catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 500));
  try { await chrome.kill(); }
  catch (error) {
    if (error.code !== "EPERM" && error.code !== "EBUSY") throw error;
    console.warn("Reports saved; Windows retained the temporary Chrome profile.");
  }
}
