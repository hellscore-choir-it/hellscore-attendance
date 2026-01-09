/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import React from "react";

import { StreakTracker } from "../../components/StreakTracker";
import { useUserDbData } from "../../server/db/useUserStreak";

jest.mock("../../server/db/useUserStreak");

describe("StreakTracker", () => {
  it("renders loading state", () => {
    (useUserDbData as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
    });

    render(<StreakTracker userEmail="user@example.com" />);
    expect(screen.getByText(/טוען/)).toBeInTheDocument();
  });

  it("shows streak count when available", () => {
    (useUserDbData as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { data: { responseStreak: 3 } },
    });

    render(<StreakTracker userEmail="user@example.com" />);

    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(
      screen.getByText(/דיווחת על/i)
    ).toBeInTheDocument();
  });
});
