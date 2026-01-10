import { QueryFunction, useQuery } from "@tanstack/react-query";

import {
  DEFAULT_CAT_GENERATOR_CONFIG,
  fetchCatGeneratorConfig,
  type CatGeneratorConfig,
} from "../server/db/catGeneratorConfig";

const catGeneratorConfigQuery: QueryFunction<
  CatGeneratorConfig,
  ["cat-generator-config"]
> = ({ signal }) => fetchCatGeneratorConfig(signal);

export const useCatGeneratorConfigQuery = () =>
  useQuery(
    ["cat-generator-config"],
    catGeneratorConfigQuery,
    {
      initialData: DEFAULT_CAT_GENERATOR_CONFIG,
      staleTime: 5 * 60 * 1000,
    },
  );
