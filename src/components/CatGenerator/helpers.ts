import { size, slice } from "lodash";
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

/**
 * Creates a 53-bit hash from a string.
 * This is used to create a seed for the pseudo-random number generator.
 * From: https://github.com/bryc/code/blob/master/jshash/cyrb53.js
 * @param str The string to hash.
 * @param seed An optional seed to start with.
 * @returns A 53-bit number.
 */
const cyrb53 = (str: string, seed = 0): number => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < size(str); i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Creates a mulberry32 pseudo-random number generator.
 * From: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 * @param a The seed for the generator (a 32-bit integer).
 * @returns A function that returns a pseudo-random float between 0 and 1.
 */
const mulberry32 = (a: number): (() => number) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Generates a deterministic, pseudo-random cat configuration based on a seed string.
 * @param seedString A string (like a user's email) to seed the generator.
 * @returns A CatConfig object.
 */
export const generateRandomCat = (seedString: string): CatConfig => {
  // 1. Create a high-quality seed from the input string.
  const seed = cyrb53(seedString);

  // 2. Initialize the pseudo-random number generator (PRNG) with the seed.
  const rand = mulberry32(seed);

  // 3. Define helper functions that use our seeded PRNG to get random values.
  const getRandomItem = <T>(arr: readonly T[]): T => {
    return arr[Math.floor(rand() * size(arr))]!;
  };

  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(rand() * (max - min + 1)) + min;
  };

  const getAccessories = () => {
    const num = rand();
    if (num < 0.25) {
      // 25% chance of no accessories
      return [];
    } else if (num < 0.75) {
      // 50% chance of one random accessory
      return [getRandomItem(accessories)];
    } else {
      // 25% chance of two random accessories
      // To avoid picking the same one twice, we shuffle a copy and pick the first two.
      const shuffled = [...accessories].sort(() => 0.5 - rand());
      return slice(shuffled, 0, 2);
    }
  };

  // 4. Generate the cat configuration using the seeded random functions.
  return {
    hornStyle: getRandomItem(hornStyles),
    eyeColor: getRandomItem(eyeColors),
    flameIntensity: getRandomItem(flameIntensities),
    pose: getRandomItem(poses),
    accessories: getAccessories(),
    colorScheme: getRandomItem(colorSchemes),
    eyeGlow: getRandomInt(0, 100),
    hornSize: getRandomInt(0, 100),
    tailLength: getRandomInt(0, 100),
    bodySize: getRandomInt(25, 75), // 25-75 for reasonable sizes
    flameHeight: getRandomInt(0, 100),
    wickedness: getRandomInt(0, 100),
    markings: getRandomItem(markings),
    expression: getRandomItem(expressions),
  };
};
