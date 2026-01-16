/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const logCatTelemetryMock = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ onClick, children, ...rest }: any) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

const useUserDbDataMock = jest.fn(() => ({
  data: { data: { responseStreak: 1 } },
}));

jest.mock("../../server/db/useUserStreak", () => ({
  useUserDbData: (..._args: any[]) => useUserDbDataMock(),
}));

jest.mock("../../utils/catTelemetry", () => ({
  logCatTelemetry: (...args: any[]) => logCatTelemetryMock(...args),
}));

jest.mock("../../server/db/catGeneratorConfig", () => {
  const actual = jest.requireActual("../../server/db/catGeneratorConfig");
  return {
    ...actual,
    fetchCatGeneratorConfig: jest.fn().mockResolvedValue({
      ...actual.DEFAULT_CAT_GENERATOR_CONFIG,
      accessStreak: 2,
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const ThankYou = require("../../pages/thank-you").default;

describe("thank-you page", () => {
  beforeEach(() => {
    logCatTelemetryMock.mockClear();
    useUserDbDataMock.mockReset();
    useUserDbDataMock.mockReturnValue({
      data: { data: { responseStreak: 1 } },
    });
  });

  it("shows locked message when streak below threshold", async () => {
    render(<ThankYou />, { wrapper });
    expect(
      await screen.findByText(/עוד 1 דיווחים כדי לפתוח את מחולל החתולים/i)
    ).toBeInTheDocument();
    expect(logCatTelemetryMock).not.toHaveBeenCalled();
  });

  it("logs impression once and logs click when eligible", async () => {
    useUserDbDataMock.mockReturnValue({
      data: { data: { responseStreak: 2 } },
    });

    render(<ThankYou />, { wrapper });

    const cta = await screen.findByRole("button", {
      name: /לצפייה במחולל החתולים/i,
    });

    // Impression should be logged once for eligible users.
    expect(logCatTelemetryMock).toHaveBeenCalledWith({
      eventName: "cta_impression",
      page: "thank-you",
    });

    // Click should log a separate event.
    await userEvent.click(cta);
    expect(logCatTelemetryMock).toHaveBeenCalledWith({
      eventName: "cta_click",
      page: "thank-you",
    });
  });
});
