import { expect, test } from "@playwright/test";

test("CHAT-11: stored HTML and Markdown payloads render as inert text", async ({ page }) => {
  const payload =
    '<img src=x onerror="window.__chatXssExecuted=1"> **bold** [link](javascript:window.__chatXssExecuted=2)';

  await page.addInitScript(() => {
    (window as any).__chatXssExecuted = 0;
    localStorage.setItem("access_token", "e2e-chat-token");
    localStorage.setItem(
      "salessync-ai-demo-state",
      JSON.stringify({
        app: {
          auth: {
            loggedIn: true,
            accessToken: "e2e-chat-token",
            userId: "00000000-0000-0000-0000-000000000001",
          },
          team: {
            id: "00000000-0000-0000-0000-000000000010",
            name: "Security Team",
          },
        },
      }),
    );
  });

  await page.route("**/chat/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Messages fetched successfully",
        data: [
          {
            id: "00000000-0000-0000-0000-000000000101",
            team_id: "00000000-0000-0000-0000-000000000010",
            user_id: "00000000-0000-0000-0000-000000000001",
            sent_by: "ai",
            content: payload,
            metadata_log: {},
            created_at: "2026-07-30T12:00:00Z",
          },
        ],
        error: null,
      }),
    });
  });

  await page.goto("/dashboard");
  const rendered = page.getByText(payload, { exact: true });
  await expect(rendered).toBeVisible({ timeout: 20_000 });
  await expect(rendered.locator("img")).toHaveCount(0);
  await expect(rendered.locator("a")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__chatXssExecuted)).toBe(0);
});
