/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type CatConfig } from "../../components/CatGenerator/types";
import CatGeneratorPage from "../../pages/cat-generator";

const replaceMock = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "user@example.com" } },
    status: "authenticated",
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() },
}));

const receivedHellCatConfigs: CatConfig[] = [];
jest.mock("../../components/CatGenerator/HellCat", () => ({
  HellCat: ({ config }: { config: CatConfig }) => {
    receivedHellCatConfigs.push(config);
    return <svg data-testid="hellcat-mock" id="hell-cat-svg" />;
  },
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
    fetchCatGeneratorConfig: jest.fn().mockResolvedValue({
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
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("cat-generator page gating", () => {
  afterEach(() => {
    useUserDbDataMock.mockReset();
    receivedHellCatConfigs.length = 0;
    replaceMock.mockReset();
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

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/thank-you");
    });
  });

  it("allows allowlisted user even if rollout is paused", async () => {
    const { useCatGeneratorConfigQuery } = jest.requireMock(
      "../../hooks/useCatGeneratorConfigQuery"
    );

    useUserDbDataMock.mockImplementation(() => ({
      data: { data: { responseStreak: 0 } },
    }));

    useCatGeneratorConfigQuery.mockReturnValue({
      data: {
        accessStreak: 999,
        customizeStreak: 999,
        exportStreak: 999,
        rareTraitsStreak: 999,
        rolloutPaused: true,
        allowlist: ["user@example.com"],
      },
      isLoading: false,
      isError: false,
    });

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByText(/מחולל החתולים/i)).toBeInTheDocument()
    );

    expect(replaceMock).not.toHaveBeenCalled();
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

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument()
    );

    const changeSelect = async (label: string, optionText: string | RegExp) => {
      const labelNode = screen.getByText(label);
      const trigger = within(labelNode.parentElement as HTMLElement).getByRole(
        "combobox"
      );
      await userEvent.click(trigger);
      const option = await screen.findByRole("option", { name: optionText });
      await userEvent.click(option);
    };

    const sliderByLabel = (labelSubstring: string) => {
      const labelNode = screen.getByText((content) =>
        content.includes(labelSubstring)
      );
      const slider = within(labelNode.parentElement as HTMLElement).getByRole(
        "slider"
      );
      return slider;
    };

    await changeSelect("Horn Style", "⚔️ Straight Horns");
    await changeSelect("Expression", "😸 Playful");
    await changeSelect("Eye Color", "🩸 Blood Red");
    await changeSelect("Pose", "🚶 Standing");
    await changeSelect("Color Scheme", "🔥 Fire Lord");
    await changeSelect("Body Markings", "🔥 Flame Patterns");

    await userEvent.click(screen.getByLabelText(/crown/i));

    const changeRange = async (label: string, steps: number) => {
      const slider = sliderByLabel(label);
      slider.focus();
      const key = steps >= 0 ? "ArrowRight" : "ArrowLeft";
      for (let i = 0; i < Math.abs(steps); i++) {
        fireEvent.keyDown(slider, { key });
      }
    };

    await changeRange("Eye Glow", 5);
    await changeRange("Horn Size", 5);
    await changeRange("Tail Length", -5);
    await changeRange("Body Size", 5);

    await waitFor(() => {
      const lastConfig =
        receivedHellCatConfigs[receivedHellCatConfigs.length - 1];
      expect(lastConfig).toBeDefined();
      expect(lastConfig).toMatchObject({
        hornStyle: "straight",
        expression: "playful",
        eyeColor: "blood",
        pose: "standing",
        colorScheme: "fire",
        markings: "flames",
      });
      expect(lastConfig!.accessories).toEqual(
        expect.arrayContaining(["collar", "crown"])
      );
      expect(lastConfig!.eyeGlow).not.toBeNull();
      expect(lastConfig!.hornSize).not.toBeNull();
      expect(lastConfig!.tailLength).not.toBeNull();
      expect(lastConfig!.bodySize).not.toBeNull();
    });
  });
});
