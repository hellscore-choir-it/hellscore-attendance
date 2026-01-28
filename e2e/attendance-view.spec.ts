import { expect, type Page, test } from "@playwright/test";

async function expectNoHydrationOverlay(page: Page) {
  await expect(page.getByText(/Hydration failed/i)).toHaveCount(0);
  await expect(page.getByText(/did not match the client/i)).toHaveCount(0);
}

test("/attendance-view loads fixture data (E2E session)", async ({ page }) => {
  await page.goto("/attendance-view?e2eEmail=e2e@example.com");

  await expect(
    page.getByRole("heading", { name: "צפייה בנוכחות" })
  ).toBeVisible();

  await expect(page.getByText("E2E Member One")).toBeVisible();
  await expect(page.getByText("E2E Member Two")).toBeVisible();
  await expect(page.getByText("E2E Member Three")).toBeVisible();

  await expect(page.getByText("מגיעים: 1", { exact: true })).toBeVisible();
  await expect(page.getByText("לא מגיעים: 1", { exact: true })).toBeVisible();
  await expect(page.getByText("לא ענו: 1", { exact: true })).toBeVisible();

  await expect(page.getByText("סה״כ: 3", { exact: true })).toBeVisible();
  await expectNoHydrationOverlay(page);
});
