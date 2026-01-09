/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import AttendanceForm from "../../components/AttendanceForm";

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

jest.mock("../../utils/trpc", () => ({
  trpc: {
    google: {
      submitAttendance: {
        useMutation: () => ({ mutateAsync: jest.fn() }),
      },
    },
  },
}));

const baseSession = {
  user: { email: "user@example.com" },
} as any;

describe("AttendanceForm", () => {
  it("renders no-events message when user has no relevant assignments", () => {
    render(
      <AttendanceForm
        calendarData={[]}
        userEvents={[]}
        session={baseSession}
      />
    );

    expect(
      screen.getByText(/לא נמצאו אירועים רלוונטיים עבורך/i)
    ).toBeInTheDocument();
  });

  it("toggles why-not field visibility based on going checkbox", () => {
    const calendarData = [
      { title: "Rehearsal", start: "2025-01-01T20:00:00Z" },
    ];
    const userEvents = [{ title: "Rehearsal", email: "user@example.com" }];

    render(
      <AttendanceForm
        calendarData={calendarData}
        userEvents={userEvents}
        session={baseSession}
      />
    );

    // Initially shown
    expect(
      screen.getByText(/נשמח לשמוע למה לא תגיעו/i)
    ).toBeInTheDocument();

    const goingToggle = screen.getByRole("checkbox", {
      name: /האם את\/ה מגיע\/ה/i,
    });
    fireEvent.click(goingToggle);

    expect(
      screen.queryByText(/נשמח לשמוע למה לא תגיעו/i)
    ).not.toBeInTheDocument();
  });
});
