import { InferGetStaticPropsType } from "next";
import { Session } from "next-auth";
import { useEffect, useMemo } from "react";
import {
  filter,
  first,
  includes,
  isString,
  map,
  size,
  some,
  uniq,
} from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useForm, UseFormProps } from "react-hook-form";
import { captureException } from "@sentry/nextjs";

import { trpc } from "../utils/trpc";
import { attendanceSchema, sanitizeText } from "../utils/attendanceSchema";
import { getStaticProps } from "../pages/index";
import { ErrorAccordion } from "./ErrorAccordion";

function useZodForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema;
  }
) {
  const form = useForm<TSchema["_input"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}

const AttendanceForm = ({
  calendarData,
  userEvents,
  session,
}: InferGetStaticPropsType<typeof getStaticProps> & { session: Session }) => {
  const submitRow = trpc.google.submitAttendance.useMutation();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { handleSubmit, watch, register, formState, setValue } = useZodForm({
    schema: attendanceSchema,
  });
  const relevantTitles = useMemo(
    () =>
      map(
        filter(
          userEvents,
          ({ isTest, email }) => isTest || email === session.user?.email
        ),
        "title"
      ),
    [userEvents, session]
  );
  const relevantEvents = useMemo(
    () =>
      filter(
        calendarData,
        ({ title }) =>
          Boolean(title) && includes(relevantTitles, title as string)
      ),
    [calendarData, relevantTitles]
  );
  const sortedRelevantTitles = useMemo(
    () => uniq(map(relevantEvents, ({ title }) => title)),
    [relevantEvents]
  );
  const relevantDates = map(
    filter(
      relevantEvents,
      ({ title }) => title === (watch("eventTitle") || sortedRelevantTitles[0])
    ),
    "start"
  );
  const nextDate = first(relevantDates);
  useEffect(() => {
    if (nextDate) setValue("eventDate", nextDate);
  }, [setValue, nextDate]);
  const showWhyNot = !watch("going");
  if (!size(relevantTitles)) {
    return <p>לא נמצאו אירועים רלוונטיים עבורך ({session.user?.email})!</p>;
  }
  if (formState.isSubmitting || formState.isSubmitted) {
    return <h2 className="animate-spin text-center text-3xl">👻</h2>;
  }
  return (
    <form
      className="form-control mx-auto items-start gap-4 text-xl"
      onSubmit={handleSubmit(async (values) => {
        let sanitizedValues = values;
        try {
          // Sanitize text inputs before submission
          sanitizedValues = {
            ...values,
            whyNot: sanitizeText(values.whyNot),
            comments: sanitizeText(values.comments),
          };

          await submitRow.mutateAsync(sanitizedValues);
          enqueueSnackbar("נוכחותך נרשמה!", { variant: "success" });
          router.push("/thank-you");
        } catch (error) {
          console.error("Error submitting attendance:", error);
          const errorText =
            error instanceof Error
              ? error.message
              : isString(error)
              ? error
              : "Unknown error occurred";
          const isUnknownUserError = includes(errorText, "UNAUTHORIZED");

          captureException(error, {
            extra: {
              values,
              sanitizedValues,
              formState,
              userEmail: session.user?.email,
              isUnknownUserError,
              errorText,
            },
          });
          enqueueSnackbar(
            <ErrorAccordion
              title="שגיאה בשליחת הטופס"
              details={
                isUnknownUserError
                  ? "נראה שאין לך הרשאות לשלוח טופס זה. אנא פנה למנהל.ת המערכת."
                  : error instanceof Error
                  ? error.message
                  : JSON.stringify(error)
              }
            />,
            { variant: "error" }
          );
        }
      })}
    >
      <label>
        <div className="pb-2 text-red-200">אירוע</div>
        <select
          className="select select-bordered"
          {...register("eventTitle", { required: true })}
        >
          {map(sortedRelevantTitles, (title) => (
            <option value={title} key={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <div className="pb-2 text-red-200">תאריך</div>
        <select
          className="select select-bordered"
          {...register("eventDate", { required: true })}
        >
          {map(
            relevantDates,
            (date) =>
              Boolean(date) && (
                <option value={date as string} key={date}>
                  {date}
                </option>
              )
          )}
        </select>
      </label>
      <label className="cursor-pointer">
        <div className="pb-2 text-red-200">האם את/ה מגיע/ה?</div>
        <input type="checkbox" className="toggle" {...register("going")} />
      </label>
      <label className="cursor-pointer">
        <div className="pb-2 text-red-200">האם הגעת פעם שעברה?</div>
        <input
          type="checkbox"
          className="toggle"
          {...register("wentLastTime")}
        />
      </label>
      {showWhyNot && (
        <label>
          <div className="pb-2 text-red-200">נשמח לשמוע למה לא תגיעו 🙂</div>
          <input
            className="input input-bordered"
            {...register("whyNot")}
          ></input>
        </label>
      )}
      <label>
        <div className="pb-2 text-red-200">הערות נוספות?</div>
        <input
          className="input input-bordered"
          {...register("comments")}
        ></input>
      </label>
      <button className="btn self-center bg-green-800 px-20">שלח/י טופס 🚀</button>
    </form>
  );
};

export default AttendanceForm;
