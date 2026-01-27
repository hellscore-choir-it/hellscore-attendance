import { env } from "../../env/server.mjs";
import inspectUtils from "../../../scripts/google/inspect-test-sheet-utils.cjs";

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

  const sheets = inspectUtils.buildSheetsClient({
    credentials: env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  });

  return inspectUtils.inspectSheet({
    sheets,
    spreadsheetId,
    ranges,
  }) as InspectSheetResult;
};
