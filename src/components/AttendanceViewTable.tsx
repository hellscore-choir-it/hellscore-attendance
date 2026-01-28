import { map } from "lodash";

import type { AttendanceStatus, AttendanceViewRow } from "../types/attendance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export type AttendanceSummary = {
  going: number;
  notGoing: number;
  noResponse: number;
  total: number;
};

const statusStyles: Record<AttendanceStatus, string> = {
  Going: "bg-green-50 text-green-900 dark:bg-green-900/30",
  "Not Going": "bg-red-50 text-red-900 dark:bg-red-900/30",
  "No Response": "bg-slate-50 text-slate-700 dark:bg-slate-800/40",
};

const formatTimestamp = (value: number | null) =>
  value ? new Date(value).toLocaleString() : "";

const resolveMemberName = (row: AttendanceViewRow) =>
  row.member.name || row.member.email;

const SummaryPill = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-800 dark:bg-slate-700 dark:text-slate-100">
    {label}: {value}
  </div>
);

const AttendanceViewTable = ({
  rows,
  summary,
  eventName,
}: {
  rows: AttendanceViewRow[];
  summary: AttendanceSummary;
  eventName: string;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{eventName}</h2>
        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Going" value={summary.going} />
          <SummaryPill label="Not Going" value={summary.notGoing} />
          <SummaryPill label="No Response" value={summary.noResponse} />
          <SummaryPill label="Total" value={summary.total} />
        </div>
      </div>
      <Table className="min-w-[640px] text-right">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">שם</TableHead>
            <TableHead className="text-right">אימייל</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right">סיבה</TableHead>
            <TableHead className="text-right">הערות</TableHead>
            <TableHead className="text-right">עודכן לאחרונה</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {map(rows, (row) => (
            <TableRow
              key={row.member.email}
              className={statusStyles[row.status]}
            >
              <TableCell>{resolveMemberName(row)}</TableCell>
              <TableCell>{row.member.email}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.reason}</TableCell>
              <TableCell>{row.comments}</TableCell>
              <TableCell>{formatTimestamp(row.lastUpdated)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceViewTable;
