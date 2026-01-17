import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";

import { startsWith } from "lodash";
import { createClient } from "../../utils/supabase/client";
import { generateSupabaseUserId, type SupabaseUser } from "./schema";

const isE2ETestMode = () => process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";

const getE2EStreakOverride = () => {
  if (!isE2ETestMode()) return null;
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("e2eStreak");
  if (!raw) return null;
  if (raw === "loading" || raw === "null") return "loading" as const;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const getUserDbData = async (userEmail: string, signal: AbortSignal) => {
  if (isE2ETestMode()) {
    const override = getE2EStreakOverride();
    if (override === "loading") {
      return null;
    }

    const responseStreak = override ?? 10;
    const now = new Date().toISOString();
    return {
      id: generateSupabaseUserId(userEmail || "e2e@example.com"),
      created_at: now,
      modified_at: now,
      data: {
        responses: {},
        responseStreak,
        maxStreak: responseStreak,
        streakUpdates: [],
        streakResetDate: null,
      },
    } satisfies SupabaseUser;
  }

  const supabase = createClient();

  const supabaseUserId = generateSupabaseUserId(userEmail);

  const { data: userEntry, error: userEntryError } = await supabase
    .from("user")
    .select("*")
    .eq("id", supabaseUserId)
    .abortSignal(signal)
    .maybeSingle<SupabaseUser>();

  if (userEntryError) {
    // Check the error is not a signal abort error, in which case we don't want to log it
    if (!startsWith(userEntryError.message, "AbortError")) {
      captureException(userEntryError, { extra: { userEmail } });
    }
    throw userEntryError;
  }

  return userEntry;
};

export const generateUserDbDataQueryKey = (userEmail: string) => [
  "userDbData",
  userEmail,
];

export const useUserDbData = (userEmail: string) => {
  return useQuery<SupabaseUser | null>({
    queryKey: generateUserDbDataQueryKey(userEmail),
    queryFn: ({ signal }) => getUserDbData(userEmail, signal!),
  });
};
