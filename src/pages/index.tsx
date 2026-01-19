import { filter, find, map, startsWith } from "lodash";
import type { InferGetStaticPropsType, NextPage } from "next";

import AttendanceForm from "../components/AttendanceForm";
import SessionBoundary from "../components/SessionBoundary";
import { useAppSession } from "../utils/useAppSession";

const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  calendarData,
  userEvents,
}) => {
  const { data: session } = useAppSession();

  return (
    <SessionBoundary>
      {session && <AttendanceForm {...{ calendarData, userEvents, session }} />}
    </SessionBoundary>
  );
};

const hasTitleAndStart = (event: {
  title: string | undefined;
  start: string | null | undefined;
}): event is { title: string; start: string } =>
  Boolean(event.title && event.start);

export const getStaticProps = async () => {
  // E2E mode: avoid any real Google calls (and avoid importing googleApis).
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

export default Home;
