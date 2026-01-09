import {
  DEFAULT_CAT_GENERATOR_CONFIG,
  computeCatGeneratorEligibility,
  normalizeCatGeneratorConfig,
} from "../../server/db/catGeneratorConfig";

describe("normalizeCatGeneratorConfig", () => {
  it("falls back to defaults when fields are missing or invalid", () => {
    const result = normalizeCatGeneratorConfig({
      accessStreak: -1,
      allowlist: [],
      killSwitch: false,
    });

    expect(result).toMatchObject({
      accessStreak: DEFAULT_CAT_GENERATOR_CONFIG.accessStreak,
      customizeStreak: DEFAULT_CAT_GENERATOR_CONFIG.customizeStreak,
      exportStreak: DEFAULT_CAT_GENERATOR_CONFIG.exportStreak,
      rareTraitsStreak: DEFAULT_CAT_GENERATOR_CONFIG.rareTraitsStreak,
      rolloutPaused: false,
      allowlist: DEFAULT_CAT_GENERATOR_CONFIG.allowlist,
    });
  });

  it("keeps provided allowlist and thresholds when valid", () => {
    const result = normalizeCatGeneratorConfig({
      accessStreak: 3,
      customizeStreak: 6,
      exportStreak: 7,
      rareTraitsStreak: 8,
      allowlist: ["a@example.com", "B@example.com"],
      rolloutPaused: true,
    });

    expect(result).toMatchObject({
      accessStreak: 3,
      customizeStreak: 6,
      exportStreak: 7,
      rareTraitsStreak: 8,
      allowlist: ["a@example.com", "B@example.com"],
      rolloutPaused: true,
    });
  });
});

describe("computeCatGeneratorEligibility", () => {
  it("returns false when rollout is paused", () => {
    const eligibility = computeCatGeneratorEligibility({
      streak: 10,
      userEmail: "someone@example.com",
      config: { ...DEFAULT_CAT_GENERATOR_CONFIG, rolloutPaused: true },
    });

    expect(eligibility.isDisabledByKillSwitch).toBe(true);
    expect(eligibility.canAccess).toBe(false);
    expect(eligibility.canCustomize).toBe(false);
    expect(eligibility.canExport).toBe(false);
    expect(eligibility.canUseRareTraits).toBe(false);
  });

  it("allows allowlisted users regardless of streak", () => {
    const eligibility = computeCatGeneratorEligibility({
      streak: null,
      userEmail: "vehpus@gmail.com",
      config: DEFAULT_CAT_GENERATOR_CONFIG,
    });

    expect(eligibility.isAllowlisted).toBe(true);
    expect(eligibility.canAccess).toBe(true);
    expect(eligibility.canCustomize).toBe(true);
    expect(eligibility.canExport).toBe(true);
    expect(eligibility.canUseRareTraits).toBe(true);
  });

  it("unlocks phases according to streak thresholds", () => {
    const eligibility = computeCatGeneratorEligibility({
      streak: 4,
      userEmail: "other@example.com",
      config: DEFAULT_CAT_GENERATOR_CONFIG,
    });

    expect(eligibility.canAccess).toBe(true); // >=2
    expect(eligibility.canCustomize).toBe(true); // >=4
    expect(eligibility.canExport).toBe(false); // needs 5
    expect(eligibility.canUseRareTraits).toBe(false); // needs 7
  });

  it("handles null streak safely", () => {
    const eligibility = computeCatGeneratorEligibility({
      streak: null,
      userEmail: "other@example.com",
      config: DEFAULT_CAT_GENERATOR_CONFIG,
    });

    expect(eligibility.streak).toBeNull();
    expect(eligibility.canAccess).toBe(false);
  });
});
