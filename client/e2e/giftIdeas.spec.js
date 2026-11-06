import { expect, test } from "@playwright/test";

test("shows live API data with a responsive layout and local image", async ({ page, request }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await request.get("/api/gift-ideas");
  expect(response.ok()).toBe(true);
  const giftIdeas = await response.json();
  expect(giftIdeas).toHaveLength(6);
  await page.goto("/");
  await expect(page.getByRole("listitem")).toHaveCount(6);
  for (const giftIdea of giftIdeas) {
    await expect(page.getByRole("heading", { name: giftIdea.idea, exact: true })).toBeVisible();
    await expect(page.getByText(`${giftIdea.price} \u20ac`, { exact: true })).toBeVisible();
  }
  await expect(page.locator(".gift-photo")).toHaveJSProperty("complete", true);
  expect(await page.locator(".gift-photo").evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const headingsFit = await page.locator(".gift-item h2").evaluateAll((headings) =>
    headings.every((heading) => heading.scrollWidth <= heading.clientWidth)
  );
  expect(headingsFit).toBe(true);
  await page.screenshot({ path: `node_modules/.cache/gift-ideas-${testInfo.project.name}.png`, fullPage: true, animations: "disabled" });
  expect(errors).toEqual([]);
});

test("retries a failed request against the live API", async ({ page }) => {
  let failing = true;
  await page.route("**/api/gift-ideas", async (route) => {
    if (failing) await route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"Unavailable"}' });
    else await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();
  failing = false;
  await page.getByRole("button", { name: "Yrit\u00e4 uudelleen" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(6);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("shows an empty state", async ({ page }) => {
  await page.route("**/api/gift-ideas", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Ei lahjaideoita saatavilla.");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});