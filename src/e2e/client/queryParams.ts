import { isE2EClient } from "../mode";

export const getE2EQueryParam = (key: string) => {
  if (!isE2EClient()) return null;
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  return value && value.trim().length > 0 ? value.trim() : null;
};

export const getE2EEmailFromQuery = () => getE2EQueryParam("e2eEmail");
