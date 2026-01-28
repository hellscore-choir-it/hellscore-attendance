import type { AttendanceViewRow } from "../../types/attendance";

const E2E_ATTENDANCE_VIEW_ROWS: AttendanceViewRow[] = [
  {
    member: { name: "E2E Member One", email: "one@example.com" },
    status: "Going",
    reason: "",
    comments: "",
    lastUpdated: Date.UTC(2024, 0, 1, 10, 0, 0),
  },
  {
    member: { name: "E2E Member Two", email: "two@example.com" },
    status: "Not Going",
    reason: "נסיעה",
    comments: "אעדכן בהמשך",
    lastUpdated: Date.UTC(2024, 0, 1, 11, 0, 0),
  },
  {
    member: { name: "E2E Member Three", email: "three@example.com" },
    status: "No Response",
    reason: "",
    comments: "",
    lastUpdated: null,
  },
];

export const getE2EAttendanceViewResponse = () => {
  const summary = {
    going: 1,
    notGoing: 1,
    noResponse: 1,
    total: 3,
  };

  return {
    rows: E2E_ATTENDANCE_VIEW_ROWS,
    summary,
  };
};