/// <reference types="jest" />
import "@testing-library/jest-dom";

// Global Next.js router mock.
// Tests can inspect/override via `jest.requireMock("next/router").__mockRouter`.
jest.mock("next/router", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    isFallback: false,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };

  const useRouter = jest.fn(() => mockRouter);

  return {
    useRouter,
    __mockRouter: mockRouter,
  };
});

// Global NextAuth session mock.
// Tests can override via `jest.requireMock("next-auth/react").__setMockSession(...)`.
jest.mock("next-auth/react", () => {
  const defaultSession = {
    data: { user: { email: "user@example.com" } },
    status: "authenticated",
  };

  let mockSession = defaultSession;

  const useSession = jest.fn(() => mockSession);

  return {
    useSession,
    __getMockSession: () => mockSession,
    __setMockSession: (next: any) => {
      mockSession = next;
    },
    __resetMockSession: () => {
      mockSession = defaultSession;
    },
  };
});

// Global toast mock (used by the cat generator UI).
// Tests can inspect via `jest.requireMock("sonner").toast`.
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() },
}));

afterEach(() => {
  const routerModule = jest.requireMock("next/router") as any;
  const router = routerModule.__mockRouter;

  router.push.mockReset();
  router.replace.mockReset();
  router.prefetch.mockReset();
  router.events.on.mockReset();
  router.events.off.mockReset();
  router.events.emit.mockReset();

  if (routerModule.useRouter?.mockImplementation) {
    routerModule.useRouter.mockImplementation(() => router);
  }
  if (routerModule.useRouter?.mockClear) {
    routerModule.useRouter.mockClear();
  }

  const authModule = jest.requireMock("next-auth/react") as any;
  if (authModule.__resetMockSession) {
    authModule.__resetMockSession();
  }
  if (authModule.useSession?.mockClear) {
    authModule.useSession.mockClear();
  }
});

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
  (global as typeof globalThis & { ResizeObserver?: typeof ResizeObserver })[
    "ResizeObserver"
  ] = ResizeObserverMock as unknown as typeof ResizeObserver;
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
