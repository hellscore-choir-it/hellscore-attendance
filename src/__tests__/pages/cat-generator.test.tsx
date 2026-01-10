/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import CatGeneratorPage from "../../pages/cat-generator";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "user@example.com" } } }),
}));

jest.mock("../../server/db/useUserStreak", () => ({
  useUserDbData: () => ({
    data: { data: { responseStreak: 0 } },
  }),
}));

jest.mock("../../server/db/catGeneratorConfig", () => {
  const actual = jest.requireActual("../../server/db/catGeneratorConfig");
  return {
    ...actual,
    DEFAULT_CAT_GENERATOR_CONFIG: {
      ...actual.DEFAULT_CAT_GENERATOR_CONFIG,
      accessStreak: 2,
    },
    computeCatGeneratorEligibility: actual.computeCatGeneratorEligibility,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("cat-generator page gating", () => {
  it("shows locked state when streak below threshold", () => {
    render(<CatGeneratorPage />, { wrapper });
    expect(
      screen.getByText(/עוד 2 דיווחים כדי לפתוח את מחולל החתולים/i)
    ).toBeInTheDocument();
  });
});
