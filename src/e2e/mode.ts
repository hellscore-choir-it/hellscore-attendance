export const isE2EServer = () => process.env.E2E_TEST_MODE === "true";

export const isE2EClient = () =>
  process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
