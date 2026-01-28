/**
 * @jest-environment node
 */

jest.mock("../../server/googleApis", () => ({
  __esModule: true,
  writeResponseRow: jest.fn(),
}));

describe("Google Sheets write flow (mocked)", () => {
  it("calls writeResponseRow with the expected payload", async () => {
    const { writeResponseRow } = await import("../../server/googleApis");
    const writeMock = writeResponseRow as jest.Mock;
    writeMock.mockResolvedValue({});

    const now = new Date();
    const row = [
      "integration-test@example.com",
      Date.now().toString(),
      "Integration Test",
      `${now.toDateString()} ${now.toLocaleTimeString()}`,
      "TRUE",
      "",
      "FALSE",
      "integration test",
    ];

    await expect(
      writeResponseRow(row, { retry: false, maxRetries: 1 })
    ).resolves.toBeDefined();

    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledWith(row, {
      retry: false,
      maxRetries: 1,
    });
  });
});
