/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AttendanceForm from "../../components/AttendanceForm";

const baseSession = {
  user: { email: "user@example.com" },
} as any;

describe("AttendanceForm", () => {
  it("auto-selects eventTitle when only one option exists (but not eventDate if multiple dates)", async () => {
    render(
      <AttendanceForm
        calendarData={[
          { title: "Solo Rehearsal", start: "2025-01-01T20:00:00Z" },
          { title: "Solo Rehearsal", start: "2025-01-08T20:00:00Z" },
        ]}
        userEvents={[{ title: "Solo Rehearsal", email: "user@example.com" }]}
        session={baseSession}
      />
    );

    const eventSelect = screen.getByRole("combobox", { name: "אירוע" });
    const dateSelect = screen.getByRole("combobox", { name: "תאריך" });

    await waitFor(() => expect(eventSelect).toHaveValue("Solo Rehearsal"));
    expect(dateSelect).not.toBeDisabled();
    expect(dateSelect).toHaveValue("");
  });

  it("auto-selects eventDate when the chosen title has only one date", async () => {
    render(
      <AttendanceForm
        calendarData={[
          { title: "Rehearsal A", start: "2025-01-01T20:00:00Z" },
          { title: "Rehearsal B", start: "2025-01-08T20:00:00Z" },
        ]}
        userEvents={[
          { title: "Rehearsal A", email: "user@example.com" },
          { title: "Rehearsal B", email: "user@example.com" },
        ]}
        session={baseSession}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: "אירוע" }), {
      target: { value: "Rehearsal A" },
    });

    const dateSelect = screen.getByRole("combobox", { name: "תאריך" });
    await waitFor(() => expect(dateSelect).toHaveValue("2025-01-01T20:00:00Z"));
  });

  it("auto-selects eventTitle and eventDate when both have a single option", async () => {
    render(
      <AttendanceForm
        calendarData={[
          { title: "Only Rehearsal", start: "2025-01-01T20:00:00Z" },
        ]}
        userEvents={[{ title: "Only Rehearsal", email: "user@example.com" }]}
        session={baseSession}
      />
    );

    const eventSelect = screen.getByRole("combobox", { name: "אירוע" });
    const dateSelect = screen.getByRole("combobox", { name: "תאריך" });

    await waitFor(() => expect(eventSelect).toHaveValue("Only Rehearsal"));
    await waitFor(() => expect(dateSelect).toHaveValue("2025-01-01T20:00:00Z"));
  });

  it("disables submit until required selections are made", async () => {
    render(
      <AttendanceForm
        calendarData={[
          { title: "Rehearsal A", start: "2025-01-01T20:00:00Z" },
          { title: "Rehearsal B", start: "2025-01-08T20:00:00Z" },
        ]}
        userEvents={[
          { title: "Rehearsal A", email: "user@example.com" },
          { title: "Rehearsal B", email: "user@example.com" },
        ]}
        session={baseSession}
      />
    );

    const submitButton = screen.getByRole("button", { name: "שלח/י טופס 🚀" });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: "אירוע" }), {
      target: { value: "Rehearsal A" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "תאריך" }), {
      target: { value: "2025-01-01T20:00:00Z" },
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it("renders no-events message when user has no relevant assignments", () => {
    render(
      <AttendanceForm calendarData={[]} userEvents={[]} session={baseSession} />
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
    expect(screen.getByText(/נשמח לשמוע למה לא תגיעו/i)).toBeInTheDocument();

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
    trpcMock.__mock.mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

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

    const submitButton = screen.getByRole("button", { name: "שלח/י טופס 🚀" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/thank-you");
    });
  });

  it("shows a friendly rate-limit message with errorId", async () => {
    const mockMutate = jest
      .fn()
      .mockRejectedValue(
        new Error(
          "INTERNAL_SERVER_ERROR: Google Sheets rate-limited this request. Please try again in a minute. (errorId: 123e4567-e89b-12d3-a456-426614174000)"
        )
      );
    const trpcMock = require("../../utils/trpc");
    trpcMock.__mock.mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const notistackMock = require("notistack");
    notistackMock.__mock.enqueueSnackbar.mockClear();

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

    const submitButton = screen.getByRole("button", { name: "שלח/י טופס 🚀" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(notistackMock.__mock.enqueueSnackbar).toHaveBeenCalled();
    });

    const firstArg = notistackMock.__mock.enqueueSnackbar.mock.calls[0][0];
    expect(firstArg.props.title).toMatch(/שגיאה בשליחת הטופס/);
    expect(firstArg.props.details).toMatch(/Google Sheets עמוס/);
    expect(firstArg.props.details).toMatch(
      /Reference: 123e4567-e89b-12d3-a456-426614174000/
    );
  });

  it("shows a friendly network error message on Failed to fetch", async () => {
    const mockMutate = jest
      .fn()
      .mockRejectedValue(new Error("Failed to fetch"));
    const trpcMock = require("../../utils/trpc");
    trpcMock.__mock.mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const notistackMock = require("notistack");
    notistackMock.__mock.enqueueSnackbar.mockClear();

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

    const submitButton = screen.getByRole("button", { name: "שלח/י טופס 🚀" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(notistackMock.__mock.enqueueSnackbar).toHaveBeenCalled();
    });

    const firstArg = notistackMock.__mock.enqueueSnackbar.mock.calls[0][0];
    expect(firstArg.props.details).toMatch(/בעיית תקשורת זמנית/);
  });
});
