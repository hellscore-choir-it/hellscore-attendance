import { captureException } from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

import { filter, includes, map, reduce } from "lodash";
import { z } from "zod";
import { getE2EAttendanceViewResponse } from "../../../e2e/server/attendanceViewFixture";
import {
  parseMembersSheet,
  parseResponsesSheet,
} from "../../../utils/attendance/normalize";
import { getAttendanceView } from "../../../utils/attendance/view";
import {
  attendanceSchema,
  sanitizeText,
} from "../../../utils/attendanceSchema";
import { getGoogleApiErrorInfo } from "../../../utils/errors";
import {
  fetchAttendanceViewAllowlist,
  isEmailAllowlisted,
} from "../../db/attendanceViewConfig";
import { performUpdateCallbacksSerially } from "../../db/userUpdateSideEffects";
import {
  getSheetMembers,
  getSheetResponses,
  getUserEventTypeAssignments,
  writeResponseRow,
} from "../../googleApis";
import { isE2EServer } from "../../../e2e/mode";
import { protectedProcedure, router } from "../trpc";

const attendanceViewInputSchema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  eventTitle: z.string().optional(),
});

export const googleRouter = router({
  submitAttendance: protectedProcedure
    .input(attendanceSchema)
    .mutation(
      async ({
        input: { eventTitle, eventDate, going, whyNot, wentLastTime, comments },
        ctx,
      }) => {
        const userEmail = ctx.session.user.email;
        if (!userEmail) {
          const error = new TRPCError({
            code: "UNAUTHORIZED",
            message: "User email is required to submit attendance.",
          });
          captureException(error, { extra: { userEmail, eventTitle } });
          throw error;
        }

        // Retry logic for authorization check via Google Sheets API
        let userEventTypes;
        try {
          userEventTypes = await getUserEventTypeAssignments({
            retry: true,
            maxRetries: 3,
          });
        } catch (error) {
          const errorId = randomUUID();
          const googleErrorInfo = getGoogleApiErrorInfo(error);
          console.error(
            "Failed to fetch sheet content for authorization check:",
            error
          );
          captureException(error, {
            tags: {
              errorId,
              googleApi: "sheets",
              operation: "getUserEventTypeAssignments",
            },
            extra: { userEmail, eventTitle, googleErrorInfo },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              googleErrorInfo.status === 429
                ? `Google Sheets rate-limited this request. Please try again in a minute. (errorId: ${errorId})`
                : `Google Sheets could not verify permissions. Please try again. (errorId: ${errorId})`,
          });
        }

        const requiredAttendees = map(
          filter(userEventTypes, { title: eventTitle }),
          "email"
        );

        if (!includes(requiredAttendees, userEmail)) {
          const errorMessage = `User ${userEmail} is not authorized to submit attendance for event "${eventTitle}".`;
          const error = new TRPCError({
            code: "UNAUTHORIZED",
            message: errorMessage,
          });
          captureException(error, {
            extra: { userEmail, requiredAttendees, eventTitle },
          });
          throw error;
        }
        // Double sanitize text inputs as a safety measure
        const sanitizedWhyNot = sanitizeText(whyNot);
        const sanitizedComments = sanitizeText(comments);

        // Update event, user response and streaks
        // Attach a catch immediately to avoid unhandled promise rejections
        // if Supabase updates fail before we await (we intentionally run these in parallel).
        let supabaseError: unknown | undefined;
        const supabasePromise = performUpdateCallbacksSerially({
          userEmail,
          eventTitle,
          eventDate,
          requiredAttendees,
          going,
          whyNot: sanitizedWhyNot,
          wentLastTime,
          comments: sanitizedComments,
        }).catch((error) => {
          supabaseError = error;
        });

        // Retry logic for writing attendance data
        try {
          await writeResponseRow(
            [
              userEmail,
              Date.now().toString(),
              eventTitle,
              // To stay compatible with previous date format in sheet
              `${new Date(eventDate).toDateString()} ${new Date(
                eventDate
              ).toLocaleTimeString()}`,
              going ? "TRUE" : "FALSE",
              sanitizedWhyNot,
              wentLastTime ? "TRUE" : "FALSE",
              sanitizedComments,
            ],
            { retry: true, maxRetries: 3 }
          );
        } catch (error) {
          const errorId = randomUUID();
          const googleErrorInfo = getGoogleApiErrorInfo(error);
          console.error("Failed to write attendance row:", error);
          captureException(error, {
            tags: {
              errorId,
              googleApi: "sheets",
              operation: "writeResponseRow",
            },
            extra: {
              userEmail,
              eventTitle,
              eventDate,
              going,
              whyNot,
              wentLastTime,
              comments,
              sanitizedWhyNot,
              sanitizedComments,
              googleErrorInfo,
            },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              googleErrorInfo.status === 429
                ? `Google Sheets rate-limited this request. Please try again in a minute. (errorId: ${errorId})`
                : `Unable to submit attendance to Google Sheets. Please try again. (errorId: ${errorId})`,
          });
        }

        await supabasePromise;
        if (supabaseError) {
          console.error("Failed to update Supabase:", supabaseError);
          captureException(supabaseError, {
            extra: {
              userEmail,
              eventTitle,
              eventDate,
              going,
              whyNot,
              wentLastTime,
              comments,
              sanitizedWhyNot,
              sanitizedComments,
            },
          });
          // Note: Attendance submission in Google Sheets succeeded, so we won't throw an error,
          // but we log the failure to update Supabase for further investigation.
        }
      }
    ),
  getAttendanceView: protectedProcedure
    .input(attendanceViewInputSchema)
    .query(async ({ input: { eventDate, eventTitle }, ctx }) => {
      if (isE2EServer()) {
        return getE2EAttendanceViewResponse();
      }

      const userEmail = ctx.session.user.email;
      if (!userEmail) {
        const error = new TRPCError({
          code: "UNAUTHORIZED",
          message: "User email is required to view attendance.",
        });
        captureException(error, {
          extra: { userEmail, eventDate, eventTitle },
        });
        throw error;
      }

      const allowlist = await fetchAttendanceViewAllowlist();
      if (!isEmailAllowlisted(allowlist, userEmail)) {
        const error = new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to view attendance.",
        });
        captureException(error, {
          extra: { userEmail, eventDate, eventTitle },
        });
        throw error;
      }

      let membersRows: (string | number | boolean | null)[][] = [];
      let responsesRows: (string | number | boolean | null)[][] = [];
      let userEventTypes;

      try {
        [membersRows, responsesRows, userEventTypes] = await Promise.all([
          getSheetMembers({ retry: true, maxRetries: 3 }),
          getSheetResponses({ retry: true, maxRetries: 3 }),
          getUserEventTypeAssignments({ retry: true, maxRetries: 3 }),
        ]);
      } catch (error) {
        const errorId = randomUUID();
        const googleErrorInfo = getGoogleApiErrorInfo(error);
        console.error("Failed to load attendance data from Sheets:", error);
        captureException(error, {
          tags: {
            errorId,
            googleApi: "sheets",
            operation: "getAttendanceView",
          },
          extra: { userEmail, eventDate, eventTitle, googleErrorInfo },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            googleErrorInfo.status === 429
              ? `Google Sheets rate-limited this request. Please try again in a minute. (errorId: ${errorId})`
              : `Unable to load attendance data. Please try again. (errorId: ${errorId})`,
        });
      }

      const members = parseMembersSheet(membersRows);
      const requiredAttendees = eventTitle
        ? map(filter(userEventTypes, { title: eventTitle }), "email")
            .map((email) => email?.toLowerCase())
            .filter(Boolean)
        : [];
      const scopedMembers = eventTitle
        ? filter(members, (member) =>
            includes(requiredAttendees, member.email.toLowerCase())
          )
        : members;
      const responses = parseResponsesSheet(responsesRows);
      const rows = getAttendanceView(
        scopedMembers,
        responses,
        eventDate,
        eventTitle
      );

      const summary = reduce(
        rows,
        (acc, row) => {
          if (row.status === "Going") acc.going += 1;
          if (row.status === "Not Going") acc.notGoing += 1;
          if (row.status === "No Response") acc.noResponse += 1;
          acc.total += 1;
          return acc;
        },
        { going: 0, notGoing: 0, noResponse: 0, total: 0 }
      );

      return { rows, summary };
    }),
});
