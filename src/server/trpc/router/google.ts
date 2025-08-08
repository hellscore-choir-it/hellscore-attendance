import { TRPCError } from "@trpc/server";
import { captureException } from "@sentry/nextjs";

import { router, protectedProcedure } from "../trpc";
import { getSheetContent, writeResponseRow } from "../../googleApis";
import {
  attendanceSchema,
  sanitizeText,
} from "../../../utils/attendanceSchema";
import { some } from "lodash";

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
        let userEvents;
        try {
          userEvents = await getSheetContent({ retry: true, maxRetries: 3 });
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

        if (!some(userEvents, { title: eventTitle, email: userEmail })) {
          const error = new TRPCError({ code: "UNAUTHORIZED" });
          captureException(error, { extra: { userEmail, userEvents } });
          throw error;
        }

        // Double sanitize text inputs as a safety measure
        const sanitizedWhyNot = sanitizeText(whyNot);
        const sanitizedComments = sanitizeText(comments);

        // Retry logic for writing attendance data
        try {
          await writeResponseRow(
            [
              userEmail,
              Date.now().toString(),
              eventTitle,
              eventDate,
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
