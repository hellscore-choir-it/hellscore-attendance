import { filter, find, forEach, map, startsWith } from "lodash";
import type { InferGetStaticPropsType, NextPage } from "next";
import { useSession } from "next-auth/react";

import AttendanceForm from "../components/AttendanceForm";
import Layout from "../components/Layout";
import {
  getHellscoreEvents,
  getUserEventTypeAssignments,
} from "../server/googleApis";
import { ISOToHuman } from "../utils/dates";

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
        startsWith(event.summary || "", title)
      )?.title;
      const start = event.start?.dateTime;
      return { title, start };
    }),
    hasTitleAndStart
  );
  forEach(calendarData, (event) => {
    if (event.start) {
      event.start = ISOToHuman(event.start);
    }
  });
  return {
    props: { calendarData, userEvents },
    revalidate: 10,
  };
};

export default Home;
