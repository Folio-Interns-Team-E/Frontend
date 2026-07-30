import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const JWT_SECRET = "e2e-only-jwt-secret-do-not-use-outside-tests";

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function testToken(userId: string) {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

test.beforeEach(async ({ page, request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const registration = await request.post(`${API}/auth/register`, {
    data: {
      full_name: "Composer E2E User",
      email: `composer-${suffix}@example.com`,
      password: "SafePassword123!",
    },
  });
  expect(registration.status()).toBe(201);
  const userId = (await registration.json()).data.user_id as string;
  const token = testToken(userId);
  const auth = { Authorization: `Bearer ${token}` };

  const teamResponse = await request.post(`${API}/teams/`, {
    headers: auth,
    data: { name: `Composer ${suffix}` },
  });
  expect(teamResponse.status()).toBe(201);
  const team = (await teamResponse.json()).data;
  const teamHeaders = { ...auth, "X-Team-Id": team.id };

  const leadResponse = await request.post(`${API}/leads/`, {
    headers: teamHeaders,
    data: {
      name: "Avery Buyer",
      email: `avery-${suffix}@example.com`,
      company: "Example Co",
      title: "VP Sales",
      source: "Referral",
    },
  });
  expect(leadResponse.status()).toBe(201);
  const lead = (await leadResponse.json()).data;
  await request.post(`${API}/leads/${lead.id}/qualify`, { headers: teamHeaders });

  const draft = await request.post(`${API}/emails/draft`, {
    headers: teamHeaders,
    data: {
      lead_id: lead.id,
      subject: "Initial subject",
      body: "Initial body",
      tone: "Professional",
    },
  });
  expect(draft.status()).toBe(201);

  await page.addInitScript(
    ({ token, userId, team }) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem(
        "salessync-ai-demo-state",
        JSON.stringify({
          app: {
            auth: {
              registered: true,
              loggedIn: true,
              teamChoiceCompleted: true,
              accessToken: token,
              userId,
              status: "succeeded",
              error: null,
              needsVerification: false,
              verifyEmail: null,
            },
            team: {
              id: team.id,
              name: team.name,
              currentUserRole: "admin",
              status: "succeeded",
            },
            integrations: { gmail: true, calendar: false, apollo: false },
          },
        }),
      );
    },
    { token, userId, team },
  );
});

async function openComposer(page: import("@playwright/test").Page) {
  await page.goto("/outreach");
  try {
    await page.getByText("Avery Buyer").waitFor({ state: "visible", timeout: 5_000 });
  } catch {
    await page.reload();
  }
  await expect(page.getByText("Avery Buyer")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("input[readonly]")).toHaveValue(/avery-/);
}

test("MAIL-02: body undo, redo, shortcuts and redo invalidation preserve history", async ({
  page,
}) => {
  await openComposer(page);
  const subject = page.locator('input[type="text"]:not([readonly])').first();
  const body = page.getByPlaceholder("Write your email here...");
  await expect(subject).toHaveValue("Initial subject");
  await expect(body).toHaveValue("Initial body");

  await subject.fill("Revised subject");
  await body.fill("First revision");
  await body.fill("Second revision");
  await page.getByTitle("Undo (Ctrl+Z)").click();
  await expect(body).toHaveValue("First revision");
  await expect(page.getByTitle("Redo (Ctrl+Y)")).toBeEnabled();
  await page.getByTitle("Redo (Ctrl+Y)").click();
  await expect(body).toHaveValue("Second revision");

  await body.press("Control+z");
  await expect(body).toHaveValue("First revision");
  await body.press("Control+y");
  await expect(body).toHaveValue("Second revision");

  await page.getByTitle("Undo (Ctrl+Z)").click();
  await body.fill("Branch revision");
  await expect(page.getByTitle("Redo (Ctrl+Y)")).toBeDisabled();
});

test("MAIL-02: subject edits participate in undo history", async ({ page }) => {
  await openComposer(page);
  const subject = page.locator('input[type="text"]:not([readonly])').first();
  await subject.fill("Revised subject");
  await subject.focus();
  await subject.press("Control+z");
  await expect(subject).toHaveValue("Initial subject");
});

test("MAIL-02: composer provides an accessible tone selector", async ({ page }) => {
  await openComposer(page);
  await expect(
    page.getByRole("combobox", { name: /tone/i }).or(page.getByLabel(/tone/i)),
  ).toBeVisible();
});
