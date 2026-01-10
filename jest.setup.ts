/// <reference types="jest" />
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

const mockMutate = jest.fn();
const mockUseMutation = jest.fn(() => ({ mutateAsync: mockMutate }));

jest.mock("./src/utils/trpc", () => ({
  trpc: {
    google: {
      submitAttendance: {
        useMutation: mockUseMutation,
      },
    },
  },
  __mock: {
    mockMutate,
    mockUseMutation,
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: (fn: any) => fn({}),
}));

// Radix components expect these browser APIs in the environment
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom lacks ResizeObserver
global.ResizeObserver = ResizeObserverMock;

if (!Element.prototype.hasPointerCapture) {
  // @ts-expect-error test env shim
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  // @ts-expect-error test env shim
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  // @ts-expect-error test env shim
  Element.prototype.scrollIntoView = () => {};
}

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
