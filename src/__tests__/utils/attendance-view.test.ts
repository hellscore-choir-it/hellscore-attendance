import type { ChoirMember, RawResponse } from "../../types/attendance";
import { getAttendanceView } from "../../utils/attendance/view";

const findRowByEmail = (rows: ReturnType<typeof getAttendanceView>, email: string) =>
  rows.find((row) => row.member.email === email);

describe("attendance view", () => {
  it("uses the latest response per member", () => {
    const members: ChoirMember[] = [
      { name: "Jamie", email: "jamie@example.com" },
      { name: "Avery", email: "avery@example.com" },
    ];

    const responses: RawResponse[] = [
      {
        email: "jamie@example.com",
        timestampMillis: 1000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: false,
        whyNot: "Sick",
        wentLastTime: true,
        comments: "Feel bad",
      },
      {
        email: "jamie@example.com",
        timestampMillis: 2000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: true,
        whyNot: "",
        wentLastTime: true,
        comments: "Recovered",
      },
      {
        email: "avery@example.com",
        timestampMillis: 1500,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: false,
        whyNot: "Travel",
        wentLastTime: false,
        comments: "Out of town",
      },
    ];

    const rows = getAttendanceView(
      members,
      responses,
      "2025-10-10",
      "Rehearsal"
    );

    const jamieRow = findRowByEmail(rows, "jamie@example.com");
    const averyRow = findRowByEmail(rows, "avery@example.com");

    expect(jamieRow?.status).toBe("Going");
    expect(jamieRow?.comments).toBe("Recovered");
    expect(averyRow?.status).toBe("Not Going");
    expect(averyRow?.reason).toBe("Travel");
  });

  it("returns No Response for members without submissions", () => {
    const members: ChoirMember[] = [
      { name: "Jamie", email: "jamie@example.com" },
      { name: "Riley", email: "riley@example.com" },
    ];

    const responses: RawResponse[] = [
      {
        email: "jamie@example.com",
        timestampMillis: 1000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: true,
        whyNot: "",
        wentLastTime: false,
        comments: "See you there",
      },
    ];

    const rows = getAttendanceView(
      members,
      responses,
      "2025-10-10",
      "Rehearsal"
    );

    const rileyRow = findRowByEmail(rows, "riley@example.com");

    expect(rileyRow?.status).toBe("No Response");
    expect(rileyRow?.reason).toBe("");
    expect(rileyRow?.comments).toBe("");
  });

  it("deduplicates members by email and uses latest response", () => {
    const members: ChoirMember[] = [
      { name: "Jamie A", email: "jamie@example.com" },
      { name: "Jamie B", email: "jamie@example.com" },
    ];

    const responses: RawResponse[] = [
      {
        email: "jamie@example.com",
        timestampMillis: 1000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: false,
        whyNot: "Sick",
        wentLastTime: true,
        comments: "Feel bad",
      },
      {
        email: "jamie@example.com",
        timestampMillis: 2000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: true,
        whyNot: "",
        wentLastTime: true,
        comments: "Recovered",
      },
    ];

    const rows = getAttendanceView(
      members,
      responses,
      "2025-10-10",
      "Rehearsal"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.member.email).toBe("jamie@example.com");
    expect(rows[0]?.status).toBe("Going");
    expect(rows[0]?.comments).toBe("Recovered");
  });
});
