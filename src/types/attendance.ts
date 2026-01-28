export type ChoirMember = {
  name: string;
  email: string;
};

export type RawResponse = {
  email: string;
  timestampMillis: number;
  eventTitle: string;
  eventDate: string;
  going: boolean;
  whyNot: string;
  wentLastTime: boolean;
  comments: string;
};

export type AttendanceStatus = "Going" | "Not Going" | "No Response";

export type AttendanceViewRow = {
  member: ChoirMember;
  status: AttendanceStatus;
  reason: string;
  comments: string;
  lastUpdated: number | null;
};
