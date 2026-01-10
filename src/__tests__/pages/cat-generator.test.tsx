/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CatGeneratorPage from "../../pages/cat-generator";
import { type CatConfig } from "../../components/CatGenerator/types";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom lacks ResizeObserver
global.ResizeObserver = ResizeObserverMock;

// Radix Select expects pointer capture APIs in the environment
if (!Element.prototype.hasPointerCapture) {
  // @ts-expect-error test env shim
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  // @ts-expect-error test env shim
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  // @ts-expect-error test env shim
  Element.prototype.scrollIntoView = () => {};
}

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

jest.mock("../../components/ui/slider", () => ({
  Slider: ({ value, onValueChange, "data-testid": testId }: any) => (
    <input
      data-testid={testId}
      type="range"
      min={0}
      max={100}
      value={value?.[0] ?? 0}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onValueChange([Number(e.target.value)])
      }
    />
  ),
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
    receivedHellCatConfigs.length = 0;
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

    render(<CatGeneratorPage />, { wrapper });

    await waitFor(() => expect(screen.getByTestId("hellcat-mock")).toBeInTheDocument());

    const changeSelect = async (label: string, optionText: string | RegExp) => {
      const labelNode = screen.getByText(label);
      const trigger = within(labelNode.parentElement as HTMLElement).getByRole("combobox");
      await userEvent.click(trigger);
      const option = await screen.findByRole("option", { name: optionText });
      await userEvent.click(option);
    };

    const sliderByLabel = (labelSubstring: string) => {
      const labelNode = screen.getByText((content) => content.includes(labelSubstring));
      const input = labelNode.parentElement?.querySelector(
        'input[type="range"]'
      ) as HTMLInputElement;
      expect(input).toBeTruthy();
      return input;
    };

    await changeSelect("Horn Style", "⚔️ Straight Horns");
    await changeSelect("Expression", "😸 Playful");
    await changeSelect("Eye Color", "🩸 Blood Red");
    await changeSelect("Pose", "🚶 Standing");
    await changeSelect("Color Scheme", "🔥 Fire Lord");
    await changeSelect("Body Markings", "🔥 Flame Patterns");

    await userEvent.click(screen.getByLabelText(/crown/i));

    const changeRange = async (label: string, value: number) => {
      const input = sliderByLabel(label);
      fireEvent.change(input, { target: { value } });
    };

    await changeRange("Eye Glow", 10);
    await changeRange("Horn Size", 80);
    await changeRange("Tail Length", 20);
    await changeRange("Body Size", 65);

    await waitFor(() => {
      const lastConfig = receivedHellCatConfigs[receivedHellCatConfigs.length - 1];
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
      expect(lastConfig!.eyeGlow).toBe(10);
      expect(lastConfig!.hornSize).toBe(80);
      expect(lastConfig!.tailLength).toBe(20);
      expect(lastConfig!.bodySize).toBe(65);
    });
  });
});
