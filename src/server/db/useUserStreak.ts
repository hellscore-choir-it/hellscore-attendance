import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";

import { startsWith } from "lodash";
import { createClient } from "../../utils/supabase/client";
import { generateSupabaseUserId, type SupabaseUser } from "./schema";
import { isE2EClient } from "../../e2e/mode";

export const getUserDbData = async (userEmail: string, signal: AbortSignal) => {
  if (isE2EClient()) {
    const { getE2EUserDbData } = await import("../../e2e/client/userDbFixture");
    return getE2EUserDbData(userEmail);
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
