import { filter, includes, map, orderBy } from "lodash";
import { useMemo, useState } from "react";

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
  Going: "bg-green-50 text-green-900 dark:bg-green-900/60 dark:text-green-100",
  "Not Going": "bg-red-50 text-red-900 dark:bg-red-900/60 dark:text-red-100",
  "No Response":
    "bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200",
};

const statusLabels: Record<AttendanceStatus, string> = {
  Going: "מגיעים",
  "Not Going": "לא מגיעים",
  "No Response": "לא ענו",
};

const formatTimestamp = (value: number | null) =>
  value ? new Date(value).toLocaleString() : "";

const resolveMemberName = (row: AttendanceViewRow) =>
  row.member.name || row.member.email;

const SummaryPill = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
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
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">(
    "all"
  );
  const [searchValue, setSearchValue] = useState("");
  const [sortKey, setSortKey] = useState<
    "name" | "email" | "status" | "lastUpdated"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    return filter(rows, (row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const candidate = `${resolveMemberName(row)} ${row.member.email}`
        .toLowerCase()
        .trim();
      return includes(candidate, normalizedSearch);
    });
  }, [rows, normalizedSearch, statusFilter]);

  const sortedRows = useMemo(() => {
    const getSortValue = (row: AttendanceViewRow) => {
      if (sortKey === "name") {
        return resolveMemberName(row).toLowerCase();
      }
      if (sortKey === "email") {
        return row.member.email.toLowerCase();
      }
      if (sortKey === "status") {
        return row.status;
      }
      return row.lastUpdated ?? 0;
    };

    return orderBy(filteredRows, getSortValue, sortDirection);
  }, [filteredRows, sortDirection, sortKey]);

  const handleSortChange = (
    key: "name" | "email" | "status" | "lastUpdated"
  ) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortIndicator = (key: typeof sortKey) =>
    sortKey === key ? (sortDirection === "asc" ? "▲" : "▼") : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{eventName}</h2>
        <div className="flex flex-wrap gap-2">
          <SummaryPill label="מגיעים" value={summary.going} />
          <SummaryPill label="לא מגיעים" value={summary.notGoing} />
          <SummaryPill label="לא ענו" value={summary.noResponse} />
          <SummaryPill label="סה״כ" value={summary.total} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-slate-600 dark:text-slate-300">חיפוש</span>
            <input
              className="input input-bordered bg-white text-right text-slate-900 dark:bg-slate-900 dark:text-slate-100"
              placeholder="חיפוש לפי שם או אימייל"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-slate-600 dark:text-slate-300">סטטוס</span>
            <select
              className="input input-bordered bg-white text-right text-slate-900 dark:bg-slate-900 dark:text-slate-100"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AttendanceStatus | "all")
              }
            >
              <option value="all">הכול</option>
              <option value="Going">מגיעים</option>
              <option value="Not Going">לא מגיעים</option>
              <option value="No Response">לא ענו</option>
            </select>
          </label>
        </div>
      </div>
      <Table className="min-w-[640px] text-right text-slate-900 dark:text-slate-100">
        <TableHeader className="bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <TableRow>
            <TableHead className="text-right font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-2"
                onClick={() => handleSortChange("name")}
              >
                שם {sortIndicator("name")}
              </button>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-2"
                onClick={() => handleSortChange("email")}
              >
                אימייל {sortIndicator("email")}
              </button>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-2"
                onClick={() => handleSortChange("status")}
              >
                סטטוס {sortIndicator("status")}
              </button>
            </TableHead>
            <TableHead className="text-right font-semibold">סיבה</TableHead>
            <TableHead className="text-right font-semibold">הערות</TableHead>
            <TableHead className="text-right font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-2"
                onClick={() => handleSortChange("lastUpdated")}
              >
                עודכן לאחרונה {sortIndicator("lastUpdated")}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {map(sortedRows, (row, index) => (
            <TableRow
              key={`${row.member.email}-${index}`}
              className={statusStyles[row.status]}
            >
              <TableCell>{resolveMemberName(row)}</TableCell>
              <TableCell>{row.member.email}</TableCell>
              <TableCell>{statusLabels[row.status]}</TableCell>
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
