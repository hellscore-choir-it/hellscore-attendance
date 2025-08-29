import { split } from "lodash";
import { calculateSHA256Hash } from "../../utils/sha265";

export const idSeparator = "||";

export const generateSupabaseEventId = ({
  eventDate,
  eventTitle,
}: {
  eventDate: string;
  eventTitle: string;
}) => `${eventDate}${idSeparator}${eventTitle}`;

export const supabaseEventIdToDetails = (id: string) => {
  const [eventDate, eventTitle] = split(id, idSeparator, 2);
  return { eventDate, eventTitle };
};

export interface SupabaseEvent {
  id: string;
  created_at: string;
  modified_at: string;
  data: {
    title: string;
    type: string;
    date: string;
    // Map user IDs who were expected to respond to the event to whether they actually did
    requiredParticipantsSentResponse: Record<string, boolean>;
  };
}

export const generateSupabaseUserId = (userEmail: string) =>
  calculateSHA256Hash(userEmail);

export interface UserEventResponse {
  going: boolean;
  whyNot: string;
  wentLastTime: boolean;
  comments?: string;
}
export interface SupabaseUser {
  id: string;
  created_at: string;
  modified_at: string;
  data: {
    responses: Record<string, UserEventResponse>;
    responseStreak: number;
    maxStreak: number;
    streakResetDate?: string | null;
  };
}
