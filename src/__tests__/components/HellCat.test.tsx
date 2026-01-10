/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";

import { HellCat } from "../../components/CatGenerator/HellCat";
import { generateRandomCat } from "../../components/CatGenerator/helpers";
import { type CatConfig } from "../../components/CatGenerator/types";

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

describe("HellCat snapshots", () => {
  it("matches base cat", () => {
    const { asFragment } = render(<HellCat config={baseConfig} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches accessories/markings variant", () => {
    const { asFragment } = render(
      <HellCat
        config={{
          ...baseConfig,
          accessories: ["collar", "crown"],
          markings: "flames",
          colorScheme: "fire",
          expression: "menacing",
        }}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches hash-based generated cat", () => {
    const seeded = generateRandomCat("user@example.com");
    const { asFragment } = render(<HellCat config={seeded} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
