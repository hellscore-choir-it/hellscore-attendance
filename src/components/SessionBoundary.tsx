import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";

import Layout from "../components/Layout";

const SessionBoundary: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  return <Layout>{session ? <>{children}</> : <p>אנא התחבר/י 🙂</p>}</Layout>;
};

export default SessionBoundary;
