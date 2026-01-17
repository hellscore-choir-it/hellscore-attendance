import { captureException } from "@sentry/nextjs";

export const APP_CONFIG_TABLE_NAME = "app_config";

export type AppConfigRow = {
  key: string;
  value: unknown;
  updated_at?: string;
};

export type AppConfigEntries = Map<
  string,
  {
    value: unknown;
    updated_at?: string;
  }
>;

const loadSupabaseBrowserClient = async () => {
  const { createClient } = await import("../../utils/supabase/client");
  return createClient();
};

export const extractEntriesByPrefix = (
  rows: AppConfigRow[] | null | undefined,
  prefix: string
): AppConfigEntries => {
  const entries: AppConfigEntries = new Map();

  for (const row of rows ?? []) {
    if (!row?.key?.startsWith(prefix)) continue;
    const shortKey = row.key.slice(prefix.length);
    entries.set(shortKey, { value: row.value, updated_at: row.updated_at });
  }

  return entries;
};

export const fetchAppConfigEntriesByPrefix = async ({
  prefix,
  signal,
  source,
}: {
  prefix: string;
  signal?: AbortSignal;
  source: string;
}): Promise<AppConfigEntries | null> => {
  try {
    const supabase = await loadSupabaseBrowserClient();

    const baseQuery = supabase
      .from(APP_CONFIG_TABLE_NAME)
      .select("key,value,updated_at")
      .like("key", `${prefix}%`);
    const query = signal ? baseQuery.abortSignal(signal) : baseQuery;

    const { data, error } = await query.returns<AppConfigRow[]>();

    if (error) {
      captureException(error, { extra: { source } });
      return null;
    }

    return extractEntriesByPrefix(data, prefix);
  } catch (error) {
    captureException(error, { extra: { source } });
    return null;
  }
};
