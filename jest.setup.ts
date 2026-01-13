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

if (!("ResizeObserver" in global)) {
  (global as typeof globalThis & { ResizeObserver?: typeof ResizeObserver })["ResizeObserver"] =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

const elementProto = Element.prototype as unknown as {
  hasPointerCapture?: (pointerId?: number) => boolean;
  releasePointerCapture?: (pointerId?: number) => void;
  scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
};

if (!elementProto.hasPointerCapture) {
  elementProto.hasPointerCapture = () => false;
}
if (!elementProto.releasePointerCapture) {
  elementProto.releasePointerCapture = () => {};
}
if (!elementProto.scrollIntoView) {
  elementProto.scrollIntoView = () => {};
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
