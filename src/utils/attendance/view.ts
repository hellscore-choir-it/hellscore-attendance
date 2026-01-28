import { filter, forEach, map, uniqBy } from "lodash";
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
  const toDateKey = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}-${day}`;
  };

  const responseDateKey = toDateKey(response.eventDate);
  const targetDateKey = toDateKey(targetEventDate);

  const isDateMatch =
    responseDateKey && targetDateKey
      ? responseDateKey === targetDateKey
      : response.eventDate === targetEventDate;

  if (!isDateMatch) {
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

  forEach(responses, (response) => {
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
  const uniqueMembers = filter(
    uniqBy(members, "email"),
    (member) => Boolean(member.email)
  );

  const latestResponses = getLatestResponsesByEmail(
    responses,
    targetEventDate,
    targetEventTitle
  );

  return map(uniqueMembers, (member) => {
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
