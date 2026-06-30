import { expect, test } from "@playwright/test";

const PROGRESS_KEY = "openmaestro:progress:PY101";

test("renders, persists progress, and works offline", async ({
  page,
  context,
}) => {
  // 1) App shell renders (lesson title is an <h2>).
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

  // Service worker becomes active + assets get cached on this first load.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForLoadState("networkidle");

  // 2) Progress persists in localStorage across reloads.
  await page.getByRole("button", { name: /mark complete/i }).click();
  const stored = await page.evaluate(
    (k) => window.localStorage.getItem(k),
    PROGRESS_KEY,
  );
  expect(stored).toContain("py101-01");

  await page.reload();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  const afterReload = await page.evaluate(
    (k) => window.localStorage.getItem(k),
    PROGRESS_KEY,
  );
  expect(afterReload).toContain("py101-01");

  // 3) Offline: app shell still loads (served by the service worker).
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await context.setOffline(false);
});
