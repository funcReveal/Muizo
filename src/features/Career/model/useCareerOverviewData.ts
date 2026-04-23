import { useMemo } from "react";

import { mockCareerOverviewData } from "../mocks/career.mock";
import type { CareerOverviewQueryResult } from "../types/career";

export const useCareerOverviewData = (): CareerOverviewQueryResult => {
  const data = useMemo(() => mockCareerOverviewData, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
};

export default useCareerOverviewData;
