/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import ThankYou from "../../pages/thank-you";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "user@example.com" } } }),
}));

jest.mock("../../server/db/useUserStreak", () => ({
  useUserDbData: () => ({
    data: { data: { responseStreak: 1 } },
  }),
}));

jest.mock("../../server/db/catGeneratorConfig", () => {
  const actual = jest.requireActual("../../server/db/catGeneratorConfig");
  return {
    ...actual,
    fetchCatGeneratorConfig: jest.fn().mockResolvedValue({
      ...actual.DEFAULT_CAT_GENERATOR_CONFIG,
      accessStreak: 2,
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("thank-you page", () => {
  it("shows locked message when streak below threshold", async () => {
    render(<ThankYou />, { wrapper });
    expect(
      await screen.findByText(/עוד 1 דיווחים כדי לפתוח את גנרטור החתולים/i)
    ).toBeInTheDocument();
  });
});
