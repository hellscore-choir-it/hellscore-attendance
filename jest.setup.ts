import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: (fn: any) => fn({}),
}));

jest.mock("./src/utils/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          abortSignal: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));
