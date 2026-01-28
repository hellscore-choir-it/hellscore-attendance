import { google } from "googleapis";
import { compact, flatMap, includes, map, size, split, trim } from "lodash";

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const parseRangesArg = (items: string[]) =>
  compact(
    map(flatMap(items, (item) => split(item, ",")), (item) => trim(item))
  );

const toA1PreviewRange = (title: string) => `${title}!A1:Z5`;

const buildSheetsClient = (credentials: string) => {
  const auth = google.auth.fromJSON(JSON.parse(credentials));
  auth.scopes = DEFAULT_SCOPES;
  return google.sheets({ version: "v4", auth });
};

type InspectSheetValueRange = {
  range?: string | null;
  values?: Array<Array<string>>;
};

export type InspectSheetResult = {
  spreadsheetId: string;
  sheetTitles: string[];
  ranges: string[];
  valueRanges: InspectSheetValueRange[];
};

export const canInspectTestSheet = () =>
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) &&
  Boolean(process.env.TEST_SHEET_ID || process.env.SHEET_ID);

export const parseInspectRangesArg = (items: string[]) => parseRangesArg(items);

export const inspectTestSheet = async (
  ranges: string[] = []
): Promise<InspectSheetResult> => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS in env.");
  }

  const spreadsheetId = process.env.TEST_SHEET_ID || process.env.SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Missing TEST_SHEET_ID or SHEET_ID in env.");
  }

  const sheets = buildSheetsClient(
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  );
  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitles = compact(
    map(sheetInfo.data.sheets ?? [], (sheet) => sheet.properties?.title)
  );

  const defaultRanges = compact([
    includes(sheetTitles, "Users") ? toA1PreviewRange("Users") : undefined,
    includes(sheetTitles, "Responses")
      ? toA1PreviewRange("Responses")
      : undefined,
  ]);

  const resolvedRanges = size(ranges) ? ranges : defaultRanges;

  if (size(resolvedRanges) === 0) {
    return {
      spreadsheetId,
      sheetTitles,
      ranges: [],
      valueRanges: [],
    };
  }

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: resolvedRanges,
  });

  return {
    spreadsheetId,
    sheetTitles,
    ranges: resolvedRanges,
    valueRanges: response.data.valueRanges ?? [],
  };
};
