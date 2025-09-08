import { captureException, captureMessage } from "@sentry/nextjs";
import { fromPairs, map } from "lodash";

import { calculateSHA256Hash } from "../../utils/sha265";
import { createClient } from "../../utils/supabase/client";
import {
  generateSupabaseEventId,
  generateSupabaseUserId,
  type SupabaseEvent,
  type SupabaseUser,
} from "./schema";

/**
 * Updates the event state in the database
 * @param object - The parameters for updating the event state.
 * @param object.userEmail - The email of the user.
 * @param object.userEvents - The events the user is associated with.
 * @param object.eventTitle - The title of the event.
 * @param object.eventDate - The date of the event.
 * @param object.requiredAttendees - The attendees required for the event.
 */
const updateDbEventsStateForUserUpdate = async ({
  userEmail,
  eventTitle,
  eventDate,
  requiredAttendees,
}: {
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  requiredAttendees: string[];
}) => {
  const supabase = await createClient();
  const supabaseEventId = generateSupabaseEventId({ eventDate, eventTitle });
  const { data: supabaseEvent, error: supabaseError } = await supabase
    .from("event")
    .select("*")
    .eq("id", supabaseEventId)
    .maybeSingle<SupabaseEvent>();

  if (supabaseError) {
    console.error("Error fetching events from Supabase:", supabaseError);
    captureException(supabaseError, {
      extra: { eventTitle, eventDate, supabaseEventId },
    });
  }

  const currentDate = new Date().toISOString();
  const eventType = eventTitle; // Currently the event type is the same as the title, but this may change in the future
  if (!supabaseEvent) {
    // Add event to Supabase
    const { error: insertError } = await supabase
      .from("event")
      .insert<SupabaseEvent>({
        id: supabaseEventId,
        created_at: currentDate,
        modified_at: currentDate,
        data: {
          title: eventTitle,
          type: eventType,
          date: eventDate,
          requiredParticipantsSentResponse: fromPairs(
            map(requiredAttendees, (email) => [
              generateSupabaseUserId(email),
              userEmail === email,
            ])
          ),
        },
      });
    if (insertError) {
      console.error("Error adding event to Supabase:", insertError);
      captureException(insertError, {
        extra: {
          userEmail,
          requiredAttendees,
          eventTitle,
          eventType,
          eventDate,
          supabaseEventId,
        },
      });
    }
  } else {
    // Event already exists, update requiredParticipantsSentResponse
    // and required attendees based on current user events
    const { error: updateError } = await supabase
      .from("event")
      .update<Partial<SupabaseEvent>>({
        modified_at: currentDate,
        data: {
          ...(supabaseEvent?.data || {}),
          title: eventTitle,
          type: eventType,
          requiredParticipantsSentResponse: fromPairs(
            map(requiredAttendees, (email) => [
              calculateSHA256Hash(email),
              userEmail === email ||
                Boolean(
                  supabaseEvent?.data?.requiredParticipantsSentResponse?.[
                    calculateSHA256Hash(email)
                  ]
                ),
            ])
          ),
        },
      })
      .eq("id", supabaseEvent.id);

    if (updateError) {
      console.error("Error updating event in Supabase:", updateError);
      captureException(updateError, {
        extra: {
          userEmail,
          requiredAttendees,
          eventTitle,
          eventType,
          eventDate,
          supabaseEvent,
          supabaseEventId,
        },
      });
    }
  }
};

const updateUserResponseAndStreaks = async ({
  userEmail,
  eventTitle,
  eventDate,
  going,
  whyNot,
  wentLastTime,
  comments,
}: {
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  going: boolean;
  whyNot: string;
  wentLastTime: boolean;
  comments: string;
}) => {
  const currentDate = new Date().toISOString();
  const supabase = await createClient();

  const supabaseUserId = generateSupabaseUserId(userEmail);
  const supabaseEventId = generateSupabaseEventId({ eventDate, eventTitle });

  const eventType = eventTitle; // Currently the event type is the same as the title, but this may change in the future
  const responsePath = `data->'requiredParticipantsSentResponse'->>'${supabaseUserId}'`;
  const { data: lastEventOfTypeForUser, error: lastEventError } = await supabase
    .from("event")
    .select("*")
    // Get events of the specified type
    .eq("data->>'type'", eventType)
    // Get events before the current date
    .lt("data->>'date'::timestamptz", currentDate)
    // Exclude events where the user was not required to respond
    .not(responsePath, "is", null)
    // Get the most recent event
    .order("data->>'date'", { ascending: false })
    .maybeSingle<SupabaseEvent>();

  if (lastEventError) {
    console.error("Error fetching last event for user:", lastEventError);
    captureException(lastEventError, {
      extra: { userEmail, eventTitle, eventType, eventDate, supabaseUserId },
    });
  }

  const { data: currentEvent, error: currentEventError } = await supabase
    .from("event")
    .select("*")
    .eq("id", supabaseEventId)
    .maybeSingle<SupabaseEvent>();

  if (currentEventError) {
    console.error("Error fetching current event:", currentEventError);
    captureException(currentEventError, {
      extra: { userEmail, eventTitle, eventType, eventDate, supabaseUserId },
    });
  }

  const didUserRespondToLastEvent =
    // This is the user's first event
    !lastEventOfTypeForUser ||
    // The user has responded to the last event
    Boolean(
      lastEventOfTypeForUser?.data?.requiredParticipantsSentResponse?.[
        supabaseUserId
      ]
    );

  const { data: userEntry, error: userEntryError } = await supabase
    .from("user")
    .select("*")
    .eq("id", supabaseUserId)
    .maybeSingle<SupabaseUser>();

  if (userEntryError) {
    console.error("Error fetching user entry from Supabase:", userEntryError);
    captureException(userEntryError, {
      extra: { userEmail },
    });
  }

  // Update user response
  if (userEntry) {
    const failedToCheckForLastEvent = Boolean(lastEventError);
    const failedToGetCurrentEvent = !currentEvent;
    const userAlreadyRespondedToCurrentEvent = Boolean(
      currentEvent?.data?.requiredParticipantsSentResponse?.[supabaseUserId]
    );

    const skipUpdateStreak =
      failedToCheckForLastEvent ||
      failedToGetCurrentEvent ||
      userAlreadyRespondedToCurrentEvent;
    if (!skipUpdateStreak && !didUserRespondToLastEvent) {
      captureMessage("User did not respond to last event, resetting streak", {
        extra: {
          userEmail,
          eventTitle,
          eventType,
          eventDate,
          supabaseUserId,
          lastEventOfTypeForUser,
        },
      });
    }

    const newStreak = skipUpdateStreak
      ? userEntry.data?.responseStreak || 0
      : didUserRespondToLastEvent
      ? (userEntry.data?.responseStreak || 0) + 1
      : 0;

    const didReset = newStreak === 0;

    const { error: updateError } = await supabase
      .from("user")
      .update<Partial<SupabaseUser>>({
        modified_at: currentDate,
        data: {
          ...(userEntry.data || {}),
          responseStreak: newStreak,
          maxStreak: Math.max(userEntry.data?.maxStreak || 0, newStreak),
          streakUpdates: [
            ...(userEntry.data?.streakUpdates || []),
            {
              date: currentDate,
              missingEventId: lastEventOfTypeForUser?.id!,
              previousStreak: userEntry.data?.responseStreak || 0,
              newStreak,
              reason: failedToCheckForLastEvent
                ? "Failed to check for last event"
                : failedToGetCurrentEvent
                ? "Failed to get current event"
                : userAlreadyRespondedToCurrentEvent
                ? "User already responded to current event"
                : didUserRespondToLastEvent
                ? "User responded to event"
                : "User did not respond to event",
            },
          ],
          streakResetDate: didReset
            ? currentDate
            : userEntry?.data?.streakResetDate,
          responses: {
            ...(userEntry.data?.responses || {}),
            [supabaseEventId]: [
              ...(userEntry.data?.responses[supabaseEventId] || []),
              {
                going,
                whyNot,
                wentLastTime,
                comments,
                responseTime: currentDate,
              },
            ],
          },
        },
      })
      .eq("id", userEntry.id)
      .select();

    if (updateError) {
      console.error("Error updating user entry in Supabase:", updateError);
      captureException(updateError, {
        extra: {
          supabaseUserId,
          userEntry,
          userEmail,
          going,
          whyNot,
          wentLastTime,
          comments,
          currentDate,
          supabaseEventId,
        },
      });
    }
  } else {
    // Create a new user entry
    const { error: insertError } = await supabase
      .from("user")
      .insert<SupabaseUser>({
        id: supabaseUserId,
        created_at: currentDate,
        modified_at: currentDate,
        data: {
          responseStreak: 1,
          maxStreak: 1,
          streakResetDate: null,
          streakUpdates: [],
          responses: {
            [supabaseEventId]: [
              {
                going,
                whyNot,
                wentLastTime,
                comments,
                responseTime: currentDate,
              },
            ],
          },
        },
      });

    if (insertError) {
      console.error("Error creating user entry in Supabase:", insertError);
      captureException(insertError, {
        extra: {
          supabaseUserId,
          eventTitle,
          eventType,
          eventDate,
          userEmail,
          going,
          whyNot,
          wentLastTime,
          comments,
          currentDate,
          supabaseEventId,
        },
      });
    }
  }
};

export const performUpdateCallbacksSerially = async ({
  userEmail,
  eventTitle,
  eventDate,
  requiredAttendees,
  going,
  whyNot,
  wentLastTime,
  comments,
}: Parameters<typeof updateDbEventsStateForUserUpdate>[0] &
  Parameters<typeof updateUserResponseAndStreaks>[0]) => {
  await updateDbEventsStateForUserUpdate({
    userEmail,
    eventTitle,
    eventDate,
    requiredAttendees,
  });
  await updateUserResponseAndStreaks({
    userEmail,
    eventTitle,
    eventDate,
    going,
    whyNot,
    wentLastTime,
    comments,
  });
};
