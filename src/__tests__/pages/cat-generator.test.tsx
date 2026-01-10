/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import CatGeneratorPage from "../../pages/cat-generator";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom lacks ResizeObserver
global.ResizeObserver = ResizeObserverMock;

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "user@example.com" } },
    status: "authenticated",
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() },
}));

const useUserDbDataMock = jest.fn(() => ({
  data: { data: { responseStreak: 0 } },
}));

jest.mock("../../server/db/useUserStreak", () => ({
  useUserDbData: (...args: any[]) => useUserDbDataMock(...args),
}));

jest.mock("../../server/db/catGeneratorConfig", () => {
  const actual = jest.requireActual("../../server/db/catGeneratorConfig");
  return {
    ...actual,
    DEFAULT_CAT_GENERATOR_CONFIG: {
      ...actual.DEFAULT_CAT_GENERATOR_CONFIG,
      accessStreak: 2,
    },
    computeCatGeneratorEligibility: actual.computeCatGeneratorEligibility,
    fetchCatGeneratorConfig: jest
      .fn()
      .mockResolvedValue({
        ...actual.DEFAULT_CAT_GENERATOR_CONFIG,
        accessStreak: 2,
      }),
  };
});

jest.mock("../../hooks/useCatGeneratorConfigQuery", () => ({
  useCatGeneratorConfigQuery: jest.fn(() => ({
    data: {
      accessStreak: 2,
      customizeStreak: 3,
      exportStreak: 5,
      rareTraitsStreak: 10,
      rolloutPaused: false,
      allowlist: [],
    },
    isLoading: false,
    isError: false,
  })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("cat-generator page gating", () => {
  afterEach(() => {
    useUserDbDataMock.mockReset();
    const { useCatGeneratorConfigQuery } = jest.requireMock(
      "../../hooks/useCatGeneratorConfigQuery"
    );
    if (useCatGeneratorConfigQuery?.mockClear) {
      useCatGeneratorConfigQuery.mockClear();
    }
  });

  it("shows locked state when streak below threshold", async () => {
    render(<CatGeneratorPage />, { wrapper });
    expect(
      await screen.findByText(/עוד 2 דיווחים כדי לפתוח את מחולל החתולים/i)
    ).toBeInTheDocument();
  });

  it("shows unlocked state when streak meets threshold", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      data: { data: { responseStreak: 3 } },
    }));

    render(<CatGeneratorPage />, { wrapper });
    await waitFor(() =>
      expect(screen.getByText(/מחולל החתולים/i)).toBeInTheDocument()
    );
  });

  it("renders and updates controls when interacting", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      data: { data: { responseStreak: 5 } },
    }));

    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0);

    render(<CatGeneratorPage />, { wrapper });

    const eyeGlowLabel = await screen.findByText(/Eye Glow Intensity:/i);
    expect(eyeGlowLabel).toHaveTextContent("75%");

    const randomButton = screen.getByRole("button", { name: /אקראי/i });
    randomButton.click();

    await waitFor(() =>
      expect(screen.getByText(/Eye Glow Intensity:/i)).toHaveTextContent("0%")
    );

    Math.random = originalRandom;
  });
});
