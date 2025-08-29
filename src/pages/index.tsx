import { filter, find, map, startsWith } from "lodash";
import type { InferGetStaticPropsType, NextPage } from "next";
import { useSession } from "next-auth/react";

import AttendanceForm from "../components/AttendanceForm";
import Layout from "../components/Layout";
import {
  getHellscoreEvents,
  getUserEventTypeAssignments,
} from "../server/googleApis";

const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  calendarData,
  userEvents,
}) => {
  const { data: session } = useSession();

  return (
    <Layout>
      {session ? (
        <AttendanceForm {...{ calendarData, userEvents, session }} />
      ) : (
        <p>אנא התחבר/י כדי למלא את הטופס 🙂</p>
      )}
    </Layout>
  );
};

const hasTitleAndStart = (event: {
  title: string | undefined;
  start: string | null | undefined;
}): event is { title: string; start: string } =>
  Boolean(event.title && event.start);

export const getStaticProps = async () => {
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
