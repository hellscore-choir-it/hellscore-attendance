import { Auth, calendar_v3, google } from "googleapis";
import { z } from "zod";
import { env } from "../env/server.mjs";
import { nowISO } from "../utils/dates";
import { captureException } from "@sentry/nextjs";
import {
  castArray,
  compact,
  concat,
  head,
  map,
  size,
  zip,
} from "lodash";
import { doAsyncOperationWithRetry } from "./common/doAsyncOperationWithRetry";
import { RequestQueue } from "./common/RequestQueue";

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
  env.TEST_EVENTS === "true" || env.TEST_EVENTS === "1";

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
  return await doAsyncOperationWithRetry(
    async () =>
      sheetsRequestQueue.add(() =>
        sheets.spreadsheets.values.append({
          spreadsheetId: isTestEnvironment() ? env.TEST_SHEET_ID : env.SHEET_ID,
          requestBody: { values: [row] },
          range: "response",
          valueInputOption: "USER_ENTERED",
        })
      ),
    { retry, maxRetries }
  );
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

export const getSheetContent = async ({
  retry = true,
  maxRetries = 3,
}: {
  retry?: boolean;
  maxRetries?: number;
} = {}): Promise<UserEvent[] | undefined> => {
  return await doAsyncOperationWithRetry(
    async () => {
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
              {
                title: "Test Event",
                isTest: true,
                email: "hellscore.it@gmail.com",
              },
              {
                title: "Test Event 2",
                isTest: true,
                email: "hellscore.it@gmail.com",
              },
            ]
          : [];

        return compact(concat(regularEvents, testEvents));
      } catch (error) {
        captureException(error, { extra: { response } });
        console.error(
          "Failed to parse Google Sheets data:",
          error,
          response.data
        );
        throw new Error(
          `Failed to parse Google Sheets data: ${error}. Response: ${JSON.stringify(
            response.data || "No data"
          )}`
        );
      }
    },
    { retry, maxRetries }
  );
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
        summary: "חזרה Hellscore",
        description: "This is a test event",
        location: "Test Location",
        status: "confirmed",
        isTest: true,
      },
      {
        id: "2",
        start: {
          dateTime: new Date(
            new Date().getTime() + 60 * 60 * 1000 + 24 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: new Date(
            new Date().getTime() + 2 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        summary: "חזרה פיראטית",
        description: "This is a test event",
        location: "Test Location",
        status: "confirmed",
        isTest: true,
      },
      {
        id: "3",
        start: {
          dateTime: new Date(
            new Date().getTime() + 60 * 60 * 1000 + 48 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: new Date(
            new Date().getTime() + 2 * 60 * 60 * 1000 + 48 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        summary: "חזרת אנסמבל",
        description: "This is a test event",
        location: "Test Location",
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

  console.debug("Returning Hellscore events:", size(items), "items");
  return items;
};
