import type { SupabaseUser } from "../../server/db/schema";
import { generateSupabaseUserId } from "../../server/db/schema";
import { getE2EQueryParam } from "./queryParams";

export const getE2EUserDbData = (userEmail: string): SupabaseUser | null => {
  const raw = getE2EQueryParam("e2eStreak");
  if (raw === "loading" || raw === "null") return null;

  const parsed = raw ? Number(raw) : 10;
  const responseStreak = Number.isFinite(parsed) && parsed >= 0 ? parsed : 10;

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
};
