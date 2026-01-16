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

/**
 * Rollout "phases" (per BRANCH_TODO) are just streak-threshold feature gates:
 * - Access phase:      streak >= accessStreak      => user can access the page
 * - Customize phase:   streak >= customizeStreak   => customization controls are interactive
 * - Export phase:      streak >= exportStreak      => SVG export is enabled
 * - Rare traits phase: streak >= rareTraitsStreak  => rare traits are enabled
 */

const getMockRouter = () =>
  (jest.requireMock("next/router") as any).__mockRouter;

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
  useUserDbData: (..._args: any[]) => useUserDbDataMock(),
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
    const router = getMockRouter();
    router.replace.mockReset();
    router.push.mockReset();
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
      expect(getMockRouter().replace).toHaveBeenCalledWith("/thank-you");
    });
  });

  it("allows allowlisted user even if rollout is paused", async () => {
    const { useCatGeneratorConfigQuery } = jest.requireMock(
      "../../hooks/useCatGeneratorConfigQuery"
    );

    useUserDbDataMock.mockImplementation(() => ({
      data: { data: { responseStreak: 0 } },
    }));

    useCatGeneratorConfigQuery.mockReturnValueOnce({
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

    expect(getMockRouter().replace).not.toHaveBeenCalled();
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

  it("locks customization controls until customize threshold is met", async () => {
    // accessStreak=2, customizeStreak=3 (from mocked config). Streak=2 can access, cannot customize.
    useUserDbDataMock.mockImplementation(() => ({
      data: { data: { responseStreak: 2 } },
    }));

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByText(/מחולל החתולים/i)).toBeInTheDocument()
    );

    expect(
      screen.getByText((content) =>
        content.includes("התאמה אישית נפתחת ברצף של")
      )
    ).toBeInTheDocument();

    const labelNode = screen.getByText("סגנון קרניים");
    const trigger = within(labelNode.parentElement as HTMLElement).getByRole(
      "combobox"
    );

    // Locked controls are rendered non-interactive via inline pointer-events.
    await expect(userEvent.click(trigger)).rejects.toThrow();
  });

  it("renders and updates controls when interacting", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      // customizeStreak=3 (from mocked config). Use the boundary to prove
      // the Customize phase unlock (streak >= customizeStreak).
      data: { data: { responseStreak: 3 } },
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

    await changeSelect("סגנון קרניים", "⚔️ קרניים ישרות");
    await changeSelect("הבעה", "😸 שובב");
    await changeSelect("צבע עיניים", "🩸 אדום דם");
    await changeSelect("תנוחה", "🚶 עומד");
    await changeSelect("ערכת צבעים", "🔥 אדון האש");
    await changeSelect("סימני גוף", "🔥 דפוסי להבה");

    await userEvent.click(screen.getByLabelText(/כתר/i));

    const changeRange = async (label: string, steps: number) => {
      const slider = sliderByLabel(label);
      slider.focus();
      // In RTL (this page renders with dir="rtl"), Radix Slider is inverted so
      // values increase right-to-left. That means ArrowLeft increases.
      const key = steps >= 0 ? "ArrowLeft" : "ArrowRight";
      for (let i = 0; i < Math.abs(steps); i++) {
        fireEvent.keyDown(slider, { key });
      }
    };

    await changeRange("עוצמת זוהר עיניים", 5);
    await changeRange("גודל קרניים", 5);
    await changeRange("אורך זנב", -5);
    await changeRange("גודל גוף", 5);

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

  it("disables SVG export until export threshold is met", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      // customizeStreak=3, exportStreak=5 (from mocked config).
      data: { data: { responseStreak: 3 } },
    }));

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument()
    );

    const exportButton = screen.getByRole("button", { name: /ייצוא SVG/i });
    expect(exportButton).toBeDisabled();
  });

  it("exports SVG when export threshold is met", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      // exportStreak=5 (from mocked config). Use the boundary for Phase C.
      data: { data: { responseStreak: 5 } },
    }));

    const originalCreateObjectURL = (URL as any).createObjectURL;
    const originalRevokeObjectURL = (URL as any).revokeObjectURL;

    const createObjectURLMock = jest.fn(() => "blob:mock");
    const revokeObjectURLMock = jest.fn();
    (URL as any).createObjectURL = createObjectURLMock;
    (URL as any).revokeObjectURL = revokeObjectURLMock;

    const anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      render(<CatGeneratorPage />, { wrapper });

      await waitFor(() =>
        expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument()
      );

      const exportButton = screen.getByRole("button", { name: /ייצוא SVG/i });
      expect(exportButton).not.toBeDisabled();

      await userEvent.click(exportButton);

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock");
    } finally {
      anchorClickSpy.mockRestore();
      (URL as any).createObjectURL = originalCreateObjectURL;
      (URL as any).revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it("hides rare palettes until rare traits threshold is met", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      // rareTraitsStreak=10 (from mocked config). Use 9 to prove locked.
      data: { data: { responseStreak: 9 } },
    }));

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument()
    );

    const labelNode = screen.getByText("ערכת צבעים");
    const trigger = within(labelNode.parentElement as HTMLElement).getByRole(
      "combobox"
    );
    await userEvent.click(trigger);

    expect(
      screen.queryByRole("option", { name: /אלוף הזהב/i })
    ).not.toBeInTheDocument();
  });

  it("allows selecting rare palettes when rare traits threshold is met", async () => {
    useUserDbDataMock.mockImplementation(() => ({
      // rareTraitsStreak=10 (from mocked config). Use the boundary for Phase D.
      data: { data: { responseStreak: 10 } },
    }));

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument()
    );

    const labelNode = screen.getByText("ערכת צבעים");
    const trigger = within(labelNode.parentElement as HTMLElement).getByRole(
      "combobox"
    );
    await userEvent.click(trigger);

    const option = await screen.findByRole("option", {
      name: /אלוף הזהב/i,
    });
    await userEvent.click(option);

    await waitFor(() => {
      const lastConfig =
        receivedHellCatConfigs[receivedHellCatConfigs.length - 1];
      expect(lastConfig).toBeDefined();
      expect(lastConfig).toMatchObject({ colorScheme: "gold" });
    });
  });
});
