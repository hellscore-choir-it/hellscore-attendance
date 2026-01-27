import { google } from "googleapis";
import { env } from "../../env/server.mjs";

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const parseRangesArg = (items: string[]) =>
  items
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);

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
  Boolean(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) &&
  Boolean(env.TEST_SHEET_ID || env.SHEET_ID);

export const parseInspectRangesArg = (items: string[]) => parseRangesArg(items);

export const inspectTestSheet = async (
  ranges: string[] = []
): Promise<InspectSheetResult> => {
  if (!env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS in env.");
  }

  const spreadsheetId = env.TEST_SHEET_ID || env.SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Missing TEST_SHEET_ID or SHEET_ID in env.");
  }

  const sheets = buildSheetsClient(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitles =
    sheetInfo.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter(Boolean) || [];

  const defaultRanges = [
    sheetTitles.includes("Users") ? toA1PreviewRange("Users") : undefined,
    sheetTitles.includes("Responses")
      ? toA1PreviewRange("Responses")
      : undefined,
  ].filter(Boolean) as string[];

  const resolvedRanges = ranges.length ? ranges : defaultRanges;

  if (resolvedRanges.length === 0) {
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
