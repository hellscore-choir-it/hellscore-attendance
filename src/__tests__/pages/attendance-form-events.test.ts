/**
 * @jest-environment node
 */
type Mock = jest.Mock;

jest.mock("../../server/googleApis", () => ({
  getHellscoreEvents: jest.fn(),
  getUserEventTypeAssignments: jest.fn(),
}));

const { getHellscoreEvents, getUserEventTypeAssignments } = jest.requireMock(
  "../../server/googleApis"
) as {
  getHellscoreEvents: Mock;
  getUserEventTypeAssignments: Mock;
};

describe("attendance form event scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.E2E_TEST_MODE;
  });

  it("uses upcoming events only in the attendance form", async () => {
    getHellscoreEvents.mockResolvedValue([]);
    getUserEventTypeAssignments.mockResolvedValue([]);

    const { getStaticProps } = await import("../../pages/index");

    await getStaticProps();

    expect(getHellscoreEvents).toHaveBeenCalledWith({
      maxResults: 20,
      timeMin: expect.any(String),
    });
  });
});
