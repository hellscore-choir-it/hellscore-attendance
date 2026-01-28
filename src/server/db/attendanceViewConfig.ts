import { captureException } from "@sentry/nextjs";
import { isArray, some } from "lodash";

import { env } from "../../env/server.mjs";
import { createServiceRoleClient } from "../../utils/supabase/serviceRoleClient";

const ATTENDANCE_VIEW_ALLOWLIST_KEY = "attendance.view.allowlist";

export const DEFAULT_ATTENDANCE_VIEW_ALLOWLIST = env.ADMIN_EMAILS ?? [];

const sanitizeAllowlist = (value: unknown) => {
  if (!isArray(value)) {
    return [];
  }

  return value
    .map((email) => (typeof email === "string" ? email.trim() : ""))
    .map((email) => email.toLowerCase())
    .filter((email) => email.length > 0);
};

const mergeAllowlists = (primary: string[], fallback: string[]) => {
  const merged = new Set<string>();
  for (const entry of primary) merged.add(entry);
  for (const entry of fallback) merged.add(entry);
  return Array.from(merged);
};

export const isEmailAllowlisted = (allowlist: string[], userEmail?: string) => {
  if (!userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();
  return some(allowlist, (allowed) => allowed.toLowerCase() === normalized);
};

export const fetchAttendanceViewAllowlist = async (): Promise<string[]> => {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("app_config")
      .select("key,value")
      .eq("key", ATTENDANCE_VIEW_ALLOWLIST_KEY)
      .maybeSingle<{ key: string; value: unknown }>();

    if (error) {
      captureException(error, {
        extra: { source: "attendanceViewAllowlist" },
      });
      return sanitizeAllowlist(DEFAULT_ATTENDANCE_VIEW_ALLOWLIST);
    }

    const allowlist = sanitizeAllowlist(data?.value);
    const defaults = sanitizeAllowlist(DEFAULT_ATTENDANCE_VIEW_ALLOWLIST);
    const merged = mergeAllowlists(allowlist, defaults);
    return merged.length ? merged : defaults;
  } catch (error) {
    captureException(error, {
      extra: { source: "attendanceViewAllowlist" },
    });
    return sanitizeAllowlist(DEFAULT_ATTENDANCE_VIEW_ALLOWLIST);
  }
};
