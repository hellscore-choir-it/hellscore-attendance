import { captureException } from "@sentry/nextjs";
import { Auth, google } from "googleapis";
import { castArray, compact, concat, head, map, size, zip } from "lodash";
import { z } from "zod";
import { env } from "../env/server.mjs";
import { nowISO } from "../utils/dates";
import { doAsyncOperationWithRetry } from "./common/doAsyncOperationWithRetry";
import { RequestQueue } from "./common/RequestQueue";
import { testEvents } from "./testEvents";

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

export interface UserEventType {
  title: string;
  email: string;
  isTest?: boolean;
}

const userEventQueryRanges = [
  "user_event_event_title",
  "user_event_user_email",
];

export const getUserEventTypeAssignments = async ({
  retry = true,
  maxRetries = 3,
}: {
  retry?: boolean;
  maxRetries?: number;
} = {}): Promise<UserEventType[] | undefined> => {
  return await doAsyncOperationWithRetry(
    async () => {
      // Get the titles and emails from the "User Events" sheet
      // This sheet assigns user emails to event types they need to attend
      const googleSheetsBatchGetParams = {
        spreadsheetId: isTestEnvironment() ? env.TEST_SHEET_ID : env.SHEET_ID,
        ranges: ["user_event_event_title", "user_event_user_email"],
      };
      const userEventSheetResponse = await sheetsRequestQueue.add(() =>
        sheets.spreadsheets.values.batchGet(googleSheetsBatchGetParams)
      );

      try {
        const userEventData = gsheetDataSchema.parse(
          userEventSheetResponse.data
        );
        const eventTypes = userEventData.valueRanges?.[0]?.values;
        const emails = userEventData.valueRanges?.[1]?.values;
        if (size(eventTypes) !== size(emails)) {
          throw new Error(
            `Mismatch in number of events (${size(
              eventTypes
            )}) and emails (${size(emails)}).
            Check the ranges: ${userEventQueryRanges}
            Response: ${JSON.stringify(
              userEventSheetResponse.data || "No data"
            )}`
          );
        }
        const rowPairs = zip(eventTypes, emails) || [];
        const regularEvents = map(rowPairs, ([title, email]) => ({
          title: head(castArray(title)) || "",
          email: head(castArray(email)) || "",
        }));

        return compact(regularEvents);
      } catch (error) {
        captureException(error, {
          extra: { userEventSheetResponse, googleSheetsBatchGetParams },
        });
        console.error(
          "Failed to parse Google Sheets data:",
          error,
          userEventSheetResponse.data
        );
        throw new Error(
          `Failed to parse Google Sheets data: ${error}. Response: ${JSON.stringify(
            userEventSheetResponse.data || "No data"
          )}`
        );
      }
    },
    { retry, maxRetries }
  );
};

const hellscoreCalendarId =
  "6bo68oo6iujc4obpo3fvanpd24@group.calendar.google.com";

export const getHellscoreEvents = async () => {
  const response = await calendars.events.list({
    calendarId: hellscoreCalendarId,
    maxAttendees: 1,
    maxResults: 20,
    orderBy: "startTime",
    singleEvents: true,
    timeMin: nowISO(),
  });
  const items = response.data.items;
  if (!items) {
    throw new Error(
      `No items in Hellscore calendar??? Calendar ID: ${hellscoreCalendarId}`
    );
  }

  console.debug("Returning Hellscore events:", size(items), "items");
  return isTestEnvironment() ? concat(items, testEvents) : items;
};
