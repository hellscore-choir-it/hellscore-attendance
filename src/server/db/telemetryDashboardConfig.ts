import { captureException } from "@sentry/nextjs";
import { isArray, map, some } from "lodash";

import { createServiceRoleClient } from "../../utils/supabase/serviceRoleClient";

const TELEMETRY_ALLOWLIST_KEY = "telemetry.allowlist";

export const DEFAULT_TELEMETRY_DASHBOARD_ALLOWLIST = [
  "vehpus@gmail.com",
  "hellscorechoir.it@gmail.com",
];

const sanitizeAllowlist = (value: unknown) => {
  if (!isArray(value)) {
    return [];
  }

  return map(value, (email) => (typeof email === "string" ? email.trim() : ""))
    .map((email) => email.toLowerCase())
    .filter((email) => email.length > 0);
};

export const isEmailAllowlisted = (allowlist: string[], userEmail?: string) => {
  if (!userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();
  return some(allowlist, (allowed) => allowed.toLowerCase() === normalized);
};

export const fetchTelemetryDashboardAllowlist = async (): Promise<string[]> => {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("app_config")
      .select("key,value")
      .eq("key", TELEMETRY_ALLOWLIST_KEY)
      .maybeSingle<{ key: string; value: unknown }>();

    if (error) {
      captureException(error, {
        extra: { source: "telemetryDashboardAllowlist" },
      });
      return DEFAULT_TELEMETRY_DASHBOARD_ALLOWLIST;
    }

    const allowlist = sanitizeAllowlist(data?.value);
    return allowlist.length ? allowlist : DEFAULT_TELEMETRY_DASHBOARD_ALLOWLIST;
  } catch (error) {
    captureException(error, {
      extra: { source: "telemetryDashboardAllowlist" },
    });
    return DEFAULT_TELEMETRY_DASHBOARD_ALLOWLIST;
  }
};
