import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_CAT_GENERATOR_CONFIG,
  fetchCatGeneratorConfig,
} from "../server/db/catGeneratorConfig";

export const useCatGeneratorConfigQuery = () =>
  useQuery(
    ["cat-generator-config"],
    fetchCatGeneratorConfig,
    {
      initialData: DEFAULT_CAT_GENERATOR_CONFIG,
      staleTime: 5 * 60 * 1000,
    },
  );
