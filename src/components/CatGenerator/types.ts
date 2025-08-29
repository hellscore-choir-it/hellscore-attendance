export interface CatConfig {
  hornStyle: "curved" | "straight" | "twisted" | "none";
  eyeColor: "fire" | "ember" | "glow" | "blood";
  flameIntensity: "low" | "medium" | "high";
  pose: "sitting" | "standing" | "crouching";
  accessories: string[];
  colorScheme: "classic" | "fire" | "shadow" | "ember";
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
export const colorSchemes: Array<CatConfig["colorScheme"]> = [
  "classic",
  "fire",
  "shadow",
  "ember",
];
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
