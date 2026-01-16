import { keys } from "lodash";

export const colorSchemeDetails = {
  classic: {
    body: "#2d1b1b",
    accent: "#8b0000",
    eyes: "#ff4500",
    title: "🎭 גיהנום קלאסי",
  },
  fire: {
    body: "#3d0000",
    accent: "#ff6600",
    eyes: "#ffff00",
    title: "🔥 אדון האש",
  },
  shadow: {
    body: "#1a1a1a",
    accent: "#4d0000",
    eyes: "#ff0000",
    title: "🌑 שד הצללים",
  },
  ember: {
    body: "#331100",
    accent: "#cc3300",
    eyes: "#ff9900",
    title: "✨ רוח הגחלים",
  },
  frost: {
    body: "#e0f7fa",
    accent: "#003ca4",
    eyes: "#41a4ba",
    title: "❄️ שומר הקרח",
  },
  forest: {
    body: "#2e7d32",
    accent: "#381e3c",
    eyes: "#41a4ba",
    title: "🌲 מגן היער",
  },
  dusk: {
    body: "#4b3f72",
    accent: "#b39ddb",
    eyes: "#ffb300",
    title: "🌆 צייד הדמדומים",
  },
  storm: {
    body: "#37474f",
    accent: "#90a4ae",
    eyes: "#00e5ff",
    title: "⛈️ מביא הסערה",
  },
  gold: {
    body: "#ffd700",
    accent: "#ffa500",
    eyes: "#fff8dc",
    title: "🏆 אלוף הזהב",
  },
  sapphire: {
    body: "#0d47a1",
    accent: "#3996e2",
    eyes: "#ffe744",
    title: "💎 שומר הספיר",
  },
  lunar: {
    body: "#f5f3ce",
    accent: "#9d972b",
    eyes: "#b39ddb",
    title: "🌙 שומר הירח",
  },
  abyss: {
    body: "#0a0a23",
    accent: "#1a1a40",
    eyes: "#00ffcc",
    title: "🌌 רפא מהתהום",
  },
} as const;

// "Rare traits" currently map to a subset of color palettes.
// (Gated by `rareTraitsStreak` via `eligibility.canUseRareTraits`.)
export const rareColorSchemes = ["gold", "sapphire", "lunar", "abyss"] as const;

export const accessories = ["collar", "crown"] as const;

export interface CatConfig {
  hornStyle: "curved" | "straight" | "twisted" | "none";
  eyeColor: "fire" | "ember" | "glow" | "blood";
  flameIntensity: "low" | "medium" | "high";
  pose: "sitting" | "standing" | "crouching";
  accessories: Array<(typeof accessories)[number]>;
  colorScheme: keyof typeof colorSchemeDetails;
  // New granular controls
  eyeGlow: number; // 0-100
  hornSize: number; // 0-100
  tailLength: number; // 0-100
  bodySize: number; // 0-100
  flameHeight: number; // 0-100
  wickedness: number; // 0-100 (affects expressions)
  markings: "none" | "stripes" | "spots" | "flames";
  expression: "neutral" | "menacing" | "playful" | "sleepy";
}

export const hornStyles: Array<CatConfig["hornStyle"]> = [
  "curved",
  "straight",
  "twisted",
  "none",
];
export const eyeColors: Array<CatConfig["eyeColor"]> = [
  "fire",
  "ember",
  "glow",
  "blood",
];
export const flameIntensities: Array<CatConfig["flameIntensity"]> = [
  "low",
  "medium",
  "high",
];
export const poses: Array<CatConfig["pose"]> = [
  "sitting",
  "standing",
  "crouching",
];
export const colorSchemes: Array<CatConfig["colorScheme"]> = keys(
  colorSchemeDetails
) as Array<CatConfig["colorScheme"]>;

export const markings: Array<CatConfig["markings"]> = [
  "none",
  "stripes",
  "spots",
  "flames",
];
export const expressions: Array<CatConfig["expression"]> = [
  "neutral",
  "menacing",
  "playful",
  "sleepy",
];

export interface CatFeatures {
  body: {
    fill: string;
    stroke: string;
  };
  eyes: {
    color: string;
    glow: boolean;
  };
  horns: {
    style: string;
    color: string;
  };
  flames: {
    intensity: number;
    colors: string[];
  };
}
