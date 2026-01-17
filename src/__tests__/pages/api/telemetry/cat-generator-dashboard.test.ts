/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from "next";

import handler from "../../../../pages/api/telemetry/cat-generator-dashboard";

const getServerAuthSessionMock = jest.fn();

jest.mock("../../../../server/common/get-server-auth-session", () => ({
  getServerAuthSession: (...args: any[]) => getServerAuthSessionMock(...args),
}));

const fetchTelemetryDashboardAllowlistMock = jest.fn();

jest.mock("../../../../server/db/telemetryDashboardConfig", () => {
  const actual = jest.requireActual(
    "../../../../server/db/telemetryDashboardConfig"
  );
  return {
    ...actual,
    fetchTelemetryDashboardAllowlist: (...args: any[]) =>
      fetchTelemetryDashboardAllowlistMock(...args),
  };
});

const createServiceRoleClientMock = jest.fn();

jest.mock("../../../../utils/supabase/serviceRoleClient", () => ({
  createServiceRoleClient: () => createServiceRoleClientMock(),
}));

const createMockRes = () => {
  const res: Partial<NextApiResponse> & {
    statusCode?: number;
    body?: any;
    headers: Record<string, string>;
  } = {
    headers: {},
    setHeader: (key: string, value: any) => {
      res.headers[key.toLowerCase()] = String(value);
      return res as any;
    },
    status: (code: number) => {
      res.statusCode = code;
      return res as any;
    },
    json: (body: any) => {
      res.body = body;
      return res as any;
    },
    end: () => {
      return res as any;
    },
  };

  return res as NextApiResponse & typeof res;
};

describe("GET /api/telemetry/cat-generator-dashboard", () => {
  afterEach(() => {
    getServerAuthSessionMock.mockReset();
    fetchTelemetryDashboardAllowlistMock.mockReset();
    createServiceRoleClientMock.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce(null);

    const req = { method: "GET" } as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when authenticated but not allowlisted", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce({
      user: { email: "other@example.com" },
    });

    fetchTelemetryDashboardAllowlistMock.mockResolvedValueOnce([
      "allowed@example.com",
    ]);

    const req = { method: "GET" } as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(403);
  });

  it("returns aggregated series + totals for allowlisted user", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce({
      user: { email: "allowed@example.com" },
    });

    fetchTelemetryDashboardAllowlistMock.mockResolvedValueOnce([
      "allowed@example.com",
    ]);

    const telemetryRows = [
      {
        created_at: "2026-01-15T10:00:00.000Z",
        event_name: "cta_impression",
      },
      {
        created_at: "2026-01-15T11:00:00.000Z",
        event_name: "cta_click",
      },
      {
        created_at: "2026-01-16T10:00:00.000Z",
        event_name: "cta_impression",
      },
    ];

    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      gte: () => chain,
      returns: async () => ({ data: telemetryRows, error: null }),
    };

    createServiceRoleClientMock.mockReturnValueOnce({
      from: () => chain,
    });

    const req = { method: "GET" } as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      totals: {
        impressions: 2,
        clicks: 1,
      },
    });

    expect(res.body.series).toEqual([
      {
        day: "2026-01-15",
        impressions: 1,
        clicks: 1,
        ctr: 1,
      },
      {
        day: "2026-01-16",
        impressions: 1,
        clicks: 0,
        ctr: 0,
      },
    ]);
  });
});
