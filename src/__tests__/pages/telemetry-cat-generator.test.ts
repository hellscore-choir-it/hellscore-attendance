/**
 * @jest-environment node
 */
const getServerAuthSessionMock = jest.fn();

jest.mock("../../server/common/get-server-auth-session", () => ({
  getServerAuthSession: (...args: any[]) => getServerAuthSessionMock(...args),
}));

const fetchTelemetryDashboardAllowlistMock = jest.fn();

jest.mock("../../server/db/telemetryDashboardConfig", () => {
  const actual = jest.requireActual("../../server/db/telemetryDashboardConfig");
  return {
    ...actual,
    fetchTelemetryDashboardAllowlist: (...args: any[]) =>
      fetchTelemetryDashboardAllowlistMock(...args),
  };
});

describe("/telemetry/cat-generator getServerSideProps", () => {
  const importGssp = () =>
    (
      require("../../pages/telemetry/cat-generator") as {
        getServerSideProps: any;
      }
    ).getServerSideProps;

  afterEach(() => {
    getServerAuthSessionMock.mockReset();
    fetchTelemetryDashboardAllowlistMock.mockReset();
  });

  it("redirects to signin when not authenticated", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce(null);

    const getServerSideProps = importGssp();

    const result = await getServerSideProps({
      req: {} as any,
      res: {} as any,
      query: {},
      resolvedUrl: "/telemetry/cat-generator",
    } as any);

    expect(result).toMatchObject({
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    });
  });

  it("redirects to /thank-you when not allowlisted", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce({
      user: { email: "other@example.com" },
    });

    fetchTelemetryDashboardAllowlistMock.mockResolvedValueOnce([
      "allowed@example.com",
    ]);

    const getServerSideProps = importGssp();

    const result = await getServerSideProps({
      req: {} as any,
      res: {} as any,
      query: {},
      resolvedUrl: "/telemetry/cat-generator",
    } as any);

    expect(result).toMatchObject({
      redirect: {
        destination: "/thank-you",
        permanent: false,
      },
    });
  });

  it("allows allowlisted user", async () => {
    getServerAuthSessionMock.mockResolvedValueOnce({
      user: { email: "allowed@example.com" },
    });

    fetchTelemetryDashboardAllowlistMock.mockResolvedValueOnce([
      "allowed@example.com",
    ]);

    const getServerSideProps = importGssp();

    const result = await getServerSideProps({
      req: {} as any,
      res: {} as any,
      query: {},
      resolvedUrl: "/telemetry/cat-generator",
    } as any);

    expect(result).toMatchObject({ props: {} });
  });
});
