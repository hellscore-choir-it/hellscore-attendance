import {
  compact,
  filter,
  find,
  first,
  includes,
  map,
  orderBy,
  size,
  startsWith,
  uniq,
} from "lodash";
import type { InferGetStaticPropsType, NextPage } from "next";
import { useEffect, useMemo, useState } from "react";

import AttendanceViewTable from "../components/AttendanceViewTable";
import SessionBoundary from "../components/SessionBoundary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ISOToHuman } from "../utils/dates";
import { trpc } from "../utils/trpc";

const AttendanceViewPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ calendarData, userEvents }) => {
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");

  const availableTitles = useMemo(
    () => uniq(compact(map(calendarData, "title"))),
    [calendarData]
  );

  useEffect(() => {
    if (eventTitle && !includes(availableTitles, eventTitle)) {
      setEventTitle("");
      setEventDate("");
    }
  }, [availableTitles, eventTitle]);

  const relevantDates = useMemo(() => {
    if (!size(calendarData)) return [];
    const scopedEvents = eventTitle
      ? filter(calendarData, { title: eventTitle })
      : calendarData;
    return compact(map(scopedEvents, "start"));
  }, [calendarData, eventTitle]);

  const sortedDates = useMemo(
    () => orderBy(relevantDates, (date) => new Date(date).getTime(), "asc"),
    [relevantDates]
  );

  const upcomingDate = useMemo(() => {
    if (!size(sortedDates)) return undefined;
    const now = Date.now();
    return find(sortedDates, (iso) => new Date(iso).getTime() >= now);
  }, [sortedDates]);

  useEffect(() => {
    if (eventDate && !includes(sortedDates, eventDate)) {
      setEventDate("");
    }
  }, [eventDate, sortedDates]);

  useEffect(() => {
    if (!eventDate && size(sortedDates) === 1) {
      setEventDate(first(sortedDates) as string);
    }
  }, [eventDate, sortedDates]);

  const eventDateForQuery = eventDate || "";

  const isQueryEnabled = Boolean(eventDateForQuery);

  const attendanceQuery = trpc.google.getAttendanceView.useQuery(
    {
      eventDate: eventDateForQuery,
      eventTitle: eventTitle || undefined,
    },
    { enabled: isQueryEnabled }
  );

  const eventLabelDate = eventDate ? ISOToHuman(eventDate) : "";
  const eventLabel = eventTitle
    ? `${eventTitle} - ${eventLabelDate}`
    : `נוכחות - ${eventLabelDate}`;

  const titleSelectValue = eventTitle || "all";
  const dateSelectValue = eventDate || undefined;

  return (
    <SessionBoundary>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold">צפייה בנוכחות</h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              סוג אירוע
            </span>
            <Select
              value={titleSelectValue}
              onValueChange={(value) =>
                setEventTitle(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="text-right">
                <SelectValue placeholder="כל האירועים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האירועים</SelectItem>
                {map(availableTitles, (title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              תאריך
            </span>
            <Select
              value={dateSelectValue}
              onValueChange={setEventDate}
              disabled={!size(sortedDates)}
            >
              <SelectTrigger className="text-right">
                <SelectValue placeholder="בחרו תאריך" />
              </SelectTrigger>
              <SelectContent>
                {map(sortedDates, (date) => (
                  <SelectItem value={date} key={date}>
                    {ISOToHuman(date)}
                    {upcomingDate && date === upcomingDate ? " (הקרוב)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        {isQueryEnabled && attendanceQuery.isLoading && <p>טוען...</p>}
        {isQueryEnabled && attendanceQuery.error && (
          <p className="text-red-600">{attendanceQuery.error.message}</p>
        )}
        {isQueryEnabled &&
          !attendanceQuery.isLoading &&
          attendanceQuery.data &&
          size(attendanceQuery.data.rows) === 0 && (
            <p>אין נתונים לתצוגה עבור הבחירה הזו.</p>
          )}
        {isQueryEnabled &&
          attendanceQuery.data &&
          size(attendanceQuery.data.rows) > 0 && (
            <AttendanceViewTable
              rows={attendanceQuery.data.rows}
              summary={attendanceQuery.data.summary}
              eventName={eventLabel}
            />
          )}
      </div>
    </SessionBoundary>
  );
};

const hasTitleAndStart = (event: {
  title: string | undefined;
  start: string | null | undefined;
}): event is { title: string; start: string } =>
  Boolean(event.title && event.start);

export const getStaticProps = async () => {
  if (process.env.E2E_TEST_MODE === "true") {
    return {
      props: {
        calendarData: [
          {
            title: "E2E Event",
            start: new Date().toISOString(),
          },
        ],
        userEvents: [
          {
            title: "E2E Event",
            email: "e2e@example.com",
          },
        ],
      },
      revalidate: 10,
    };
  }

  const { getHellscoreEvents, getUserEventTypeAssignments } = await import(
    "../server/googleApis"
  );

  const [calendarDataRaw, userEvents] = await Promise.all([
    getHellscoreEvents(),
    getUserEventTypeAssignments(),
  ]);

  const calendarData = filter(
    map(calendarDataRaw, (event) => {
      const title = find(userEvents, ({ title }) =>
        startsWith(event?.summary || "", title)
      )?.title;
      if (!title) {
        console.warn("No matching title found for event:", event?.summary);
      }
      const start = event?.start?.dateTime;
      return { title, start };
    }),
    hasTitleAndStart
  );

  return {
    props: { calendarData, userEvents },
    revalidate: 10,
  };
};

export default AttendanceViewPage;
