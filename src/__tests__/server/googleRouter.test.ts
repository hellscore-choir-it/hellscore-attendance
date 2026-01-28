import { googleRouter } from "../../server/trpc/router/google";

jest.mock("../../server/googleApis", () => ({
  getSheetMembers: jest.fn(),
  getSheetResponses: jest.fn(),
  getUserEventTypeAssignments: jest.fn(),
  writeResponseRow: jest.fn(),
}));

const { getSheetMembers, getSheetResponses } = jest.requireMock(
  "../../server/googleApis"
);

const buildSession = (email: string) =>
  ({
    user: { email, name: "Test User" },
    expires: "2099-01-01T00:00:00.000Z",
  } as any);

const createCaller = (session: any) =>
  googleRouter.createCaller({ session } as any);

describe("googleRouter.getAttendanceView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns rows and summary for the selected event", async () => {
    getSheetMembers.mockResolvedValue([
      ["Email", "Name"],
      ["jamie@example.com", "Jamie"],
      ["riley@example.com", "Riley"],
    ]);
    getSheetResponses.mockResolvedValue([
      [
        "User Email",
        "Timestamp millis",
        "Event Title",
        "Event Date",
        "Going?",
        "Why Not?",
        "Went Last Time?",
        "Comments",
      ],
      [
        "jamie@example.com",
        1000,
        "Rehearsal",
        "2025-10-10",
        "TRUE",
        "",
        "FALSE",
        "See you",
      ],
    ]);

    const caller = createCaller(buildSession("jamie@example.com"));

    const result = await caller.getAttendanceView({
      eventDate: "2025-10-10",
      eventTitle: "Rehearsal",
    });

    expect(result.rows).toHaveLength(2);
    expect(result.summary).toEqual({
      going: 1,
      notGoing: 0,
      noResponse: 1,
      total: 2,
    });
  });

  it("requires a session", async () => {
    const caller = createCaller(null);

    await expect(
      caller.getAttendanceView({
        eventDate: "2025-10-10",
        eventTitle: "Rehearsal",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
