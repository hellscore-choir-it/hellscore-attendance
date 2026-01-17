import { expect, type Page, test } from "@playwright/test";

async function expectNoHydrationOverlay(page: Page) {
  // Next.js dev overlay commonly contains this text on hydration mismatch.
  await expect(page.getByText(/Hydration failed/i)).toHaveCount(0);
  await expect(page.getByText(/did not match the client/i)).toHaveCount(0);
}

async function expectLoggedOut(page: Page) {
  await expect(page.getByText("אנא התחבר/י 🙂")).toBeVisible();
  await expectNoHydrationOverlay(page);
}

test("/ loads attendance form (E2E session)", async ({ page }) => {
  await page.goto("/?e2eEmail=e2e@example.com");

  // Smoke assertion: the form should render with at least one known label.
  await expect(page.getByText("אירוע")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "שלח/י טופס 🚀" })
  ).toBeVisible();

  await expectNoHydrationOverlay(page);
});

test("Logged-out users are gated (/, /thank-you, /cat-generator, /catalog)", async ({
  page,
}) => {
  await page.goto("/");
  await expectLoggedOut(page);

  await page.goto("/thank-you");
  await expectLoggedOut(page);

  await page.goto("/cat-generator");
  await expectLoggedOut(page);

  await page.goto("/catalog");
  await expectLoggedOut(page);
});

test("/thank-you shows CTA when eligible", async ({ page }) => {
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=10");

  await expect(
    page.getByRole("heading", { name: "תודה על הדיווח ❤️" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "לצפייה במחולל החתולים 🔥" })
  ).toBeVisible();

  await expectNoHydrationOverlay(page);
});

test("/thank-you interim streak states", async ({ page }) => {
  // Loading/unknown streak
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=loading");
  await expect(page.getByText("בודקים את הרצף שלך...")).toBeVisible();
  await expectNoHydrationOverlay(page);

  // Below access threshold
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=0");
  await expect(page.getByText(/כדי לפתוח את מחולל החתולים/)).toBeVisible();
  await expectNoHydrationOverlay(page);

  // Just unlocked access
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=2");
  await expect(
    page.getByRole("link", { name: "לצפייה במחולל החתולים 🔥" })
  ).toBeVisible();
  await expect(page.getByText("פתחת צפייה בקמע")).toBeVisible();
  await expect(page.getByText(/השלב הבא: התאמה אישית/)).toBeVisible();
  await expectNoHydrationOverlay(page);

  // Customize unlocked
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=4");
  await expect(page.getByText("פתחת התאמה אישית")).toBeVisible();
  await expect(page.getByText(/השלב הבא: ייצוא SVG/)).toBeVisible();
  await expectNoHydrationOverlay(page);

  // Export unlocked
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=5");
  await expect(page.getByText("פתחת ייצוא SVG")).toBeVisible();
  await expect(page.getByText(/השלב הבא: פלטות נדירות/)).toBeVisible();
  await expectNoHydrationOverlay(page);

  // Rare traits unlocked
  await page.goto("/thank-you?e2eEmail=e2e@example.com&e2eStreak=7");
  await expect(page.getByText("כל הפיצ'רים פתוחים 🎉")).toBeVisible();
  await expectNoHydrationOverlay(page);
});

test("/cat-generator loads when eligible", async ({ page }) => {
  await page.goto("/cat-generator?e2eEmail=e2e@example.com&e2eStreak=10");

  await expect(
    page.getByRole("heading", { name: "מחולל החתולים" })
  ).toBeVisible();
  await expect(page.getByText("הקמע החתולי שלך")).toBeVisible();

  await expectNoHydrationOverlay(page);
});

test("/cat-generator redirects when ineligible", async ({ page }) => {
  await page.goto("/cat-generator?e2eEmail=e2e@example.com&e2eStreak=0");

  await page.waitForURL("**/thank-you**");
  await expect(page.getByText("עוד")).toBeVisible();

  await expectNoHydrationOverlay(page);
});

test("/telemetry/cat-generator loads in E2E mode when logged in", async ({
  page,
}) => {
  await page.goto("/telemetry/cat-generator?e2eEmail=e2e@example.com");

  await expect(
    page.getByRole("heading", { name: "Cat Generator Telemetry" })
  ).toBeVisible();
  // Stub response should render.
  await expect(page.getByText("CTR Summary")).toBeVisible();
  await expectNoHydrationOverlay(page);
});

test("/telemetry/cat-generator redirects to signin when logged out", async ({
  page,
}) => {
  await page.goto("/telemetry/cat-generator");
  await page.waitForURL("**/api/auth/signin**");
  await expectNoHydrationOverlay(page);
});

test("/catalog loads when logged in (E2E session)", async ({ page }) => {
  await page.goto("/catalog?e2eEmail=e2e@example.com");
  await expect(
    page.getByRole("heading", { name: "קטלוג המקהלה" })
  ).toBeVisible();
  await expectNoHydrationOverlay(page);
});
