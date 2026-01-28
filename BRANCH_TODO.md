# Branch Plan: View Attendance

Goal: Recreate the Google Sheets “View Attendance” logic inside the app, using the same Sheets data source and showing the latest response per user for a selected event/date.

## Agent constraints (must follow during this branch)

- Create frequent, self-contained, well-documented commits.
- Before proceeding to a new phase, ensure all prior phase tasks are complete by running tests.
- Update this file (`BRANCH_TODO.md`) as progress is made (check items off + add brief notes when useful).
- Checkpoint with the user for any significant questions/changes (thresholds, feature set, telemetry approach).
- Prefer existing code patterns/styles in this repo; avoid inventing new patterns unless necessary.

## Phase 0 — Inspect Sheet Dump (local-only) or Test Sheet (script)

- [x] Confirm column headers and ranges using either the XLSX dump or the inspection helper.
  - [x] Option A (local XLSX): Open the XLSX from temporary-files-for-agents and identify sheet tabs (Users, Responses, View Attendance).
  - [x] Option B (test sheet): Use the test inspection helper to list sheet tabs and preview headers.
    - Ran against TEST_SHEET_ID; Users/Responses headers match XLSX dump.
  - [x] Record the column order and header names for the Users and Responses tabs.
    - Users headers (A1:B1): Email, Name
    - Responses headers (A1:J1): User Email, Timestamp millis, Event Title, Event Date, Going?, Why Not?, Went Last Time?, Comments, Row Key, Is Last Submission
  - [x] Note the exact column used as unique member key (email) and any event title/date columns used for filtering.
    - Unique key: Users.Email / Responses.User Email
    - Event filters: Responses.Event Date (primary), Responses.Event Title (optional)
  - [x] Capture the “latest submission” rule used (timestamp column name and format).
    - Use Responses.Timestamp millis (epoch ms) to select latest per user
- [x] Investigate named ranges and major sheet queries.
  - [x] List named ranges (e.g., selected event/date, relevant emails, selected responses).
  - [x] Capture core QUERY/VLOOKUP formulas that drive View Attendance.
- [x] Record sheet findings in docs/agents/attendance-sheet.md.
- [x] Document the ranges to query in Google Sheets (named ranges or A1 ranges).
  - [x] Add a brief mapping section to README or a new internal doc if helpful.
  - A1 ranges (from XLSX dump):
    - Users!A1:B (Email, Name)
    - Responses!A1:J (User Email, Timestamp millis, Event Title, Event Date, Going?, Why Not?, Went Last Time?, Comments, Row Key, Is Last Submission)

## Phase 1 — Test First: Specs and Fixtures

- [x] Refactor inspect-test-sheet logic into a test util to reuse the same query logic in integration tests.
- [x] Add initial test specs for the attendance view logic.
  - [x] Create src/**tests**/utils/attendance-view.test.ts with failing tests that encode the expected behavior.
  - [x] Include duplicate submissions for a single user to confirm latest wins.
  - [x] Include a member with no responses to confirm “No Response”.
- [x] Add guarded integration tests that can hit the test sheet when env vars are present.
  - [x] Use the test inspection helper to derive real headers/ranges to validate.
  - [x] Add regression tests for existing Google Sheets features (e.g., `getUserEventTypeAssignments`, `writeResponseRow`) when the test sheet is configured.

## Phase 2 — Types and Normalization

- [x] Add Typescript interfaces for attendance data.
  - [x] Create src/types/attendance.ts with:
    - `ChoirMember` (name, email).
    - `RawResponse` (email, timestampMillis, eventTitle, eventDate, going, whyNot, wentLastTime, comments).
    - `AttendanceViewRow` (member, status, reason, comments, lastUpdated).
- [x] Add normalization helpers to convert raw sheet rows into typed objects.
  - [x] Create src/utils/attendance/normalize.ts with functions like:
    - `parseMembersSheet(rows)` → `ChoirMember[]`.
    - `parseResponsesSheet(rows)` → `RawResponse[]`.
  - [x] Normalize booleans (TRUE/FALSE, yes/no) into actual booleans.
  - [x] Normalize timestamp to millis and create `Date` objects as needed.

## Phase 3 — Business Logic (View Attendance)

- [x] Implement the core “latest response per user” logic.
  - [x] Create src/utils/attendance/view.ts with `getAttendanceView(allMembers, allResponses, targetEventDate, targetEventTitle?)`.
  - [x] Filter responses by event date (and optionally title if both are required).
  - [x] Reduce to latest response per member by timestampMillis.
  - [x] Map to `AttendanceViewRow` with status values:
    - Going → response.going === true
    - Not Going → response.going === false
    - No Response → no matching response
  - [x] Default missing reason/comments to empty strings.
  - [x] Update the initial tests to pass once the implementation is complete.

## Phase 4 — Google Sheets Data Fetch

- [x] Add Sheets fetch functions in src/server/googleApis.ts.
  - [x] Implement `getSheetMembers()` to read the Users tab (use RequestQueue + retry).
  - [x] Implement `getSheetResponses()` to read the Responses tab (use RequestQueue + retry).
  - [x] Reuse `doAsyncOperationWithRetry` and `RequestQueue` patterns.
  - [x] Add Zod schemas to validate incoming sheet data structure.
- [x] Ensure sanitize/validation rules are consistent with existing `attendanceSchema` usage.
- [x] Use the test inspection helper to validate the A1 ranges and header expectations against the test sheet.

## Phase 5 — TRPC Procedure

- [x] Add a protected TRPC endpoint for the view.
  - [x] Update src/server/trpc/router/google.ts with `google.getAttendanceView`.
  - [x] Input: `{ eventDate: string; eventTitle?: string }` validated via Zod.
  - [x] Authorization: gate with session and optionally restrict to admin emails using `ADMIN_EMAILS`.
  - [x] Load members + responses from Sheets, normalize, then compute view.
  - [x] Return rows plus summary counts (going, notGoing, noResponse, total).
  - [x] Log and capture exceptions with Sentry.

## Phase 6 — UI View (Page + Table)

- [x] Build a table component for the attendance view.
  - [x] Create src/components/AttendanceViewTable.tsx.
  - [x] Props: `rows`, `summary`, `eventName`.
  - [x] Row colors: going = green, not going = red, no response = gray/white.
- [x] Add a page to display the view.
  - [x] Create src/pages/attendance-view.tsx.
  - [x] Use `SessionBoundary` and `Layout`.
  - [x] Add date/event selector (Dropdown or calendar input).
  - [x] Call `trpc.google.getAttendanceView` and render the table.
  - [x] Show loading, empty, and error states using existing UI patterns.
  - [x] Make sure you get the list of choir member who didn't respond to and event from the Users assigned to `User Events`.
- [x] Protect the page to users:
  - [x] using emails with sheet access.
  - [x] using a DB config containing allowed emails (similar to admin check).
- [x] Add protections to the API calls as well based on the same logic.
  - Access gating now uses an app_config allowlist with `ADMIN_EMAILS` fallback in attendance view.

## Phase 7 — Tests and QA

- [x] Add component tests for the new table.
  - [x] Include snapshot tests for row coloring.
  - [x] Include tests for summary counts.
- [x] Extend/maintain integration tests as new sheet calls are added.
- [x] Add unit tests for `google.getAttendanceView` router.
- [x] Add end-to-end tests for the attendance view page.
- [x] Run pnpm test, pnpm typecheck.

## Phase 8 — Observability and Edge Cases

- [ ] Add Sentry logging for parsing failures, unexpected data shapes, or missing columns.
- [ ] Add guardrails for missing data (return empty view with warning instead of hard crash).
- [ ] Verify behavior for:
  - [ ] Multiple responses for the same user/date.
  - [ ] Missing or malformed email.
  - [ ] Event title mismatch.

## Deliverables Checklist

- [x] src/types/attendance.ts
- [x] src/utils/attendance/normalize.ts
- [x] src/utils/attendance/view.ts
- [x] src/server/googleApis.ts updates (new getters + schemas)
- [x] src/server/trpc/router/google.ts updates
- [x] src/components/AttendanceViewTable.tsx
- [x] src/pages/attendance-view.tsx
- [x] Tests in src/**tests**/utils and src/**tests**/components
