// To be able to run tests without depending on Google Calendar API

import type { calendar_v3 } from "googleapis/build/src/apis/calendar/v3";

interface TestEventResponse extends calendar_v3.Schema$Event {
  isTest: true;
}

export const testEvents: TestEventResponse[] = [
  {
    id: "1",
    start: {
      dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
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
