import { env } from "../../env/server.mjs";
import { isEmpty } from "lodash";

// Simple request queue to prevent overwhelming Google Sheets API
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentRequests = 0;
  private maxConcurrent = env.MAX_CONCURRENT_GOOGLE_SHEET_REQUESTS ?? 3; // Limit concurrent requests to Google Sheets API
  private delayBetweenRequests = env.DELAY_BETWEEN_GOOGLE_SHEET_REQUESTS ?? 100; // ms delay between requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.concurrentRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (
      !isEmpty(this.queue) &&
      // Re-check concurrent requests on each iteration (since we're awaiting requests)
      this.concurrentRequests < this.maxConcurrent
    ) {
      const request = this.queue.shift();
      if (request) {
        this.concurrentRequests++;

        // Execute request with delay
        setTimeout(async () => {
          try {
            await request();
          } finally {
            this.concurrentRequests--;
            // Continue processing queue
            if (!isEmpty(this.queue)) {
              // Always try to add more parallel requests up to maxConcurrent
              this.processQueue();
            }
          }
        }, this.delayBetweenRequests);
      }
    }

    this.processing = false;
  }
}
