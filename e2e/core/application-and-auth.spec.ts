import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("APP-01: landing page exposes the primary marketing navigation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /automate your sales pipeline from end to end/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing" })).toHaveAttribute(
    "href",
    "/pricing",
  );
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.getByRole("link", { name: "Get Started Free" })).toHaveAttribute(
    "href",
    "/register",
  );
});

test("APP-06: a signed-out user is redirected away from a protected route", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Log in to your workspace" })).toBeVisible();

  const redirect = new URL(page.url()).searchParams.get("redirect");
  expect(redirect).toContain("/dashboard");
});

test("AUTH-03: malformed registration email is rejected before an API request", async ({
  page,
}) => {
  let registrationRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/auth/register")) {
      registrationRequests += 1;
    }
  });

  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Validation User");
  await page.getByLabel("Work email").fill("not-an-email");
  await page.locator('input[type="password"]').fill("SafePassword123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /create account and continue/i }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel("Work email")).toHaveJSProperty("validity.valid", false);
  expect(registrationRequests).toBe(0);
});

test("AUTH-09: unknown email and wrong password return the same generic 401", async ({
  request,
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const knownEmail = `known-${suffix}@example.com`;
  const unknownEmail = `unknown-${suffix}@example.com`;
  const correctPassword = "SafePassword123!";

  const registration = await request.post("http://127.0.0.1:8000/auth/register", {
    data: {
      full_name: "E2E Auth User",
      email: knownEmail,
      password: correctPassword,
    },
  });
  expect(registration.status()).toBe(201);

  const [unknownAccount, wrongPassword] = await Promise.all([
    request.post("http://127.0.0.1:8000/auth/login", {
      data: { email: unknownEmail, password: correctPassword },
    }),
    request.post("http://127.0.0.1:8000/auth/login", {
      data: { email: knownEmail, password: "WrongPassword123!" },
    }),
  ]);

  expect(unknownAccount.status()).toBe(401);
  expect(wrongPassword.status()).toBe(401);

  const unknownBody = await unknownAccount.json();
  const wrongBody = await wrongPassword.json();

  expect(unknownBody.error).toBe(wrongBody.error);
  expect(unknownBody.error).toMatch(/invalid (email|credentials)|email or password/i);
});

test("APP-02: marketing navigation moves between landing and pricing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("APP-04: unknown route renders a recoverable not-found page", async ({ page }) => {
  await page.goto("/definitely-not-a-real-route");
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  const home = page.getByRole("link", { name: /home|back/i }).first();
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);
});

test("AUTH-06: password visibility toggles without changing its value", async ({ page }) => {
  await page.goto("/login");
  const password = page.locator('input[type="password"]');
  await password.fill("PreservedPassword123!");
  const toggle = page.getByRole("button", { name: "Password", exact: true });
  await toggle.click();
  await expect(page.locator('input[type="text"]')).toHaveValue("PreservedPassword123!");
  await page.getByRole("button", { name: "Password", exact: true }).click();
  await expect(page.locator('input[type="password"]')).toHaveValue("PreservedPassword123!");
});

test("AUTH-07: registration requires terms acceptance", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/auth/register")) requests += 1;
  });
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Terms Test");
  await page.getByLabel("Work email").fill(`terms-${Date.now()}@example.com`);
  await page.locator('input[type="password"]').fill("SafePassword123!");
  await page.getByRole("button", { name: /create account and continue/i }).click();
  expect(requests).toBe(0);
  await expect(page.getByRole("checkbox")).not.toBeChecked();
});

for (const viewport of [
  { id: "mobile", width: 320, height: 700 },
  { id: "tablet", width: 768, height: 900 },
  { id: "desktop", width: 1280, height: 800 },
  { id: "wide", width: 1920, height: 1080 },
]) {
  test(`APP-12/15: landing page remains usable at ${viewport.id} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /automate your sales pipeline/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
}

test("UI-09: corrupt authentication storage fails safely", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "undefined");
    localStorage.setItem("persist:root", "{not-json");
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator("body")).not.toBeEmpty();
});

test("UI-10: browser back and forward preserve marketing navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/pricing$/);
});
