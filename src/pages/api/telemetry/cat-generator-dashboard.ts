import { captureException } from "@sentry/nextjs";
import { map, reduce, sortBy } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import { getServerAuthSession } from "../../../server/common/get-server-auth-session";
import {
  fetchTelemetryDashboardAllowlist,
  isEmailAllowlisted,
} from "../../../server/db/telemetryDashboardConfig";
import { createServiceRoleClient } from "../../../utils/supabase/serviceRoleClient";
import { isE2EServer } from "../../../e2e/mode";
import { getE2EEmailFromApiRequest } from "../../../e2e/server/query";
import { getE2ETelemetryDashboardResponse } from "../../../e2e/server/telemetryDashboardFixture";

type DayRow = {
  day: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  ctr: number;
};

type ResponseBody = {
  totals: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  series: DayRow[];
};

const formatDayUTC = (date: Date) => date.toISOString().slice(0, 10);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return res.status(405).end();
  }

  if (isE2EServer()) {
    const e2eEmail = getE2EEmailFromApiRequest(req);
    if (!e2eEmail) return res.status(401).end();
    return res.status(200).json(getE2ETelemetryDashboardResponse());
  }

  const session = await getServerAuthSession({ req, res });
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return res.status(401).end();
  }

  const allowlist = await fetchTelemetryDashboardAllowlist();
  if (!isEmailAllowlisted(allowlist, userEmail)) {
    return res.status(403).end();
  }

  try {
    const supabase = createServiceRoleClient();

    // Minimal: last 30 days in UTC.
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);

    const { data, error } = await supabase
      .from("cat_generator_telemetry")
      .select("created_at,event_name")
      .eq("page", "thank-you")
      .in("event_name", ["cta_impression", "cta_click"])
      .gte("created_at", since.toISOString())
      .returns<Array<{ created_at: string; event_name: string }>>();

    if (error) {
      captureException(error, {
        extra: { source: "catGeneratorDashboardTelemetry" },
      });
      return res.status(500).json({ error: "Failed to load telemetry" });
    }

    const perDay = new Map<string, { impressions: number; clicks: number }>();

    for (const row of data ?? []) {
      const day = formatDayUTC(new Date(row.created_at));
      const current = perDay.get(day) ?? { impressions: 0, clicks: 0 };

      if (row.event_name === "cta_impression") {
        current.impressions += 1;
      } else if (row.event_name === "cta_click") {
        current.clicks += 1;
      }

      perDay.set(day, current);
    }

    const days = sortBy(Array.from(perDay.keys()));
    const series: DayRow[] = map(days, (day) => {
      const counts = perDay.get(day)!;
      const ctr =
        counts.impressions === 0 ? 0 : counts.clicks / counts.impressions;
      return {
        day,
        impressions: counts.impressions,
        clicks: counts.clicks,
        ctr,
      };
    });

    const totals = reduce(
      series,
      (acc, row) => {
        acc.impressions += row.impressions;
        acc.clicks += row.clicks;
        return acc;
      },
      { impressions: 0, clicks: 0 }
    );

    const response: ResponseBody = {
      totals: {
        ...totals,
        ctr: totals.impressions === 0 ? 0 : totals.clicks / totals.impressions,
      },
      series,
    };

    return res.status(200).json(response);
  } catch (error) {
    captureException(error, {
      extra: { source: "catGeneratorDashboardTelemetry" },
    });
    return res.status(500).json({ error: "Failed to load telemetry" });
  }
}
