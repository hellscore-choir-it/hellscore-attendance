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
      <div
        data-testid="hellcat-mock"
        data-config={JSON.stringify(config)}
        id="hell-cat-svg"
      />
    );
  },
}));

jest.mock("../../components/CatGenerator", () => {
  const React = require("react");
  const { accessories } = require("../../components/CatGenerator/types");
  const allSchemes = require("../../components/CatGenerator/types").colorSchemes;

  const Select = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
  }) => (
    <label>
      {label}
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value)
        }
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );

  const Slider = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <label>
      {label}
      <input
        data-testid={`slider-${label}`}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.target.value))
        }
      />
    </label>
  );

  return {
    CatGenerator: ({
      config,
      onChange,
    }: {
      config: CatConfig;
      onChange: (c: CatConfig) => void;
    }) => (
      <div data-testid="cat-generator-mock">
        <Select
          label="hornStyle"
          value={config.hornStyle}
          options={["curved", "straight", "twisted", "none"]}
          onChange={(v) => onChange({ ...config, hornStyle: v as any })}
        />
        <Select
          label="expression"
          value={config.expression}
          options={["neutral", "menacing", "playful", "sleepy"]}
          onChange={(v) => onChange({ ...config, expression: v as any })}
        />
        <Select
          label="eyeColor"
          value={config.eyeColor}
          options={["fire", "ember", "glow", "blood"]}
          onChange={(v) => onChange({ ...config, eyeColor: v as any })}
        />
        <Select
          label="pose"
          value={config.pose}
          options={["sitting", "standing", "crouching"]}
          onChange={(v) => onChange({ ...config, pose: v as any })}
        />
        <Select
          label="colorScheme"
          value={config.colorScheme}
          options={allSchemes}
          onChange={(v) => onChange({ ...config, colorScheme: v as any })}
        />
        <Select
          label="markings"
          value={config.markings}
          options={["none", "stripes", "spots", "flames"]}
          onChange={(v) => onChange({ ...config, markings: v as any })}
        />
        <Select
          label="flameIntensity"
          value={config.flameIntensity}
          options={["low", "medium", "high"]}
          onChange={(v) => onChange({ ...config, flameIntensity: v as any })}
        />

        <Slider
          label="eyeGlow"
          value={config.eyeGlow}
          onChange={(v) => onChange({ ...config, eyeGlow: v })}
        />
        <Slider
          label="hornSize"
          value={config.hornSize}
          onChange={(v) => onChange({ ...config, hornSize: v })}
        />
        <Slider
          label="tailLength"
          value={config.tailLength}
          onChange={(v) => onChange({ ...config, tailLength: v })}
        />
        <Slider
          label="bodySize"
          value={config.bodySize}
          onChange={(v) => onChange({ ...config, bodySize: v })}
        />
        <Slider
          label="flameHeight"
          value={config.flameHeight}
          onChange={(v) => onChange({ ...config, flameHeight: v })}
        />
        <Slider
          label="wickedness"
          value={config.wickedness}
          onChange={(v) => onChange({ ...config, wickedness: v })}
        />

        <div>
          {accessories.map((acc) => (
            <label key={acc}>
              <input
                data-testid={`checkbox-${acc}`}
                type="checkbox"
                checked={config.accessories.includes(acc)}
                onChange={() =>
                  onChange({
                    ...config,
                    accessories: config.accessories.includes(acc)
                      ? config.accessories.filter((a) => a !== acc)
                      : [...config.accessories, acc],
                  })
                }
              />
              {acc}
            </label>
          ))}
        </div>
      </div>
    ),
  };
});

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

    await waitFor(() =>
      expect(screen.getByTestId("cat-generator-mock")).toBeInTheDocument()
    );

    userEvent.selectOptions(screen.getByTestId("select-hornStyle"), "straight");
    userEvent.selectOptions(screen.getByTestId("select-expression"), "playful");
    userEvent.selectOptions(screen.getByTestId("select-eyeColor"), "blood");
    userEvent.selectOptions(screen.getByTestId("select-pose"), "standing");
    userEvent.selectOptions(
      screen.getByTestId("select-colorScheme"),
      colorSchemes[1]
    );
    userEvent.selectOptions(screen.getByTestId("select-markings"), "flames");
    userEvent.selectOptions(
      screen.getByTestId("select-flameIntensity"),
      "high"
    );

    userEvent.click(screen.getByTestId("checkbox-collar"));
    userEvent.click(screen.getByTestId("checkbox-crown"));

    const changeRange = (testId: string, value: number) => {
      const input = screen.getByTestId(testId) as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    changeRange("slider-eyeGlow", 10);
    changeRange("slider-hornSize", 80);
    changeRange("slider-tailLength", 20);
    changeRange("slider-bodySize", 65);
    changeRange("slider-flameHeight", 90);
    changeRange("slider-wickedness", 5);

    const lastConfig = receivedHellCatConfigs[receivedHellCatConfigs.length - 1];
    expect(lastConfig).toMatchObject({
      hornStyle: "straight",
      expression: "playful",
      eyeColor: "blood",
      pose: "standing",
      colorScheme: colorSchemes[1],
      markings: "flames",
      flameIntensity: "high",
      accessories: expect.arrayContaining(["collar", "crown"]),
    });
    expect(lastConfig.eyeGlow).toBe(10);
    expect(lastConfig.hornSize).toBe(80);
    expect(lastConfig.tailLength).toBe(20);
    expect(lastConfig.bodySize).toBe(65);
    expect(lastConfig.flameHeight).toBe(90);
    expect(lastConfig.wickedness).toBe(5);
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
    expect(summarizeSvg(container)).toEqual(
      expect.objectContaining({
        circleCount: 4,
        ellipseCount: 12,
        hasHorns: true,
        pathCount: 18,
        viewBox: "0 0 400 320",
      })
    );
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
    expect(summarizeSvg(container)).toEqual(
      expect.objectContaining({
        circleCount: 5,
        ellipseCount: 12,
        hasHorns: true,
        pathCount: 21,
        viewBox: "0 0 400 320",
      })
    );
  });

  it("matches snapshot for hash-based cat", () => {
    const seeded = generateRandomCat("user@example.com");
    const { container } = render(<RealHellCat config={seeded} />);
    expect(summarizeSvg(container)).toEqual(
      expect.objectContaining({
        circleCount: 4,
        ellipseCount: 12,
        hasHorns: true,
        pathCount: 18,
        viewBox: "0 0 400 320",
      })
    );
  });
});
