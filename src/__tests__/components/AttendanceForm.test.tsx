/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

import AttendanceForm from "../../components/AttendanceForm";

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

  it("submits the form and navigates to thank-you", async () => {
    const mockPush = jest.fn();
    const mockMutate = jest.fn().mockResolvedValue({});
    const routerMock = require("next/router");
    routerMock.useRouter.mockReturnValue({ push: mockPush });

    const trpcMock = require("../../utils/trpc");
    trpcMock.__mock.mockMutate.mockResolvedValue({});
    trpcMock.__mock.mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    render(
      <AttendanceForm
        calendarData={[{ title: "Rehearsal", start: "2025-01-01T20:00:00Z" }]}
        userEvents={[{ title: "Rehearsal", email: "user@example.com" }]}
        session={baseSession}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: "אירוע" }), {
      target: { value: "Rehearsal" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "תאריך" }), {
      target: { value: "2025-01-01T20:00:00Z" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /האם את\/ה מגיע\/ה/ })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /האם הגעת פעם שעברה/ })
    );
    fireEvent.change(screen.getByRole("textbox", { name: /הערות נוספות/ }), {
      target: { value: "See you there" },
    });

    fireEvent.click(screen.getByRole("button", { name: "שלח/י טופס 🚀" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/thank-you");
    });
  });
});
