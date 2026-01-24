// @ts-check
import { clientEnv, clientSchema } from "./schema.mjs";

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.SKIP_ENV_VALIDATION === "1";

const schemaToUse = skipValidation ? clientSchema.partial() : clientSchema;
const _clientEnv = schemaToUse.safeParse(clientEnv);

export const formatErrors = (
  /** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
  errors,
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value)
        return `${name}: ${value._errors.join(", ")}\n`;
    })
    .filter(Boolean);

if (!skipValidation && !_clientEnv.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_clientEnv.error.format()),
  );
}

for (let key of Object.keys(_clientEnv.data || {})) {
  if (!key.startsWith("NEXT_PUBLIC_")) {
    if (!skipValidation) {
      console.warn(
        `❌ Invalid public environment variable name: ${key}. It must begin with 'NEXT_PUBLIC_'`,
      );
    }
  }
}

export const env = _clientEnv.success ? _clientEnv.data : clientEnv;
