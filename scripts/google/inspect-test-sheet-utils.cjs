const { google } = require("googleapis");

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const parseRangesArg = (items) =>
  items
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);

const toA1PreviewRange = (title) => `${title}!A1:Z5`;

const buildSheetsClient = ({ credentials }) => {
  const auth = google.auth.fromJSON(JSON.parse(credentials));
  auth.scopes = DEFAULT_SCOPES;
  return google.sheets({ version: "v4", auth });
};

const getSheetTitles = async ({ sheets, spreadsheetId }) => {
  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
  return (
    sheetInfo.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter(Boolean) || []
  );
};

const getDefaultRanges = (sheetTitles) =>
  [
    sheetTitles.includes("Users") ? toA1PreviewRange("Users") : undefined,
    sheetTitles.includes("Responses")
      ? toA1PreviewRange("Responses")
      : undefined,
  ].filter(Boolean);

const batchGetValues = async ({ sheets, spreadsheetId, ranges }) =>
  sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
  });

const inspectSheet = async ({ sheets, spreadsheetId, ranges }) => {
  const sheetTitles = await getSheetTitles({ sheets, spreadsheetId });
  const resolvedRanges = ranges?.length ? ranges : getDefaultRanges(sheetTitles);

  if (!resolvedRanges.length) {
    return {
      spreadsheetId,
      sheetTitles,
      ranges: [],
      valueRanges: [],
    };
  }

  const response = await batchGetValues({
    sheets,
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

module.exports = {
  DEFAULT_SCOPES,
  parseRangesArg,
  toA1PreviewRange,
  buildSheetsClient,
  getSheetTitles,
  getDefaultRanges,
  batchGetValues,
  inspectSheet,
};
