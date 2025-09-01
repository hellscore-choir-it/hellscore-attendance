import { castArray, clamp, map, size, times } from "lodash";
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

export const generateRandomCat = (
  numberForGeneration: number | number[]
): CatConfig => {
  const hashesForGeneration = map(castArray(numberForGeneration), (num) =>
    clamp(num, 0, 1)
  );
  // Create a generator function that returns numbers in a loop from hashesForGeneration
  const getNextHash = function* () {
    let currentIndex = 0;
    while (true) {
      yield hashesForGeneration[currentIndex] || 0;
      currentIndex = (currentIndex + 1) % size(hashesForGeneration);
    }
  };
  const hashGenerator = getNextHash();
  return {
    hornStyle:
      hornStyles[Math.floor(hashGenerator.next().value * size(hornStyles))]!,
    eyeColor:
      eyeColors[Math.floor(hashGenerator.next().value * size(eyeColors))]!,
    flameIntensity:
      flameIntensities[
        Math.floor(hashGenerator.next().value * size(flameIntensities))
      ]!,
    pose: poses[Math.floor(hashGenerator.next().value * size(poses))]!,
    accessories:
      hashGenerator.next().value > 3 / 4
        ? accessories.slice(0, 2)
        : hashGenerator.next().value > 2 / 4
        ? accessories.slice(0, 1)
        : hashGenerator.next().value > 1 / 4
        ? accessories.slice(1)
        : [],
    colorScheme:
      colorSchemes[
        Math.floor(hashGenerator.next().value * size(colorSchemes))
      ]!,
    eyeGlow: Math.floor(hashGenerator.next().value * 101),
    hornSize: Math.floor(hashGenerator.next().value * 101),
    tailLength: Math.floor(hashGenerator.next().value * 101),
    bodySize: Math.floor(hashGenerator.next().value * 50) + 25, // 25-75 for reasonable sizes
    flameHeight: Math.floor(hashGenerator.next().value * 101),
    wickedness: Math.floor(hashGenerator.next().value * 101),
    markings:
      markings[Math.floor(hashGenerator.next().value * size(markings))]!,
    expression:
      expressions[Math.floor(hashGenerator.next().value * size(expressions))]!,
  };
};
