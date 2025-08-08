import { Auth, calendar_v3, google } from "googleapis";
import { z } from "zod";
import { env } from "../env/server.mjs";
import { nowISO } from "../utils/dates";
import { captureException } from "@sentry/nextjs";
import { castArray, compact, concat, head, map, size, zip } from "lodash";

// Simple request queue to prevent overwhelming Google Sheets API
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentRequests = 0;
  private maxConcurrent = 3; // Limit concurrent requests to Google Sheets API
  private delayBetweenRequests = 100; // 100ms delay between requests

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

    while (this.queue.length > 0 && this.concurrentRequests < this.maxConcurrent) {
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
            if (this.queue.length > 0) {
              this.processQueue();
            }
          }
        }, this.delayBetweenRequests);
      }
    }

    this.processing = false;
  }
}

// Global request queue instance
const sheetsRequestQueue = new RequestQueue();

// If we need to check if we're running in a build environment (like Vercel build)
// const isBuildEnvironment = () => process.env.NEXT_PHASE === 'PHASE_PRODUCTION_BUILD' || process.env.VERCEL_ENV === 'production';

const auth = google.auth.fromJSON(
  JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
) as Auth.JWT & { scopes: string[] };

auth.scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.readonly",
];
const sheets = google.sheets({ version: "v4", auth });
const calendars = google.calendar({ version: "v3", auth });

const isTestEnvironment = () =>
  process.env.TEST_EVENTS === "true" || process.env.TEST_EVENTS === "1";

export const writeResponseRow = async (
  row: (string | boolean | number)[],
  {
    retry = true,
    maxRetries = 3,
  }: {
    retry?: boolean;
    maxRetries?: number;
  } = {}
) => {
  // Maximum number of retry attempts
  let attempt = 0;

  while (attempt < (retry ? maxRetries : 1)) {
    try {
      // Exponential backoff delay on retries
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
      }

      attempt++;

      return await sheetsRequestQueue.add(() =>
        sheets.spreadsheets.values.append({
          spreadsheetId: isTestEnvironment() ? env.TEST_SHEET_ID : env.SHEET_ID,
          requestBody: { values: [row] },
          range: "response",
          valueInputOption: "USER_ENTERED",
        })
      );
    } catch (error: any) {
      console.error(
        `Error writing to sheet (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // If we've exhausted retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }

      // Check if this is a rate limit error, temporary failure, or gateway timeout
      const isRetryableError =
        error?.response?.status === 429 || // Rate limit
        error?.response?.status === 500 || // Server error
        error?.response?.status === 502 || // Bad Gateway
        error?.response?.status === 503 || // Service Unavailable
        error?.response?.status === 504 || // Gateway Timeout
        error?.code === 'ECONNRESET' || // Connection reset
        error?.code === 'ENOTFOUND' || // DNS lookup failed
        error?.code === 'ETIMEDOUT' || // Request timeout
        error?.message?.includes("quota") ||
        error?.message?.includes("rate limit") ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("TIMEOUT") ||
        error?.message?.includes("ECONNRESET") ||
        error?.message?.includes("ETIMEDOUT");

      // If it's not a retryable error, don't retry
      if (!isRetryableError) {
        throw error;
      }
    }
  }
};

const gsheetDataSchema = z.object({
  spreadsheetId: z.string(),
  valueRanges: z.tuple([
    z.object({
      values: z.array(z.tuple([z.string()])),
    }),
    z.object({
      values: z.array(z.tuple([z.string().email()])),
    }),
  ]),
});

export interface UserEvent {
  title: string;
  email: string;
  isTest?: boolean;
}

export const getSheetContent = async (
  {
    retry = true,
    maxRetries = 3,
  }: {
    retry?: boolean;
    maxRetries?: number;
  } = {}
): Promise<UserEvent[]> => {
  let attempt = 0;

  while (attempt < (retry ? maxRetries : 1)) {
    try {
      // Exponential backoff delay on retries
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt} for getSheetContent after ${delay}ms delay`);
      }

      attempt++;

      const response = await sheetsRequestQueue.add(() =>
        sheets.spreadsheets.values.batchGet({
          spreadsheetId: isTestEnvironment() ? env.TEST_SHEET_ID : env.SHEET_ID,
          ranges: ["user_event_event_title", "user_event_user_email"],
        })
      );

      try {
        const data = gsheetDataSchema.parse(response.data);
        const events = data.valueRanges[0].values;
        const emails = data.valueRanges[1].values;
        if (size(events) !== size(emails)) {
          throw new Error(
            `Mismatch in number of events (${size(events)}) and emails (${size(
              emails
            )}). Response: ${JSON.stringify(response.data || "No data")}`
          );
        }
        const pairs = zip(events, emails) || [];
        const regularEvents = map(pairs, ([title, email], i) => ({
          title: head(castArray(title)) || "",
          email: head(castArray(email)) || "",
        }));

        const testEvents: UserEvent[] = isTestEnvironment()
          ? [
              { title: "Test Event", isTest: true, email: "hellscore.it@gmail.com" },
              { title: "Test Event 2", isTest: true, email: "hellscore.it@gmail.com" },
            ]
          : [];

        return compact(concat(regularEvents, testEvents));
      } catch (error) {
        captureException(error, { extra: { response } });
        console.error("Failed to parse Google Sheets data:", error, response.data);
        throw new Error(
          `Failed to parse Google Sheets data: ${error}. Response: ${JSON.stringify(
            response.data || "No data"
          )}`
        );
      }
    } catch (error: any) {
      console.error(
        `Error reading from sheet (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // If we've exhausted retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }

      // Check if this is a rate limit error, temporary failure, or gateway timeout
      const isRetryableError =
        error?.response?.status === 429 || // Rate limit
        error?.response?.status === 500 || // Server error
        error?.response?.status === 502 || // Bad Gateway
        error?.response?.status === 503 || // Service Unavailable
        error?.response?.status === 504 || // Gateway Timeout
        error?.code === 'ECONNRESET' || // Connection reset
        error?.code === 'ENOTFOUND' || // DNS lookup failed
        error?.code === 'ETIMEDOUT' || // Request timeout
        error?.message?.includes("quota") ||
        error?.message?.includes("rate limit") ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("TIMEOUT") ||
        error?.message?.includes("ECONNRESET") ||
        error?.message?.includes("ETIMEDOUT");

      // If it's not a retryable error, don't retry
      if (!isRetryableError) {
        throw error;
      }
    }
  }
};

interface EventResponse extends calendar_v3.Schema$Event {
  isTest?: boolean;
}

// recurringEventId
export const getHellscoreEvents = async (): Promise<EventResponse[]> => {
  if (isTestEnvironment()) {
    const testEvents: EventResponse[] = [
      {
        id: "1",
        start: {
          dateTime: new Date(
            new Date().getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: new Date(
            new Date().getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        summary: "Test Event",
        description: "This is a test event",
        location: "Test Location",
        status: "confirmed",
        isTest: true,
      },
      {
        id: "2",
        start: {
          dateTime: "2023-10-02T14:00:00+02:00",
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: "2023-10-02T16:00:00+02:00",
          timeZone: "Europe/Berlin",
        },
        summary: "Test Event 2",
        description: "This is another test event",
        location: "Test Location 2",
        status: "confirmed",
        isTest: true,
      },
    ];
    return testEvents;
  }
  const response = await calendars.events.list({
    calendarId: "6bo68oo6iujc4obpo3fvanpd24@group.calendar.google.com",
    maxAttendees: 1,
    maxResults: 20,
    orderBy: "startTime",
    singleEvents: true,
    timeMin: nowISO(),
  });
  const items = response.data.items;
  if (!items) {
    throw new Error("No items in Hellscore calendar???");
  }
  return items;
};
