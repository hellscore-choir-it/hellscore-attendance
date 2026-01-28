import {
  filter,
  find,
  includes,
  isBoolean,
  isEmpty,
  isNumber,
  isString,
  map,
  size,
  some,
  trim,
} from "lodash";
import type { ChoirMember, RawResponse } from "../../types/attendance";
import { sanitizeText } from "../attendanceSchema";

type SheetCell = string | number | boolean | null | undefined;

const normalizeString = (value: SheetCell): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (isString(value)) {
    return trim(value);
  }

  if (isNumber(value)) {
    return Number.isFinite(value) ? String(value) : "";
  }

  return value ? "TRUE" : "FALSE";
};

const normalizeEmail = (value: SheetCell): string =>
  normalizeString(value).toLowerCase();

const normalizeBoolean = (value: SheetCell): boolean => {
  if (isBoolean(value)) {
    return value;
  }

  if (isNumber(value)) {
    return value !== 0;
  }

  const normalized = normalizeString(value).toLowerCase();

  if (includes(["true", "yes", "y", "1", "כן"], normalized)) {
    return true;
  }

  if (includes(["false", "no", "n", "0", "לא"], normalized)) {
    return false;
  }

  return false;
};

const normalizeTimestampMillis = (value: SheetCell): number => {
  if (isNumber(value) && Number.isFinite(value)) {
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

const normalizeHeaderValue = (value: SheetCell): string =>
  normalizeString(value).toLowerCase().replace(/\s+/g, " ").trim();

const membersHeaderExpected = ["email", "name"];
const responsesHeaderExpected = [
  "user email",
  "timestamp",
  "event title",
  "event date",
  "going",
  "why not",
  "went last time",
  "comments",
];

const matchesHeader = (actual: string, expected: string): boolean => {
  if (!actual) {
    return false;
  }

  if (expected === "user email") {
    return actual === "user email" || actual === "email";
  }

  if (expected === "timestamp") {
    return actual.includes("timestamp");
  }

  if (expected === "event title") {
    return actual.includes("event title");
  }

  if (expected === "event date") {
    return actual.includes("event date");
  }

  if (expected === "going") {
    return actual.startsWith("going");
  }

  if (expected === "why not") {
    return actual.includes("why not");
  }

  if (expected === "went last time") {
    return actual.includes("went last");
  }

  if (expected === "comments") {
    return actual.startsWith("comments") || actual === "comment";
  }

  return actual === expected;
};

const getHeaderIssues = (
  rows: SheetCell[][],
  expectedHeaders: string[]
): string[] => {
  const headerRow = find(rows, (row) =>
    some(row, (cell) => normalizeString(cell) !== "")
  );

  if (!headerRow || isEmpty(headerRow)) {
    return ["missing-header-row"];
  }

  const issues = filter(
    map(expectedHeaders, (expected, index) => {
      const actual = normalizeHeaderValue(headerRow[index]);
      return matchesHeader(actual, expected)
        ? null
        : `header-mismatch:${expected}`;
    }),
    (issue): issue is string => Boolean(issue)
  );

  if (size(headerRow) < size(expectedHeaders)) {
    issues.push("missing-columns");
  }

  return issues;
};

export const getMembersHeaderIssues = (rows: SheetCell[][]): string[] =>
  getHeaderIssues(rows, membersHeaderExpected);

export const getResponsesHeaderIssues = (rows: SheetCell[][]): string[] =>
  getHeaderIssues(rows, responsesHeaderExpected);

export const parseMembersSheet = (rows: SheetCell[][]): ChoirMember[] =>
  filter(
    map(
      filter(rows, (row) => size(row) > 0 && !isMembersHeaderRow(row)),
      (row) => {
        const email = normalizeEmail(row[0]);
        const name = normalizeString(row[1]);
        return {
          email,
          name,
        };
      }
    ),
    (member) => size(member.email) > 0
  );

export const parseResponsesSheet = (rows: SheetCell[][]): RawResponse[] =>
  filter(
    map(
      filter(rows, (row) => size(row) > 0 && !isResponsesHeaderRow(row)),
      (row) => {
        const email = normalizeEmail(row[0]);
        const timestampMillis = normalizeTimestampMillis(row[1]);
        const eventTitle = normalizeString(row[2]);
        const eventDate = normalizeString(row[3]);
        const going = normalizeBoolean(row[4]);
        const whyNot = sanitizeText(normalizeString(row[5]));
        const wentLastTime = normalizeBoolean(row[6]);
        const comments = sanitizeText(normalizeString(row[7]));

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
      }
    ),
    (response) => size(response.email) > 0
  );
