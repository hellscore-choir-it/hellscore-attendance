export const isRetryableError = (error: any): boolean =>
  error?.response?.status === 429 || // Rate limit
  error?.response?.status === 500 || // Server error
  error?.response?.status === 502 || // Bad Gateway
  error?.response?.status === 503 || // Service Unavailable
  error?.response?.status === 504 || // Gateway Timeout
  error?.code === "ECONNRESET" || // Connection reset
  error?.code === "ENOTFOUND" || // DNS lookup failed
  error?.code === "ETIMEDOUT" || // Request timeout
  error?.message?.includes("quota") ||
  error?.message?.includes("rate limit") ||
  error?.message?.includes("timeout") ||
  error?.message?.includes("TIMEOUT") ||
  error?.message?.includes("ECONNRESET") ||
  error?.message?.includes("ETIMEDOUT");

export type GoogleApiErrorInfo = {
  status?: number;
  statusText?: string;
  code?: string;
  message?: string;
  reason?: string;
};

// Extracts common fields from `googleapis` errors without leaking credentials.
export const getGoogleApiErrorInfo = (error: unknown): GoogleApiErrorInfo => {
  const anyError = error as any;

  const status = anyError?.response?.status;
  const statusText = anyError?.response?.statusText;
  const code = anyError?.code;
  const message = anyError?.message;

  // Many Google APIs respond with `{ error: { message, status, errors: [{ reason }] } }`
  const reason =
    anyError?.response?.data?.error?.errors?.[0]?.reason ??
    anyError?.errors?.[0]?.reason;

  return {
    status: typeof status === "number" ? status : undefined,
    statusText: typeof statusText === "string" ? statusText : undefined,
    code: typeof code === "string" ? code : undefined,
    message: typeof message === "string" ? message : undefined,
    reason: typeof reason === "string" ? reason : undefined,
  };
};
