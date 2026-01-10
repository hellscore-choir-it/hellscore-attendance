/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CatGeneratorPage from "../../pages/cat-generator";
import { generateRandomCat } from "../../components/CatGenerator/helpers";
import { type CatConfig, colorSchemes } from "../../components/CatGenerator/types";

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

const receivedHellCatConfigs: CatConfig[] = [];
jest.mock("../../components/CatGenerator/HellCat", () => ({
  HellCat: ({ config }: { config: CatConfig }) => {
    receivedHellCatConfigs.push(config);
    return (
      <svg
        data-testid="hellcat-mock"
        data-config={JSON.stringify(config)}
        id="hell-cat-svg"
      />
    );
  },
}));

jest.mock("../../components/ui/select", () => {
  const React = require("react");
  const SelectItem = ({ value, children }: any) => (
    <option value={value}>{children}</option>
  );
  SelectItem.displayName = "SelectItem";

  const SelectContent = ({ children }: any) => children;
  SelectContent.displayName = "SelectContent";

  const SelectTrigger = ({ children }: any) => children;
  SelectTrigger.displayName = "SelectTrigger";

  const SelectValue = () => null;
  SelectValue.displayName = "SelectValue";

  const Select = ({ value, onValueChange, children, "data-testid": testId }: any) => {
    const options: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child: any) => {
      if (child?.type?.displayName === "SelectContent") {
        React.Children.forEach(child.props.children, (item: any) => {
          if (item?.type?.displayName === "SelectItem") {
            options.push({ value: item.props.value, label: item.props.children });
          }
        });
      }
    });
    return (
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
  Select.displayName = "Select";

  return { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
});

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

    const selectByLabel = (label: string) => {
      const labelNode = screen.getByText(label);
      const select = labelNode.parentElement?.querySelector("select") as HTMLSelectElement;
      expect(select).toBeTruthy();
      return select;
    };

    const changeSelect = (label: string, value: string) =>
      userEvent.selectOptions(selectByLabel(label), value);

    const sliderByLabel = (labelSubstring: string) => {
      const labelNode = screen.getByText((content) => content.includes(labelSubstring));
      const input = labelNode.parentElement?.querySelector(
        'input[type="range"]'
      ) as HTMLInputElement;
      expect(input).toBeTruthy();
      return input;
    };

    changeSelect("Horn Style", "straight");
    changeSelect("Expression", "playful");
    changeSelect("Eye Color", "blood");
    changeSelect("Pose", "standing");
    changeSelect("Color Scheme", colorSchemes[1]);
    changeSelect("Body Markings", "flames");
    changeSelect("flameIntensity", "high");

    userEvent.click(screen.getByLabelText(/collar/i));
    userEvent.click(screen.getByLabelText(/crown/i));

    const changeRange = (label: string, value: number) => {
      const input = sliderByLabel(label);
      userEvent.clear(input);
      userEvent.type(input, String(value));
    };

    changeRange("Eye Glow", 10);
    changeRange("Horn Size", 80);
    changeRange("Tail Length", 20);
    changeRange("Body Size", 65);

    const lastConfig = receivedHellCatConfigs[receivedHellCatConfigs.length - 1];
    expect(lastConfig).toMatchObject({
      hornStyle: "straight",
      expression: "playful",
      eyeColor: "blood",
      pose: "standing",
      colorScheme: colorSchemes[1],
      markings: "flames",
      accessories: expect.arrayContaining(["collar", "crown"]),
    });
    expect(lastConfig.eyeGlow).toBe(10);
    expect(lastConfig.hornSize).toBe(80);
    expect(lastConfig.tailLength).toBe(20);
    expect(lastConfig.bodySize).toBe(65);
  });
});

describe("HellCat renderer snapshots", () => {
  const { HellCat: RealHellCat } = jest.requireActual(
    "../../components/CatGenerator/HellCat"
  );

  const summarizeSvg = (container: HTMLElement) => {
    const svg = container.querySelector("svg")!;
    const paths = svg.querySelectorAll("path");
    const ellipses = svg.querySelectorAll("ellipse");
    const circles = svg.querySelectorAll("circle");
    const firstPath = paths[0]?.getAttribute("d") ?? "";
    return {
      pathCount: paths.length,
      ellipseCount: ellipses.length,
      circleCount: circles.length,
      hasHorns: Array.from(paths).some((p) =>
        p.getAttribute("d")?.includes("horn")
      ),
      firstPathLength: firstPath.length,
      viewBox: svg.getAttribute("viewBox"),
    };
  };

  const baseConfig: CatConfig = {
    hornStyle: "curved",
    eyeColor: "fire",
    flameIntensity: "medium",
    pose: "sitting",
    accessories: ["collar"],
    colorScheme: "classic",
    eyeGlow: 50,
    hornSize: 60,
    tailLength: 70,
    bodySize: 50,
    flameHeight: 50,
    wickedness: 60,
    markings: "none",
    expression: "neutral",
  };

  it("matches snapshot for base cat", () => {
    const { container } = render(<RealHellCat config={baseConfig} />);
    expect(summarizeSvg(container)).toMatchInlineSnapshot(`
      Object {
        "circleCount": 4,
        "ellipseCount": 12,
        "firstPathLength": 5,
        "hasHorns": true,
        "pathCount": 18,
        "viewBox": "0 0 400 320",
      }
    `);
  });

  it("matches snapshot with accessories and markings", () => {
    const { container } = render(
      <RealHellCat
        config={{
          ...baseConfig,
          accessories: ["collar", "crown"],
          markings: "flames",
          colorScheme: "fire",
          expression: "menacing",
        }}
      />
    );
    expect(summarizeSvg(container)).toMatchInlineSnapshot(`
      Object {
        "circleCount": 5,
        "ellipseCount": 12,
        "firstPathLength": 5,
        "hasHorns": true,
        "pathCount": 21,
        "viewBox": "0 0 400 320",
      }
    `);
  });

  it("matches snapshot for hash-based cat", () => {
    const seeded = generateRandomCat("user@example.com");
    const { container } = render(<RealHellCat config={seeded} />);
    expect(summarizeSvg(container)).toMatchInlineSnapshot(`
      Object {
        "circleCount": 4,
        "ellipseCount": 12,
        "firstPathLength": 5,
        "hasHorns": true,
        "pathCount": 18,
        "viewBox": "0 0 400 320",
      }
    `);
  });
});
