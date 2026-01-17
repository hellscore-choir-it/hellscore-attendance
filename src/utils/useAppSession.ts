import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const isE2ETestMode = () => process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";

const getE2EEmail = () => {
  if (!isE2ETestMode()) return null;
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const email = params.get("e2eEmail");
  return email && email.trim().length > 0 ? email.trim() : null;
};

/**
 * Wrapper around NextAuth `useSession` that supports a minimal E2E mode.
 *
 * In E2E mode, the session is derived from `?e2eEmail=` so we can run
 * browser tests without real Google auth.
 */
export const useAppSession = () => {
  const nextAuth = useSession();

  if (!isE2ETestMode()) {
    return nextAuth;
  }

  // Prevent hydration mismatches: the server can't read `window.location`, so
  // we intentionally return a stable "loading" state until after hydration.
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return {
      ...nextAuth,
      data: null,
      status: "loading",
    } as typeof nextAuth;
  }

  const email = getE2EEmail();
  if (!email) {
    return {
      ...nextAuth,
      data: null,
      status: "unauthenticated",
    } as typeof nextAuth;
  }

  return {
    ...nextAuth,
    data: {
      user: {
        email,
      },
      expires: "2999-01-01T00:00:00.000Z",
    },
    status: "authenticated",
  } as typeof nextAuth;
};
