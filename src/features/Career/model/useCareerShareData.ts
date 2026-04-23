import { useMemo, useState } from "react";

import {
  mockCareerShareCaptions,
  mockCareerShareCardBase,
} from "../mocks/career.mock";
import type {
  CareerShareCardData,
  CareerShareQueryResult,
  CareerShareTemplate,
} from "../types/career";

const buildPreviewByTemplate = (
  template: CareerShareTemplate,
): CareerShareCardData => {
  if (template === "weekly") {
    return {
      ...mockCareerShareCardBase,
      descriptor: "本週成長摘要",
      highlightTitle: "本週總分成長",
      highlightValue: "+1,980",
      highlightSubtitle: "最近 7 場相較前 7 場",
    };
  }

  if (template === "highlight") {
    return {
      ...mockCareerShareCardBase,
      descriptor: "高光單場",
      highlightTitle: "近期最佳單場",
      highlightValue: "9,820",
      highlightSubtitle: "J-POP Night Mix · 1/8",
    };
  }

  return mockCareerShareCardBase;
};

export const useCareerShareData = (): CareerShareQueryResult => {
  const [activeTemplate, setActiveTemplate] =
    useState<CareerShareTemplate>("career");

  const templates = useMemo(
    () => [
      {
        key: "career" as const,
        label: "生涯版",
        description: "總覽型分享卡",
      },
      {
        key: "weekly" as const,
        label: "本週版",
        description: "近況與 delta",
      },
      {
        key: "highlight" as const,
        label: "高光版",
        description: "單場代表作",
      },
    ],
    [],
  );

  const preview = useMemo(
    () => buildPreviewByTemplate(activeTemplate),
    [activeTemplate],
  );

  const caption = useMemo(
    () => mockCareerShareCaptions[activeTemplate],
    [activeTemplate],
  );

  return {
    activeTemplate,
    setActiveTemplate,
    templates,
    preview,
    caption,
    isLoading: false,
    error: null,
  };
};

export default useCareerShareData;
