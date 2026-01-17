import { map } from "lodash";
import type { GetServerSideProps, NextPage } from "next";
import { useEffect, useState } from "react";

import SessionBoundary from "../../components/SessionBoundary";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import {
  fetchTelemetryDashboardAllowlist,
  isEmailAllowlisted,
} from "../../server/db/telemetryDashboardConfig";
import { isE2EServer } from "../../e2e/mode";
import { getE2EEmailFromGSSPContext } from "../../e2e/server/query";

type DashboardResponse = {
  totals: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  series: Array<{
    day: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (isE2EServer()) {
    const e2eEmail = getE2EEmailFromGSSPContext(ctx);
    if (!e2eEmail) {
      return {
        redirect: {
          destination: "/api/auth/signin",
          permanent: false,
        },
      };
    }
    return { props: {} };
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

  const allowlist = await fetchTelemetryDashboardAllowlist();
  if (!isEmailAllowlisted(allowlist, userEmail)) {
    return {
      redirect: {
        destination: "/thank-you",
        permanent: false,
      },
    };
  }

  return { props: {} };
};

const CatGeneratorTelemetryDashboardPage: NextPage = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const apiUrl = (() => {
          if (process.env.NEXT_PUBLIC_E2E_TEST_MODE !== "true") {
            return "/api/telemetry/cat-generator-dashboard";
          }

          const params = new URLSearchParams(window.location.search);
          const e2eEmail = params.get("e2eEmail");
          return e2eEmail
            ? `/api/telemetry/cat-generator-dashboard?e2eEmail=${encodeURIComponent(
                e2eEmail
              )}`
            : "/api/telemetry/cat-generator-dashboard";
        })();

        const res = await fetch(apiUrl);
        if (!res.ok) {
          setError(res.status === 403 ? "אין הרשאה" : "שגיאה בטעינת נתונים");
          return;
        }

        const json = (await res.json()) as DashboardResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("שגיאה בטעינת נתונים");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SessionBoundary>
      <div className="bg-gradient-shadow min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-hell-fire animate-glow-pulse text-3xl font-bold">
              Cat Generator Telemetry
            </h1>
            <p className="text-muted-foreground mt-2">
              CTA impressions/clicks ב-30 הימים האחרונים (ללא PII)
            </p>
          </div>

          {error && (
            <Card>
              <CardHeader>
                <CardTitle>שגיאה</CardTitle>
              </CardHeader>
              <CardContent>{error}</CardContent>
            </Card>
          )}

          {!error && !data && (
            <Card>
              <CardHeader>
                <CardTitle>טוען…</CardTitle>
              </CardHeader>
              <CardContent>מושך נתונים…</CardContent>
            </Card>
          )}

          {data && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CTR Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div>{`Impressions: ${data.totals.impressions}`}</div>
                  <div>{`Clicks: ${data.totals.clicks}`}</div>
                  <div>{`CTR: ${(data.totals.ctr * 100).toFixed(2)}%`}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Events Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day (UTC)</TableHead>
                        <TableHead>Impressions</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>CTR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.series.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>No data</TableCell>
                        </TableRow>
                      ) : (
                        map(data.series, (row) => (
                          <TableRow key={row.day}>
                            <TableCell>{row.day}</TableCell>
                            <TableCell>{row.impressions}</TableCell>
                            <TableCell>{row.clicks}</TableCell>
                            <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SessionBoundary>
  );
};

export default CatGeneratorTelemetryDashboardPage;
