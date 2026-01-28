import { googleRouter } from "../../server/trpc/router/google";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock("../../server/googleApis", () => ({
  getSheetMembers: jest.fn(),
  getSheetResponses: jest.fn(),
  getUserEventTypeAssignments: jest.fn(),
  writeResponseRow: jest.fn(),
}));

jest.mock("../../server/db/attendanceViewConfig", () => ({
  fetchAttendanceViewAllowlist: jest
    .fn()
    .mockResolvedValue(["jamie@example.com"]),
  isEmailAllowlisted: jest.fn((allowlist: string[], email?: string) =>
    Boolean(email && allowlist.includes(email))
  ),
}));

const { getSheetMembers, getSheetResponses, getUserEventTypeAssignments } =
  jest.requireMock("../../server/googleApis");
const { captureMessage } = jest.requireMock("@sentry/nextjs");

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
    getUserEventTypeAssignments.mockResolvedValue([
      { title: "Rehearsal", email: "jamie@example.com" },
      { title: "Rehearsal", email: "riley@example.com" },
    ]);
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

  it("scopes members to user-event assignments", async () => {
    getUserEventTypeAssignments.mockResolvedValue([
      { title: "Rehearsal", email: "jamie@example.com" },
    ]);
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
    ]);

    const caller = createCaller(buildSession("jamie@example.com"));

    const result = await caller.getAttendanceView({
      eventDate: "2025-10-10",
      eventTitle: "Rehearsal",
    });

    expect(result.rows).toHaveLength(1);
    expect(result.summary).toEqual({
      going: 0,
      notGoing: 0,
      noResponse: 1,
      total: 1,
    });
  });

  it("requires a session", async () => {
    getUserEventTypeAssignments.mockResolvedValue([]);
    const caller = createCaller(null);

    await expect(
      caller.getAttendanceView({
        eventDate: "2025-10-10",
        eventTitle: "Rehearsal",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("logs header warnings when sheets are empty", async () => {
    getUserEventTypeAssignments.mockResolvedValue([]);
    getSheetMembers.mockResolvedValue([]);
    getSheetResponses.mockResolvedValue([]);

    const caller = createCaller(buildSession("jamie@example.com"));

    await caller.getAttendanceView({
      eventDate: "2025-10-10",
      eventTitle: "Rehearsal",
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "Attendance view members sheet header issues",
      expect.objectContaining({ level: "warning" })
    );
    expect(captureMessage).toHaveBeenCalledWith(
      "Attendance view responses sheet header issues",
      expect.objectContaining({ level: "warning" })
    );
    expect(captureMessage).toHaveBeenCalledWith(
      "Attendance view sheet data missing",
      expect.objectContaining({ level: "warning" })
    );
  });

  it("logs parsed-empty warnings when only headers exist", async () => {
    getUserEventTypeAssignments.mockResolvedValue([]);
    getSheetMembers.mockResolvedValue([["Email", "Name"]]);
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
    ]);

    const caller = createCaller(buildSession("jamie@example.com"));

    await caller.getAttendanceView({
      eventDate: "2025-10-10",
      eventTitle: "Rehearsal",
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "Attendance view members parsed empty",
      expect.objectContaining({ level: "warning" })
    );
    expect(captureMessage).toHaveBeenCalledWith(
      "Attendance view responses parsed empty",
      expect.objectContaining({ level: "warning" })
    );
  });
});
