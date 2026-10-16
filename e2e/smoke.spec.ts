import { expect, test } from "@playwright/test";

async function waitForApplication(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
}

test.describe("public sales journey", () => {
  test("a visitor can move from the landing page to login", async ({ page }) => {
    await page.goto("/");
    await waitForApplication(page);

    await expect(
      page.getByRole("heading", { name: /automate your sales pipeline from end to end/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /live demo/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /log in to your workspace/i })).toBeVisible();
  });

  test("login controls and account recovery are keyboard-accessible", async ({ page }) => {
    await page.goto("/login");
    await waitForApplication(page);

    const email = page.getByLabel("Work email");
    const password = page.getByLabel("Password");
    await email.fill("e2e.invalid@example.invalid");
    await password.fill("not-a-real-password");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("link", { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
  });
});

test.describe("authentication boundaries", () => {
  test("an unauthenticated visitor is redirected away from the workspace", async ({ page }) => {
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Not authenticated" }),
      });
    });

    await page.goto("/dashboard");
    await waitForApplication(page);

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: /log in to your workspace/i })).toBeVisible();
  });

  test("a rejected login displays a useful error without leaving the page", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid email or password" }),
      });
    });

    await page.goto("/login");
    await waitForApplication(page);
    await page.getByLabel("Work email").fill("e2e.invalid@example.invalid");
    await page.getByLabel("Password").fill("not-a-real-password");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Invalid email or password", { exact: true })).toBeVisible();
  });
});
