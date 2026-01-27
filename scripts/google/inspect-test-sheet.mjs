import { google } from "googleapis";
import { env } from "../../src/env/server.mjs";

const spreadsheetId = env.TEST_SHEET_ID || env.SHEET_ID;

if (!spreadsheetId) {
    console.error("Missing TEST_SHEET_ID or SHEET_ID in env.");
    process.exit(1);
}

const rawCredentials = env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "";
if (!rawCredentials) {
    console.error("Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS in env.");
    process.exit(1);
}

const auth = google.auth.fromJSON(JSON.parse(rawCredentials));
auth.scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
];

const sheets = google.sheets({ version: "v4", auth });

const args = process.argv.slice(2);
const parseRangesArg = (items) =>
    items
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean);

const requestedRanges = parseRangesArg(
    args.filter((arg) => !arg.startsWith("--"))
);

const toA1PreviewRange = (title) => `${title}!A1:Z5`;

const getSheetTitles = async () => {
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    return (
        sheetInfo.data.sheets
            ?.map((sheet) => sheet.properties?.title)
            .filter(Boolean) || []
    );
};

const main = async () => {
    const sheetTitles = await getSheetTitles();
    console.log("Spreadsheet:", spreadsheetId);
    console.log("Sheets:", sheetTitles.join(", "));

    const ranges =
        requestedRanges.length > 0
            ? requestedRanges
            : [
                sheetTitles.includes("Users")
                    ? toA1PreviewRange("Users")
                    : undefined,
                sheetTitles.includes("Responses")
                    ? toA1PreviewRange("Responses")
                    : undefined,
            ].filter(Boolean);

    if (ranges.length === 0) {
        console.log("No ranges provided and no default tabs found.");
        return;
    }

    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
    });

    response.data.valueRanges?.forEach((range) => {
        console.log("\nRange:", range.range);
        console.log("Rows:", range.values ?? []);
    });
};

main().catch((error) => {
    console.error("Failed to inspect sheet:", error);
    process.exit(1);
});
