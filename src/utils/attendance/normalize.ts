import type { ChoirMember, RawResponse } from "../../types/attendance";

type SheetCell = string | number | boolean | null | undefined;

const normalizeString = (value: SheetCell): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  return value ? "TRUE" : "FALSE";
};

const normalizeEmail = (value: SheetCell): string =>
  normalizeString(value).toLowerCase();

const normalizeBoolean = (value: SheetCell): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = normalizeString(value).toLowerCase();

  if (["true", "yes", "y", "1", "כן"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "n", "0", "לא"].includes(normalized)) {
    return false;
  }

  return false;
};

const normalizeTimestampMillis = (value: SheetCell): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(normalizeString(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMembersHeaderRow = (row: SheetCell[]): boolean => {
  const emailCell = normalizeString(row[0]).toLowerCase();
  const nameCell = normalizeString(row[1]).toLowerCase();
  return emailCell === "email" && nameCell === "name";
};

const isResponsesHeaderRow = (row: SheetCell[]): boolean => {
  const emailCell = normalizeString(row[0]).toLowerCase();
  const timestampCell = normalizeString(row[1]).toLowerCase();
  return emailCell === "user email" && timestampCell.includes("timestamp");
};

export const parseMembersSheet = (rows: SheetCell[][]): ChoirMember[] =>
  rows
    .filter((row) => row.length > 0)
    .filter((row) => !isMembersHeaderRow(row))
    .map((row) => {
      const email = normalizeEmail(row[0]);
      const name = normalizeString(row[1]);
      return {
        email,
        name,
      };
    })
    .filter((member) => member.email.length > 0);

export const parseResponsesSheet = (rows: SheetCell[][]): RawResponse[] =>
  rows
    .filter((row) => row.length > 0)
    .filter((row) => !isResponsesHeaderRow(row))
    .map((row) => {
      const email = normalizeEmail(row[0]);
      const timestampMillis = normalizeTimestampMillis(row[1]);
      const eventTitle = normalizeString(row[2]);
      const eventDate = normalizeString(row[3]);
      const going = normalizeBoolean(row[4]);
      const whyNot = normalizeString(row[5]);
      const wentLastTime = normalizeBoolean(row[6]);
      const comments = normalizeString(row[7]);

      return {
        email,
        timestampMillis,
        eventTitle,
        eventDate,
        going,
        whyNot,
        wentLastTime,
        comments,
      };
    })
    .filter((response) => response.email.length > 0);
