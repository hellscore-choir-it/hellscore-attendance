import type { Session } from "next-auth";
import type { UseSessionOptions } from "next-auth/react";
import { useEffect, useState } from "react";

import { getE2EEmailFromQuery } from "./queryParams";

/**
 * E2E-only session emulation.
 *
 * Important: server rendering cannot see query params, so we return a stable
 * loading state until after hydration.
 */
export const useE2ESession = <TSession extends Session = Session>(base: {
  data: TSession | null;
  status: "authenticated" | "unauthenticated" | "loading";
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return {
      ...base,
      data: null,
      status: "loading" as const,
    };
  }

  const email = getE2EEmailFromQuery();
  if (!email) {
    return {
      ...base,
      data: null,
      status: "unauthenticated" as const,
    };
  }

  return {
    ...base,
    data: {
      user: {
        email,
      },
      expires: "2999-01-01T00:00:00.000Z",
    } as unknown as TSession,
    status: "authenticated" as const,
  };
};

// Keep a small helper to satisfy typing at call sites.
export type E2ESessionResult<TSession extends Session = Session> = {
  data: TSession | null;
  status: "authenticated" | "unauthenticated" | "loading";
  // next-auth includes more fields on the return type; we don't rely on them in E2E mode.
} & Partial<UseSessionOptions<boolean>>;
