import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Layout from "../components/Layout";
import { StreakTracker } from "../components/StreakTracker";
import {
  computeCatGeneratorEligibility,
  fetchCatGeneratorConfig,
} from "../server/db/catGeneratorConfig";
import { useUserDbData } from "../server/db/useUserStreak";
import { logCatTelemetry } from "../utils/catTelemetry";

const ThankYou: NextPage = () => {
  const [queryClient] = useState(() => new QueryClient());
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const didLogImpressionRef = useRef(false);

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

  const remaining = eligibility.config.accessStreak - (eligibility.streak ?? 0);

  const nextMilestone = !eligibility.canCustomize
    ? { label: "התאמה אישית", threshold: eligibility.config.customizeStreak }
    : !eligibility.canExport
    ? { label: "ייצוא SVG", threshold: eligibility.config.exportStreak }
    : !eligibility.canUseRareTraits
    ? { label: "פלטות נדירות", threshold: eligibility.config.rareTraitsStreak }
    : null;

  const unlockedLabel = eligibility.canUseRareTraits
    ? "כל הפיצ'רים פתוחים 🎉"
    : eligibility.canExport
    ? "פתחת ייצוא SVG"
    : eligibility.canCustomize
    ? "פתחת התאמה אישית"
    : "פתחת צפייה בקמע";

  useEffect(() => {
    if (!userEmail) return;
    if (!eligibility.canAccess) return;
    if (eligibility.streak === null) return;
    if (didLogImpressionRef.current) return;

    didLogImpressionRef.current = true;
    void logCatTelemetry({ eventName: "cta_impression", page: "thank-you" });
  }, [eligibility.canAccess, eligibility.streak, userEmail]);

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
                <div className="space-y-2">
                  <Link
                    href="/cat-generator"
                    className="bg-hell-fire btn text-white"
                    onClick={() => {
                      void logCatTelemetry({
                        eventName: "cta_click",
                        page: "thank-you",
                      });
                    }}
                  >
                    לצפייה במחולל החתולים 🔥
                  </Link>

                  <p className="text-sm text-gray-500">{unlockedLabel}</p>

                  {nextMilestone && (
                    <p className="text-sm text-gray-500">
                      {eligibility.streak === null
                        ? `השלב הבא: ${nextMilestone.label} ברצף של ${nextMilestone.threshold} דיווחים.`
                        : `השלב הבא: ${nextMilestone.label} — עוד ${Math.max(
                            nextMilestone.threshold - eligibility.streak,
                            1
                          )} דיווחים (ברצף של ${nextMilestone.threshold}).`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {eligibility.streak === null
                    ? "בודקים את הרצף שלך..."
                    : `עוד ${Math.max(
                        remaining,
                        1
                      )} דיווחים כדי לפתוח את מחולל החתולים 🐱‍👤`}
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
