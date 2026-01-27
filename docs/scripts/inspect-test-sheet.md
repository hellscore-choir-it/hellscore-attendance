# inspect-test-sheet.mjs

Purpose: Preview sheet tabs and header rows from the test Google Sheet. Used to verify A1 ranges/headers before adding tests.

## Prerequisites

The script imports `env` from `src/env/server.mjs`, so **all required server env vars must be present** (not just sheet vars). Use a populated `.env` file or export the required variables before running.

Minimum sheet-specific vars:

- `TEST_SHEET_ID` (preferred) or `SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (JSON string)

## Usage

Run without arguments to preview Users/Responses tabs if they exist:

- Command:
  - `node scripts/google/inspect-test-sheet.mjs`

Optional: pass explicit A1 ranges or sheet names (comma-separated values allowed):

- Examples:
  - `node scripts/google/inspect-test-sheet.mjs Users!A1:Z5 Responses!A1:Z5`
  - `node scripts/google/inspect-test-sheet.mjs Users!A1:Z5,Responses!A1:Z5`

## Output

- Prints the spreadsheet ID and sheet titles.
- For each requested range, prints the A1 range and the rows returned.

## Notes

If you see an env validation error, ensure `.env` includes all required server variables (per `src/env/schema.mjs`).

### Loading `.env`

The script does not auto-load `.env`. If your Node version supports `--env-file`, run:

- `NODE_ENV=development node --env-file .env scripts/google/inspect-test-sheet.mjs`

If `--env-file` is unavailable, use a small Python wrapper to load `.env` into the environment before running Node (this avoids shell parsing issues with JSON values like `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`).

### Example output (test sheet)

- Sheets: Responses, Users, View Attendance, Attendance Summary, Helpers, Events, User Events, User Events (currently not relevant)
- Users!A1:Z5 headers: Email, Name
- Responses!A1:Z5 headers: User Email, Timestamp millis, Event Title, Event Date, Going?, Why Not?, Went Last Time?, Comments, Row Key, Is Last Submission
