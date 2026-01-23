import { getGoogleApiErrorInfo, isRetryableError } from "../../utils/errors";

describe("errors utility", () => {
  describe("getGoogleApiErrorInfo", () => {
    it("extracts status from standard Google API error format", () => {
      const error = {
        response: {
          status: 403,
          statusText: "Forbidden",
        },
        code: "PERMISSION_DENIED",
        message: "The caller does not have permission",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: 403,
        statusText: "Forbidden",
        code: "PERMISSION_DENIED",
        message: "The caller does not have permission",
        reason: undefined,
      });
    });

    it("extracts reason from nested error structure (response.data.error.errors[0].reason)", () => {
      const error = {
        response: {
          status: 429,
          statusText: "Too Many Requests",
          data: {
            error: {
              errors: [
                {
                  reason: "rateLimitExceeded",
                  message: "Rate Limit Exceeded",
                },
              ],
            },
          },
        },
        message: "Rate limit exceeded",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: 429,
        statusText: "Too Many Requests",
        code: undefined,
        message: "Rate limit exceeded",
        reason: "rateLimitExceeded",
      });
    });

    it("extracts reason from alternative error structure (errors[0].reason)", () => {
      const error = {
        errors: [
          {
            reason: "quotaExceeded",
            message: "Quota exceeded",
          },
        ],
        message: "Quota exceeded for quota metric",
        code: "QUOTA_EXCEEDED",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: "QUOTA_EXCEEDED",
        message: "Quota exceeded for quota metric",
        reason: "quotaExceeded",
      });
    });

    it("handles errors with multiple reasons and picks the first one", () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              errors: [
                { reason: "invalidParameter" },
                { reason: "missingField" },
              ],
            },
          },
        },
        message: "Bad request",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.reason).toBe("invalidParameter");
    });

    it("returns undefined for missing fields", () => {
      const error = {
        message: "Something went wrong",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: "Something went wrong",
        reason: undefined,
      });
    });

    it("handles null error", () => {
      const result = getGoogleApiErrorInfo(null);

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: undefined,
        reason: undefined,
      });
    });

    it("handles undefined error", () => {
      const result = getGoogleApiErrorInfo(undefined);

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: undefined,
        reason: undefined,
      });
    });

    it("handles empty object error", () => {
      const result = getGoogleApiErrorInfo({});

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: undefined,
        reason: undefined,
      });
    });

    it("handles non-Google API error (plain Error object)", () => {
      const error = new Error("Network timeout");

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: "Network timeout",
        reason: undefined,
      });
    });

    it("handles string error", () => {
      const result = getGoogleApiErrorInfo("Something failed");

      expect(result).toEqual({
        status: undefined,
        statusText: undefined,
        code: undefined,
        message: undefined,
        reason: undefined,
      });
    });

    it("filters out non-number status values", () => {
      const error = {
        response: {
          status: "403", // String instead of number
          statusText: "Forbidden",
        },
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.status).toBeUndefined();
      expect(result.statusText).toBe("Forbidden");
    });

    it("filters out non-string statusText values", () => {
      const error = {
        response: {
          status: 500,
          statusText: 500, // Number instead of string
        },
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.status).toBe(500);
      expect(result.statusText).toBeUndefined();
    });

    it("filters out non-string code values", () => {
      const error = {
        code: 12345, // Number instead of string
        message: "Error occurred",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.code).toBeUndefined();
      expect(result.message).toBe("Error occurred");
    });

    it("filters out non-string message values", () => {
      const error = {
        message: { text: "Error occurred" }, // Object instead of string
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.message).toBeUndefined();
    });

    it("filters out non-string reason values", () => {
      const error = {
        response: {
          data: {
            error: {
              errors: [
                {
                  reason: 404, // Number instead of string
                },
              ],
            },
          },
        },
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.reason).toBeUndefined();
    });

    it("handles complex nested error with partial data", () => {
      const error = {
        response: {
          status: 500,
          statusText: "Internal Server Error",
          data: {
            error: {
              message: "Server error",
              errors: [], // Empty errors array
            },
          },
        },
        message: "Request failed",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: 500,
        statusText: "Internal Server Error",
        code: undefined,
        message: "Request failed",
        reason: undefined,
      });
    });

    it("handles Axios-style error with all fields", () => {
      const error = {
        response: {
          status: 401,
          statusText: "Unauthorized",
          data: {
            error: {
              code: 401,
              message: "Request had invalid authentication credentials.",
              errors: [
                {
                  message: "Invalid Credentials",
                  domain: "global",
                  reason: "authError",
                },
              ],
              status: "UNAUTHENTICATED",
            },
          },
        },
        code: "UNAUTHENTICATED",
        message: "Request failed with status code 401",
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: 401,
        statusText: "Unauthorized",
        code: "UNAUTHENTICATED",
        message: "Request failed with status code 401",
        reason: "authError",
      });
    });

    it("prefers response.data.error.errors[0].reason over errors[0].reason", () => {
      const error = {
        response: {
          data: {
            error: {
              errors: [{ reason: "fromResponseData" }],
            },
          },
        },
        errors: [{ reason: "fromTopLevel" }],
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.reason).toBe("fromResponseData");
    });

    it("falls back to errors[0].reason when response.data path is incomplete", () => {
      const error = {
        response: {
          data: {
            error: {
              // No errors array here
            },
          },
        },
        errors: [{ reason: "fallbackReason" }],
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result.reason).toBe("fallbackReason");
    });

    it("handles error with deeply nested null values", () => {
      const error = {
        response: {
          status: 503,
          data: {
            error: null,
          },
        },
      };

      const result = getGoogleApiErrorInfo(error);

      expect(result).toEqual({
        status: 503,
        statusText: undefined,
        code: undefined,
        message: undefined,
        reason: undefined,
      });
    });

    it("does not leak credentials or sensitive data", () => {
      const error = {
        response: {
          status: 401,
          statusText: "Unauthorized",
          data: {
            error: {
              errors: [{ reason: "authError" }],
            },
          },
          headers: {
            authorization: "Bearer secret-token",
          },
          config: {
            headers: {
              "X-API-Key": "secret-key",
            },
          },
        },
        message: "Authentication failed",
        config: {
          auth: {
            username: "user",
            password: "password",
          },
        },
      };

      const result = getGoogleApiErrorInfo(error);

      // Verify that only safe fields are extracted
      expect(result).toEqual({
        status: 401,
        statusText: "Unauthorized",
        code: undefined,
        message: "Authentication failed",
        reason: "authError",
      });

      // Verify sensitive data is not present
      expect(result).not.toHaveProperty("headers");
      expect(result).not.toHaveProperty("config");
      expect(JSON.stringify(result)).not.toContain("secret");
      expect(JSON.stringify(result)).not.toContain("Bearer");
      expect(JSON.stringify(result)).not.toContain("password");
    });
  });

  describe("isRetryableError", () => {
    it("returns true for rate limit error (429)", () => {
      const error = { response: { status: 429 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for server error (500)", () => {
      const error = { response: { status: 500 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for bad gateway (502)", () => {
      const error = { response: { status: 502 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for service unavailable (503)", () => {
      const error = { response: { status: 503 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for gateway timeout (504)", () => {
      const error = { response: { status: 504 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ECONNRESET error", () => {
      const error = { code: "ECONNRESET" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ENOTFOUND error", () => {
      const error = { code: "ENOTFOUND" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ETIMEDOUT error", () => {
      const error = { code: "ETIMEDOUT" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for quota in message", () => {
      const error = { message: "Exceeded quota for requests" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for rate limit in message (lowercase)", () => {
      const error = { message: "rate limit exceeded" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for timeout in message (lowercase)", () => {
      const error = { message: "Request timeout occurred" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for TIMEOUT in message (uppercase)", () => {
      const error = { message: "Connection TIMEOUT" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ECONNRESET in message", () => {
      const error = { message: "Error: ECONNRESET" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ETIMEDOUT in message", () => {
      const error = { message: "Error: ETIMEDOUT" };
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns falsy for non-retryable status codes", () => {
      expect(isRetryableError({ response: { status: 400 } })).toBeFalsy();
      expect(isRetryableError({ response: { status: 401 } })).toBeFalsy();
      expect(isRetryableError({ response: { status: 403 } })).toBeFalsy();
      expect(isRetryableError({ response: { status: 404 } })).toBeFalsy();
    });

    it("returns falsy for non-retryable error codes", () => {
      expect(isRetryableError({ code: "INVALID_ARGUMENT" })).toBeFalsy();
      expect(isRetryableError({ code: "PERMISSION_DENIED" })).toBeFalsy();
    });

    it("returns falsy for empty error", () => {
      expect(isRetryableError({})).toBeFalsy();
    });

    it("returns falsy for null", () => {
      expect(isRetryableError(null)).toBeFalsy();
    });

    it("returns falsy for undefined", () => {
      expect(isRetryableError(undefined)).toBeFalsy();
    });
  });
});
