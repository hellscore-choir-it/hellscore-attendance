import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import {
  filter,
  first,
  includes,
  isError,
  isString,
  map,
  size,
  uniq,
} from "lodash";
import { InferGetStaticPropsType } from "next";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useMemo } from "react";
import { useForm, UseFormProps } from "react-hook-form";
import { z } from "zod";

import { getStaticProps } from "../pages/index";
import { attendanceSchema, sanitizeText } from "../utils/attendanceSchema";
import { ISOToHuman } from "../utils/dates";
import { trpc } from "../utils/trpc";
import { ErrorAccordion } from "./ErrorAccordion";

const extractErrorText = (error: unknown): string => {
  if (isError(error)) return error.message;
  if (isString(error)) return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error occurred";
  }
};

const extractErrorId = (errorText: string): string | undefined => {
  const match = errorText.match(/errorId:\s*([a-zA-Z0-9-]+)/i);
  return match?.[1];
};

const formatSubmitAttendanceErrorDetails = (errorText: string): string => {
  const errorId = extractErrorId(errorText);
  const withRef = (text: string) =>
    errorId ? `${text}\n\nReference: ${errorId}` : text;

  if (includes(errorText, "UNAUTHORIZED")) {
    return withRef(
      "נראה שאין לך הרשאות לשלוח טופס זה. אנא פנה/י למנהל.ת המערכת."
    );
  }

  if (includes(errorText, "Failed to fetch")) {
    return withRef("הייתה בעיית תקשורת זמנית עם השרת. נסו שוב בעוד רגע.");
  }

  if (
    /rate-?limited/i.test(errorText) ||
    includes(errorText, " 429") ||
    includes(errorText, "status 429")
  ) {
    return withRef("Google Sheets עמוס כרגע (Rate Limit). נסו שוב בעוד דקה.");
  }

  if (/Google Sheets/i.test(errorText)) {
    return withRef("יש בעיה זמנית מול Google Sheets. נסו שוב.");
  }

  return withRef(errorText);
};

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
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      eventTitle: "",
      eventDate: "",
      going: false,
      wentLastTime: false,
      whyNot: "",
      comments: "",
    },
  });
  const relevantTitles = useMemo(
    () => map(filter(userEvents, { email: session?.user?.email }), "title"),
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
    () => uniq(map(relevantEvents, "title")),
    [relevantEvents]
  );
  const selectedEventTitle = watch("eventTitle");
  const selectedEventDate = watch("eventDate");

  useEffect(() => {
    // If the currently selected title is no longer available (e.g. props changed), clear it.
    if (
      selectedEventTitle &&
      !includes(sortedRelevantTitles, selectedEventTitle)
    ) {
      setValue("eventTitle", "");
      return;
    }

    // If there's only one possible event, auto-select it.
    if (!selectedEventTitle && size(sortedRelevantTitles) === 1) {
      setValue("eventTitle", sortedRelevantTitles[0] as string);
    }
  }, [setValue, selectedEventTitle, sortedRelevantTitles]);

  const relevantDates = useMemo(() => {
    if (!selectedEventTitle) return [];
    return map(
      filter(relevantEvents, ({ title }) => title === selectedEventTitle),
      "start"
    ).filter(Boolean) as string[];
  }, [relevantEvents, selectedEventTitle]);

  const numDates = size(relevantDates);
  const nextDate = first(relevantDates);
  useEffect(() => {
    // If no title selected, do not allow a date to remain selected.
    if (!selectedEventTitle) {
      if (selectedEventDate) setValue("eventDate", "");
      return;
    }

    // If there's only one rehearsal date for the selected title, auto-pick it.
    if (nextDate && numDates === 1) {
      if (selectedEventDate !== nextDate) setValue("eventDate", nextDate);
      return;
    }

    // If multiple dates exist, ensure the chosen date belongs to this title.
    if (selectedEventDate && !includes(relevantDates, selectedEventDate)) {
      setValue("eventDate", "");
    }
  }, [
    setValue,
    selectedEventTitle,
    selectedEventDate,
    nextDate,
    numDates,
    relevantDates,
  ]);
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
          const errorText = extractErrorText(error);
          const isUnknownUserError = includes(errorText, "UNAUTHORIZED");
          const details = formatSubmitAttendanceErrorDetails(errorText);

          captureException(error, {
            extra: {
              values,
              sanitizedValues,
              formState,
              userEmail: session.user?.email,
              isUnknownUserError,
              errorText,
              extractedErrorId: extractErrorId(errorText),
            },
          });
          enqueueSnackbar(
            <ErrorAccordion title="שגיאה בשליחת הטופס" details={details} />,
            { variant: "error" }
          );
        }
      })}
    >
      <label>
        <div className="dark:text-hell-glow pb-2">אירוע</div>
        <select
          className="select select-bordered"
          {...register("eventTitle", { required: true })}
        >
          <option value="" disabled>
            בחר/י אירוע...
          </option>
          {map(sortedRelevantTitles, (title) => (
            <option value={title} key={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <div className="dark:text-hell-glow pb-2">תאריך</div>
        <select
          className="select select-bordered"
          disabled={!selectedEventTitle}
          {...register("eventDate", { required: true })}
        >
          <option value="" disabled>
            בחר/י תאריך...
          </option>
          {map(
            relevantDates,
            (date) =>
              Boolean(date) && (
                <option value={date as string} key={date}>
                  {ISOToHuman(date)}
                </option>
              )
          )}
        </select>
      </label>
      <label className="cursor-pointer">
        <div className="dark:text-hell-glow pb-2">האם את/ה מגיע/ה?</div>
        <input type="checkbox" className="toggle" {...register("going")} />
      </label>
      <label className="cursor-pointer">
        <div className="dark:text-hell-glow pb-2">האם הגעת פעם שעברה?</div>
        <input
          type="checkbox"
          className="toggle"
          {...register("wentLastTime")}
        />
      </label>
      {showWhyNot && (
        <label>
          <div className="dark:text-hell-glow pb-2">
            נשמח לשמוע למה לא תגיעו 🙂
          </div>
          <input
            className="input input-bordered"
            {...register("whyNot")}
          ></input>
        </label>
      )}
      <label>
        <div className="dark:text-hell-glow pb-2">הערות נוספות?</div>
        <input
          className="input input-bordered"
          {...register("comments")}
        ></input>
      </label>
      <button
        className="btn self-center bg-green-800 px-20"
        disabled={!formState.isValid || submitRow.isLoading}
      >
        שלח/י טופס 🚀
      </button>
    </form>
  );
};

export default AttendanceForm;
