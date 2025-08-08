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
