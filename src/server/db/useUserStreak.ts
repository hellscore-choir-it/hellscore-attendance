import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "../../utils/supabase/client";
import { generateSupabaseUserId, type SupabaseUser } from "./schema";

export const getUserDbData = async (userEmail: string, signal: AbortSignal) => {
  const supabase = createClient();

  const supabaseUserId = generateSupabaseUserId(userEmail);

  const { data: userEntry, error: userEntryError } = await supabase
    .from("user")
    .select("*")
    .eq("id", supabaseUserId)
    .abortSignal(signal)
    .maybeSingle<SupabaseUser>();

  if (userEntryError) {
    captureException(userEntryError, { extra: { userEmail } });
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
