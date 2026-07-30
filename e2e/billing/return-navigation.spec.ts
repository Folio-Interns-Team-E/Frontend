import { expect, test } from "@playwright/test";

for (const returnState of ["success", "cancel"] as const) {
  test(`BILL-04: ${returnState} return trusts backend status, not query parameters`, async ({
    page,
  }) => {
    let statusRequests = 0;
    await page.addInitScript(() => {
      localStorage.setItem("access_token", "e2e-billing-token");
    });
    await page.route("**/billing/status", async (route) => {
      statusRequests += 1;
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

    await page.goto(
      `/billing?${returnState}=true&tier=enterprise&status=active&subscription_id=sub_attacker`,
    );

    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Enterprise", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /cancel subscription/i })).toHaveCount(0);
    expect(statusRequests).toBeGreaterThan(0);
  });
}
