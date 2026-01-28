# Attendance Sheet Notes (local XLSX inspection)

Source: temporary-files-for-agents/Hellscore attendance.xlsx

Inspection helper: use [src/testUtils/inspectTestSheet.ts](src/testUtils/inspectTestSheet.ts) for test-sheet validation instead of a standalone script.

## Named ranges

- event_title → Events!$A$2:$A$21
- response → Responses!$A$1
- view_attendance_selected_event → View Attendance!$B$1
- view_attendance_selected_date → View Attendance!$B$2
- relevant_emails → Helpers!$G$2:$G$1000
- attendance_summary_from_date → Attendance Summary!$B$2
- reversed_response_dates → Helpers!$A$1:$A$1000
- attendance_summary_selected_event → Attendance Summary!$B$1
- attendance_summary_to_date → Attendance Summary!$B$3
- attendance_summary_relevant_emails → Helpers!$N$2:$N$1000
- user_email → Users!$A$2:$A$94
- user_event_event_title → User Events!$B$2:$B$953
- attendance_sum → Helpers!$O$2:$O$1000
- attendance → Helpers!$G$1:$K$1000
- user_event_user_email → User Events!$A$2:$A$953
- selected_responses → Helpers!$B$1:$F$1000
- user_name → Users!$B$2:$B$94
- attendance_summary → Helpers!$L$1:$L$1000
- aggregated_responses → Helpers!$L$2:$M$1000

## Major queries and formulas

### Helpers sheet

- A1 (date list for selected event):
  - =IFERROR(sort(unique(query(ArrayFormula({Responses!$C2:$C1000, (TO_TEXT(Responses!$D2:$D1000))}), "select Col2 where Col1 = '" & view_attendance_selected_event & "' and Col2 is not null")), 1, False), "Wed Sep 17 2025 5:00:00 PM")
- B1 (selected responses header + data):
  - =IFERROR(QUERY(Responses!A:J, "select A, E, F, G, H where J=true and C='" & view_attendance_selected_event & "' and toDate(D) = date '" & year(view_attendance_selected_date) & "-" & month(view_attendance_selected_date) & "-" & day(view_attendance_selected_date) & "'", 1), "User Email")
- G2 (relevant emails for selected event):
  - =IFERROR(QUERY({user_event_user_email,user_event_event_title}, "select Col1 where Col2='" & view_attendance_selected_event & "'", 0), "ofirfufu@gmail.com")
- H2:K1000 (lookup selected responses by email):
  - =iferror(VLOOKUP(relevant_emails,selected_responses,{2,3,4,5}, False),)

### View Attendance sheet

- C1:C1000 (member names by email):
  - ={"Name";IF(ISBLANK($H$2:$H1000),,VLOOKUP($H$2:$H1000,{user_email,user_name},2,False))}
- D1 (view attendance query projection):
  - =IFERROR(QUERY({attendance}, "select Col2, Col3, Col4, Col5, Col1 where Col1 <> '' order by Col2", 1), "Going?")
  - (Columns in `attendance` are Helpers!G1:K1000; `attendance` itself is populated by `relevant_emails` + H2:K1000.)

### Attendance Summary sheet

- C1:C1000 (member names by email):
  - ={"Name";IF(ISBLANK(attendance_summary_relevant_emails),,VLOOKUP(attendance_summary_relevant_emails,{user_email,user_name},2,False))}
- D1:D1000 (events missed):
  - ={"Events missed"; IF(ISBLANK(attendance_sum),,max(attendance_sum) - attendance_sum)}
- Helpers L1 (summary aggregation by user + date range):
  - =IFERROR(query(Responses!A:J, "select A, count(C) where J = true and E = true and C = '" & attendance_summary_selected_event & "' and toDate(D) >= date '" & year(if(isblank(attendance_summary_from_date), EPOCHTODATE(0), attendance_summary_from_date)) & "-" & month(if(isblank(attendance_summary_from_date), EPOCHTODATE(0), attendance_summary_from_date)) & "-" & day(if(isblank(attendance_summary_from_date), EPOCHTODATE(0), attendance_summary_from_date)) & "' and toDate(D) <= date '" & year(if(isblank(attendance_summary_to_date), today(), attendance_summary_to_date)) & "-" & month(if(isblank(attendance_summary_to_date), today(), attendance_summary_to_date)) & "-" & day(if(isblank(attendance_summary_to_date), today(), attendance_summary_to_date)) & "' group by A"), "User Email")

## Practical interpretation for app logic

- “View Attendance” uses `Responses` filtered by event title and exact date (via `toDate`) plus `Is Last Submission = true` (column J) to compute the latest response per email.
- Emails are pre-filtered using `User Events` (email + event title), then VLOOKUP is used to fill per-user fields.
- Display order is by member name (query order by Col2 in View Attendance).
