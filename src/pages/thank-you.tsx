import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { NextPage } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import Layout from "../components/Layout";
import { StreakTracker } from "../components/StreakTracker";
import {
  computeCatGeneratorEligibility,
  fetchCatGeneratorConfig,
} from "../server/db/catGeneratorConfig";
import { useUserDbData } from "../server/db/useUserStreak";

const ThankYou: NextPage = () => {
  const [queryClient] = useState(() => new QueryClient());
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const { data: userData } = useUserDbData(userEmail || "");
  const { data: catConfig } = useQuery({
    queryKey: ["catGeneratorConfig"],
    queryFn: () => fetchCatGeneratorConfig(),
    enabled: Boolean(userEmail),
  });

  const eligibility = computeCatGeneratorEligibility({
    streak: userData?.data?.responseStreak ?? null,
    userEmail,
    config: catConfig,
  });

  const remaining =
    eligibility.config.accessStreak - (eligibility.streak ?? 0);

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
            <div className="mt-6 text-center">
              {eligibility.canAccess ? (
                <Link
                  href="/cat-generator"
                  className="btn bg-hell-fire text-white"
                >
                  לצפייה בגנרטור החתולים 🔥
                </Link>
              ) : (
                <p className="text-sm text-gray-500">
                  {eligibility.streak === null
                    ? "בודקים את הרצף שלך..."
                    : `עוד ${Math.max(
                        remaining,
                        1
                      )} דיווחים כדי לפתוח את גנרטור החתולים 🐱‍👤`}
                </p>
              )}
            </div>
          </>
        ) : (
          <p>אנא התחבר/י 🙂</p>
        )}
      </Layout>
    </QueryClientProvider>
  );
};

export default ThankYou;
