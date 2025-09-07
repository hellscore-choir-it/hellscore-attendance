import { captureException } from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";

import { filter, includes, map } from "lodash";
import {
  attendanceSchema,
  sanitizeText,
} from "../../../utils/attendanceSchema";
import { performUpdateCallbacksSerially } from "../../db/userUpdateSideEffects";
import {
  getUserEventTypeAssignments,
  writeResponseRow,
} from "../../googleApis";
import { protectedProcedure, router } from "../trpc";

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
          throw new Error("user has no email");
        }

        // Retry logic for authorization check via Google Sheets API
        let userEventTypes;
        try {
          userEventTypes = await getUserEventTypeAssignments({
            retry: true,
            maxRetries: 3,
          });
        } catch (error) {
          console.error(
            "Failed to fetch sheet content for authorization check:",
            error
          );
          captureException(error, { extra: { userEmail, eventTitle } });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to verify user permissions. Please try again.",
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
        // No need to await, since the google sheets is currently the source of truth
        performUpdateCallbacksSerially({
          userEmail,
          eventTitle,
          eventDate,
          requiredAttendees,
          going,
          whyNot: sanitizedWhyNot,
          wentLastTime,
          comments: sanitizedComments,
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
          console.error("Failed to write attendance row:", error);
          captureException(error, {
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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to submit attendance. Please try again.",
          });
        }
      }
    ),
});
