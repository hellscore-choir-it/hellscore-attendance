import { useSession } from "next-auth/react";
import { useE2ESession } from "../e2e/client/useE2ESession";
import { isE2EClient } from "../e2e/mode";

/**
 * Wrapper around NextAuth `useSession` that supports a minimal E2E mode.
 *
 * In E2E mode, the session is derived from `?e2eEmail=` so we can run
 * browser tests without real Google auth.
 */
export const useAppSession = () => {
  const nextAuth = useSession();

  if (!isE2EClient()) {
    return nextAuth;
  }

  return useE2ESession(nextAuth as any) as typeof nextAuth;
};
