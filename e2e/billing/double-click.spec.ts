import { expect, test } from "@playwright/test";

test("BILL-13: rapid upgrade double-click creates at most one checkout session", async ({
  page,
}) => {
  test.setTimeout(60_000);
  let checkoutRequests = 0;
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "e2e-billing-double-click-token");
    localStorage.setItem(
      "salessync-ai-demo-state",
      JSON.stringify({
        app: {
          auth: {
            loggedIn: true,
            accessToken: "e2e-billing-double-click-token",
            userId: "00000000-0000-0000-0000-000000000001",
          },
          team: {
            id: "00000000-0000-0000-0000-000000000010",
            name: "Billing E2E",
          },
        },
      }),
    );
  });
  await page.route("**/billing/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tier: "free",
        status: "active",
        ends_at: null,
        cancel_at_period_end: false,
      }),
    });
  });
  await page.route("**/teams/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Teams fetched",
        data: [
          {
            id: "00000000-0000-0000-0000-000000000010",
            name: "Billing E2E",
            invite_code: "e2e",
            created_at: "2026-07-30T12:00:00Z",
            role: "admin",
          },
        ],
        error: null,
      }),
    });
  });
  await page.route("**/billing/checkout/growth", async (route) => {
    checkoutRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        checkout_url: "http://127.0.0.1:5173/billing?checkout_return=1",
      }),
    });
  });

  await page.goto("/billing");
  const upgrade = page.getByRole("button", { name: "Upgrade to Growth" });
  await expect(upgrade).toBeEnabled({ timeout: 45_000 });

  await upgrade.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });

  await expect(
    page.getByRole("button", { name: "Redirecting to checkout..." }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/checkout_return=1/, { timeout: 20_000 });
  expect(checkoutRequests).toBe(1);
});
