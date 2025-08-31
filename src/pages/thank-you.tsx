import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextPage } from "next";
import { useSession } from "next-auth/react";

import { useState } from "react";
import Layout from "../components/Layout";
import { StreakTracker } from "../components/StreakTracker";

const ThankYou: NextPage = () => {
  const [queryClient] = useState(() => new QueryClient());
  const { data: session } = useSession();
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        {session ? (
          <>
            <h2 className="mb-3 mt-10 text-center text-5xl">
              תודה על הדיווח ❤️
            </h2>
            {session?.user?.email && (
              <StreakTracker userEmail={session?.user?.email} />
            )}
          </>
        ) : (
          <p>אנא התחבר/י 🙂</p>
        )}
      </Layout>
    </QueryClientProvider>
  );
};

export default ThankYou;
