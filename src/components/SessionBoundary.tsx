import type { PropsWithChildren } from "react";

import Layout from "../components/Layout";
import { useAppSession } from "../utils/useAppSession";

const SessionBoundary: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: session, status } = useAppSession();
  return (
    <Layout>
      {status === "loading" ? (
        <p>טוען...</p>
      ) : session ? (
        <>{children}</>
      ) : (
        <p>אנא התחבר/י 🙂</p>
      )}
    </Layout>
  );
};

export default SessionBoundary;
