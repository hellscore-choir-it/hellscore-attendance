import type {
  AttendanceViewRow,
  ChoirMember,
  RawResponse,
} from "../../types/attendance";

const isMatchingEvent = (
  response: RawResponse,
  targetEventDate: string,
  targetEventTitle?: string
) => {
  if (response.eventDate !== targetEventDate) {
    return false;
  }

  if (targetEventTitle && response.eventTitle !== targetEventTitle) {
    return false;
  }

  return true;
};

const getLatestResponsesByEmail = (
  responses: RawResponse[],
  targetEventDate: string,
  targetEventTitle?: string
) => {
  const latestByEmail = new Map<string, RawResponse>();

  responses.forEach((response) => {
    if (!response.email) {
      return;
    }

    if (!isMatchingEvent(response, targetEventDate, targetEventTitle)) {
      return;
    }

    const existing = latestByEmail.get(response.email);
    if (!existing || response.timestampMillis > existing.timestampMillis) {
      latestByEmail.set(response.email, response);
    }
  });

  return latestByEmail;
};

export const getAttendanceView = (
  members: ChoirMember[],
  responses: RawResponse[],
  targetEventDate: string,
  targetEventTitle?: string
): AttendanceViewRow[] => {
  const latestResponses = getLatestResponsesByEmail(
    responses,
    targetEventDate,
    targetEventTitle
  );

  return members.map((member) => {
    const response = latestResponses.get(member.email);

    if (!response) {
      return {
        member,
        status: "No Response",
        reason: "",
        comments: "",
        lastUpdated: null,
      };
    }

    return {
      member,
      status: response.going ? "Going" : "Not Going",
      reason: response.whyNot ?? "",
      comments: response.comments ?? "",
      lastUpdated: response.timestampMillis ?? null,
    };
  });
};
