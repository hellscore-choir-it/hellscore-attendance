import { env } from "../../src/env/server.mjs";
import inspectUtils from "./inspect-test-sheet-utils.cjs";

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

const sheets = inspectUtils.buildSheetsClient({ credentials: rawCredentials });

const args = process.argv.slice(2);
const requestedRanges = inspectUtils.parseRangesArg(
    args.filter((arg) => !arg.startsWith("--"))
);

const main = async () => {
    const result = await inspectUtils.inspectSheet({
        sheets,
        spreadsheetId,
        ranges: requestedRanges,
    });

    console.log("Spreadsheet:", result.spreadsheetId);
    console.log("Sheets:", result.sheetTitles.join(", "));

    if (!result.ranges.length) {
        console.log("No ranges provided and no default tabs found.");
        return;
    }

    result.valueRanges.forEach((range) => {
        console.log("\nRange:", range.range);
        console.log("Rows:", range.values ?? []);
    });
};

main().catch((error) => {
    console.error("Failed to inspect sheet:", error);
    process.exit(1);
});
