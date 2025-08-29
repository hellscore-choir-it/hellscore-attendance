import { clamp, size, times } from "lodash";
import {
  accessories,
  colorSchemes,
  expressions,
  eyeColors,
  flameIntensities,
  hornStyles,
  markings,
  poses,
  type CatConfig,
} from "./types";

const max32Bit = 0xffffffff;

export function hashSeed(str: string) {
  let hash = 0;
  times(size(str), (i) => {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char; // A common bitwise operation for hashing
    hash |= 0; // Ensures the result is a 32-bit integer (converts to signed 32-bit)
  });
  return hash / max32Bit;
}

export const generateRandomCat = (numberForGeneration: number): CatConfig => {
  numberForGeneration = clamp(numberForGeneration, 0, 1);
  return {
    hornStyle: hornStyles[Math.floor(numberForGeneration * hornStyles.length)]!,
    eyeColor: eyeColors[Math.floor(numberForGeneration * eyeColors.length)]!,
    flameIntensity:
      flameIntensities[
        Math.floor(numberForGeneration * flameIntensities.length)
      ]!,
    pose: poses[Math.floor(numberForGeneration * poses.length)]!,
    accessories:
      numberForGeneration > 3 / 4
        ? accessories.slice(0, 2)
        : numberForGeneration > 2 / 4
        ? accessories.slice(0, 1)
        : numberForGeneration > 1 / 4
        ? accessories.slice(1)
        : [],
    colorScheme:
      colorSchemes[Math.floor(numberForGeneration * colorSchemes.length)]!,
    eyeGlow: Math.floor(numberForGeneration * 101),
    hornSize: Math.floor(numberForGeneration * 101),
    tailLength: Math.floor(numberForGeneration * 101),
    bodySize: Math.floor(numberForGeneration * 50) + 25, // 25-75 for reasonable sizes
    flameHeight: Math.floor(numberForGeneration * 101),
    wickedness: Math.floor(numberForGeneration * 101),
    markings: markings[Math.floor(numberForGeneration * markings.length)]!,
    expression:
      expressions[Math.floor(numberForGeneration * expressions.length)]!,
  };
};
