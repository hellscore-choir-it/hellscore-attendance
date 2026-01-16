import { captureException } from "@sentry/nextjs";
import { isArray, isNil, map, some } from "lodash";

export interface CatGeneratorConfig {
  rolloutPaused: boolean;
  accessStreak: number;
  customizeStreak: number;
  exportStreak: number;
  rareTraitsStreak: number;
  allowlist: string[];
  updated_at?: string;
}

export const DEFAULT_CAT_GENERATOR_CONFIG: CatGeneratorConfig = {
  rolloutPaused: false,
  accessStreak: 2,
  customizeStreak: 4,
  exportStreak: 5,
  rareTraitsStreak: 7,
  allowlist: ["vehpus@gmail.com", "hellscorechoir.it@gmail.com"],
};

const CONFIG_TABLE_NAME = "cat_generator_config";

const sanitizeThreshold = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return fallback;
};

const sanitizeAllowlist = (value: unknown) => {
  if (!isArray(value)) {
    return [];
  }
  return map(value, (email) =>
    typeof email === "string" ? email.trim() : ""
  ).filter((email) => email.length > 0);
};

export const normalizeCatGeneratorConfig = (
  config: Partial<CatGeneratorConfig> | null | undefined
): CatGeneratorConfig => {
  const base = DEFAULT_CAT_GENERATOR_CONFIG;

  return {
    rolloutPaused: Boolean(config?.rolloutPaused),
    accessStreak: sanitizeThreshold(config?.accessStreak, base.accessStreak),
    customizeStreak: sanitizeThreshold(
      config?.customizeStreak,
      base.customizeStreak
    ),
    exportStreak: sanitizeThreshold(config?.exportStreak, base.exportStreak),
    rareTraitsStreak: sanitizeThreshold(
      config?.rareTraitsStreak,
      base.rareTraitsStreak
    ),
    allowlist: sanitizeAllowlist(config?.allowlist).length
      ? sanitizeAllowlist(config?.allowlist)
      : base.allowlist,
    updated_at: config?.updated_at,
  };
};

const loadSupabaseBrowserClient = async () => {
  const { createClient } = await import("../../utils/supabase/client");
  return createClient();
};

export const fetchCatGeneratorConfig = async (
  signal?: AbortSignal
): Promise<CatGeneratorConfig> => {
  try {
    const supabase = await loadSupabaseBrowserClient();
    const baseQuery = supabase.from(CONFIG_TABLE_NAME).select("*").limit(1);
    const query = signal ? baseQuery.abortSignal(signal) : baseQuery;
    const { data, error } = await query.maybeSingle<CatGeneratorConfig>();

    if (error) {
      captureException(error, { extra: { source: "catGeneratorConfig" } });
      return DEFAULT_CAT_GENERATOR_CONFIG;
    }

    return normalizeCatGeneratorConfig(data);
  } catch (error) {
    captureException(error, { extra: { source: "catGeneratorConfig" } });
    return DEFAULT_CAT_GENERATOR_CONFIG;
  }
};

const normalizeStreak = (streak?: number | null) => {
  if (typeof streak === "number" && Number.isFinite(streak) && streak >= 0) {
    return streak;
  }
  return null;
};

const isAllowlisted = (allowlist: string[], userEmail?: string) => {
  if (!userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();
  return some(allowlist, (allowed) => allowed.toLowerCase() === normalized);
};

export const computeCatGeneratorEligibility = ({
  streak,
  userEmail,
  config,
}: {
  streak?: number | null;
  userEmail?: string | null;
  config?: Partial<CatGeneratorConfig> | null;
}) => {
  const normalizedConfig = normalizeCatGeneratorConfig(config);
  const normalizedStreak = normalizeStreak(streak);
  const allowlistMatch = isAllowlisted(
    normalizedConfig.allowlist,
    userEmail ?? undefined
  );

  const isRolloutPaused = normalizedConfig.rolloutPaused;

  const meets = (threshold: number) =>
    allowlistMatch ||
    (!isRolloutPaused &&
      !isNil(normalizedStreak) &&
      normalizedStreak >= threshold);

  return {
    streak: normalizedStreak,
    config: normalizedConfig,
    isAllowlisted: allowlistMatch,
    isDisabledByKillSwitch: isRolloutPaused && !allowlistMatch,
    canAccess: meets(normalizedConfig.accessStreak),
    canCustomize: meets(normalizedConfig.customizeStreak),
    canExport: meets(normalizedConfig.exportStreak),
    canUseRareTraits: meets(normalizedConfig.rareTraitsStreak),
  };
};
