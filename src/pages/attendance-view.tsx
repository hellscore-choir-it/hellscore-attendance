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
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
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
import { getServerAuthSession } from "../server/common/get-server-auth-session";
import {
  fetchAttendanceViewAllowlist,
  isEmailAllowlisted,
} from "../server/db/attendanceViewConfig";
import { ISOToHuman } from "../utils/dates";
import { trpc } from "../utils/trpc";

const AttendanceViewPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ calendarData }) => {
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

  const canPickUpcoming = Boolean(
    upcomingDate && size(sortedDates) > 1 && eventDate !== upcomingDate
  );

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
            <button
              type="button"
              disabled={!canPickUpcoming}
              className="btn btn-sm self-start"
              onClick={() => setEventDate(upcomingDate as string)}
            >
              בחרו את הקרוב
            </button>
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
                    {upcomingDate && date === upcomingDate ? " (הקרובה)" : ""}
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (process.env.E2E_TEST_MODE === "true") {
    return {
      props: {
        calendarData: [
          {
            title: "E2E Event",
            start: new Date().toISOString(),
          },
        ],
      },
    };
  }

  const session = await getServerAuthSession({
    req: ctx.req,
    res: ctx.res,
  });

  const userEmail = session?.user?.email;
  if (!userEmail) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }

  const allowlist = await fetchAttendanceViewAllowlist();
  if (!isEmailAllowlisted(allowlist, userEmail)) {
    return {
      redirect: {
        destination: "/thank-you",
        permanent: false,
      },
    };
  }

  const { getHellscoreEvents, getUserEventTypeAssignments } = await import(
    "../server/googleApis"
  );

  const pastWindowStart = new Date();
  pastWindowStart.setMonth(pastWindowStart.getMonth() - 6);

  const [calendarDataRaw, userEvents] = await Promise.all([
    getHellscoreEvents({ timeMin: pastWindowStart.toISOString() }),
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
    props: { calendarData },
  };
};

export default AttendanceViewPage;
