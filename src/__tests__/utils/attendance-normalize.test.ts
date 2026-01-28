import {
  getMembersHeaderIssues,
  getResponsesHeaderIssues,
  parseMembersSheet,
  parseResponsesSheet,
} from "../../utils/attendance/normalize";

describe("attendance normalize", () => {
  it("detects missing header rows", () => {
    expect(getMembersHeaderIssues([])).toEqual(["missing-header-row"]);
    expect(getResponsesHeaderIssues([])).toEqual(["missing-header-row"]);
  });

  it("accepts valid header rows", () => {
    const membersRows = [
      ["Email", "Name"],
      ["jamie@example.com", "Jamie"],
    ];
    const responsesRows = [
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
    ];

    expect(getMembersHeaderIssues(membersRows)).toEqual([]);
    expect(getResponsesHeaderIssues(responsesRows)).toEqual([]);
  });

  it("flags missing columns and mismatched headers", () => {
    const membersRows = [["User", "Full Name"]];
    const responsesRows = [["Email", "Timestamp"]];

    expect(getMembersHeaderIssues(membersRows)).toEqual(
      expect.arrayContaining(["header-mismatch:email", "header-mismatch:name"])
    );

    expect(getResponsesHeaderIssues(responsesRows)).toEqual(
      expect.arrayContaining(["missing-columns", "header-mismatch:event title"])
    );
  });

  it("parses members and normalizes fields", () => {
    const rows = [
      ["Email", "Name"],
      [" JAMIE@EXAMPLE.COM ", " Jamie "],
      ["", "Missing"],
    ];

    const members = parseMembersSheet(rows);

    expect(members).toEqual([{ email: "jamie@example.com", name: "Jamie" }]);
  });

  it("parses responses and sanitizes text", () => {
    const rows = [
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
        "1700000000000",
        "Rehearsal",
        "2025-10-10",
        "TRUE",
        "=Not going",
        0,
        "+Comment",
      ],
    ];

    const responses = parseResponsesSheet(rows);

    expect(responses).toEqual([
      {
        email: "jamie@example.com",
        timestampMillis: 1700000000000,
        eventTitle: "Rehearsal",
        eventDate: "2025-10-10",
        going: true,
        whyNot: "'=Not going",
        wentLastTime: false,
        comments: "'+Comment",
      },
    ]);
  });
});
