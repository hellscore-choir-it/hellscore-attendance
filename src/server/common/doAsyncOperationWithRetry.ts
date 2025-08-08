import { isRetryableError } from "../../utils/errors";

export const doAsyncOperationWithRetry = async <T>(
  operation: () => Promise<T>,
  {
    retry = true,
    maxRetries = 3,
  }: {
    retry?: boolean;
    maxRetries?: number;
  } = {}
): Promise<T> => {
  let attempt = 0;
  let lastAttemptError: any;

  while (attempt < (retry ? maxRetries : 1)) {
    try {
      // Exponential backoff delay on retries with jitter
      if (attempt > 0) {
        const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        const jitter = Math.floor(Math.random() * 1000); // up to 1s random jitter
        const delay = baseDelay + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.warn(
          `Retry attempt ${attempt} after ${delay}ms delay (base: ${baseDelay}ms, jitter: ${jitter}ms)`
        );
      }

      attempt++;

      // Execute the operation
      return await operation();
    } catch (error: any) {
      lastAttemptError = error;
      console.error(
        `Error occurred during async operation (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // If we've exhausted retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }

      // If it's not a retryable error, don't retry
      if (!isRetryableError(error)) {
        throw error;
      }
    }
  }

  // If we reach here, it means we exhausted all retries
  console.error(
    `Failed to complete async operation after ${attempt} attempts. Last error:`,
    lastAttemptError
  );
  throw (
    lastAttemptError ||
    new Error("Failed to complete async operation after retries without error")
  );
};
