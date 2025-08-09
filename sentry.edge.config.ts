// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3a15c33903c2d79f92012dbb69b400d1@o4509730562899968.ingest.de.sentry.io/4509730568339536",

  // Filter out problematic integrations that cause fetch issues with Next.js 15 + React 19 + TRPC 10 RC
  integrations: (defaultIntegrations) => 
    defaultIntegrations.filter((integration) => {
      // Remove fetch instrumentation to fix compatibility issues
      return integration.name !== 'Fetch';
    }),

  // Re-enable performance monitoring but with fetch instrumentation disabled  
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
