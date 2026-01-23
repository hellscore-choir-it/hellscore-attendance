// src/pages/api/trpc/[trpc].ts
import { captureException } from "@sentry/nextjs";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "../../../env/server.mjs";
import { createContext } from "../../../server/trpc/context";
import { appRouter } from "../../../server/trpc/router/_app";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError: ({ path, error, type, input }) => {
    if (env.NODE_ENV === "development") {
      console.error(`❌ tRPC failed on ${path}: ${error}`);
      return;
    }

    captureException(error, {
      tags: {
        trpcPath: path ?? "unknown",
        trpcType: type,
      },
      extra: {
        input,
      },
    });
  },
});
