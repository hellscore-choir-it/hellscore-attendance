// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema } from "./schema.mjs";
import { env as clientEnv, formatErrors } from "./client.mjs";

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.SKIP_ENV_VALIDATION === "1";

// Even when skipping full validation (e.g. Playwright E2E in CI), we still want
// schema defaults/coercions for the *defaulted* keys.
const defaultsSchema = serverSchema.pick({
  MAX_CONCURRENT_GOOGLE_SHEET_REQUESTS: true,
  DELAY_BETWEEN_GOOGLE_SHEET_REQUESTS: true,
  ADMIN_EMAILS: true,
});
const _defaultsEnv = defaultsSchema.safeParse(process.env);

const _serverEnv = skipValidation ? null : serverSchema.safeParse(process.env);

if (!skipValidation && _serverEnv && !_serverEnv.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_serverEnv.error.format()),
  );
}

const serverEnvData = skipValidation
  ? { ...process.env, ...(_defaultsEnv.success ? _defaultsEnv.data : {}) }
  : _serverEnv?.data;

for (let key of Object.keys(serverEnvData || {})) {
  if (key.startsWith("NEXT_PUBLIC_") && !skipValidation) {
    console.warn("❌ You are exposing a server-side env-variable:", key);
  }
}

export const env = { ...serverEnvData, ...clientEnv };
