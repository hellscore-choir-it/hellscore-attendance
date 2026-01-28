/**
 * @jest-environment node
 */
jest.mock("../../env/server.mjs", () => ({
  env: {
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:
      process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
    SHEET_ID: process.env.TEST_SHEET_ID,
    TEST_SHEET_ID: process.env.TEST_SHEET_ID,
  },
}));

import {
  canInspectTestSheet,
  inspectTestSheet,
} from "../../testUtils/inspectTestSheet";
const loadGoogleApis = async () => import("../../server/googleApis");

describe("Google Sheets integration (test sheet)", () => {
  beforeAll(() => {
    if (!canInspectTestSheet()) {
      throw new Error(
        "Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS or TEST_SHEET_ID in env."
      );
    }
  });

  it("inspects Users and Responses headers", async () => {
    const result = await inspectTestSheet();

    const usersRange = result.valueRanges.find((range) =>
      range.range?.includes("Users!")
    );
    const responsesRange = result.valueRanges.find((range) =>
      range.range?.includes("Responses!")
    );

    const usersHeader = usersRange?.values?.[0] ?? [];
    const responsesHeader = responsesRange?.values?.[0] ?? [];

    expect(usersHeader).toEqual(["Email", "Name"]);
    expect(responsesHeader.slice(0, 8)).toEqual([
      "User Email",
      "Timestamp millis",
      "Event Title",
      "Event Date",
      "Going?",
      "Why Not?",
      "Went Last Time?",
      "Comments",
    ]);
  });

  it("loads user event assignments from the sheet", async () => {
    const { getUserEventTypeAssignments } = await loadGoogleApis();
    const assignments = await getUserEventTypeAssignments({
      retry: false,
      maxRetries: 1,
    });

    expect(assignments).toBeDefined();
    expect(Array.isArray(assignments)).toBe(true);
    expect(
      (assignments ?? []).every(
        (assignment) =>
          assignment.email.length > 0 && assignment.title.length > 0
      )
    ).toBe(true);
  });
});
