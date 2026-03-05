import { useMemo } from "react";

import type { SettlementTrackLink } from "../../../model/settlementLinks";
import type { SettlementQuestionRecap } from "../GameSettlementPanel";

type RecapAnswerResult = "correct" | "wrong" | "unanswered";

interface RecapAnswerSnapshot {
  choiceIndex: number | null;
  result: RecapAnswerResult;
  answeredAtMs: number | null;
}

interface UseSettlementRecapSelectionStateParams<TRecap extends SettlementQuestionRecap> {
  normalizedRecaps: TRecap[];
  reviewPage: number;
  recapsPerPage: number;
  selectedRecapKey: string | null;
  effectiveSelectedReviewParticipantClientId: string | null;
  meClientId?: string;
  resolveParticipantResult: (
    recap: SettlementQuestionRecap,
    participantClientId: string | null,
    meClientId?: string,
  ) => RecapAnswerResult;
  resolveParticipantAnswer: (
    recap: SettlementQuestionRecap,
    participantClientId: string | null,
    meClientId?: string,
  ) => {
    choiceIndex: number | null;
    result: SettlementQuestionRecap["myResult"];
    answeredAtMs: number | null;
  };
  resolveCorrectAnsweredRank: (
    recap: SettlementQuestionRecap,
    participantClientId: string | null,
  ) => number | null;
  buildRecommendationLink: (recap: TRecap) => SettlementTrackLink | null;
}

interface UseSettlementRecapSelectionStateResult<TRecap extends SettlementQuestionRecap> {
  reviewRecapSummary: {
    correct: number;
    wrong: number;
    unanswered: number;
  };
  reviewPageCount: number;
  safeReviewPage: number;
  pagedRecaps: TRecap[];
  effectiveSelectedRecapKey: string | null;
  selectedRecap: TRecap | null;
  selectedRecapLink: SettlementTrackLink | null;
  selectedRecapAnswer: RecapAnswerSnapshot;
  selectedRecapCorrectRank: number | null;
  reviewContextTransitionKey: string;
  reviewDetailTransitionKey: string;
}

const useSettlementRecapSelectionState = <
  TRecap extends SettlementQuestionRecap,
>({
  normalizedRecaps,
  reviewPage,
  recapsPerPage,
  selectedRecapKey,
  effectiveSelectedReviewParticipantClientId,
  meClientId,
  resolveParticipantResult,
  resolveParticipantAnswer,
  resolveCorrectAnsweredRank,
  buildRecommendationLink,
}: UseSettlementRecapSelectionStateParams<TRecap>): UseSettlementRecapSelectionStateResult<TRecap> => {
  const reviewRecapSummary = useMemo(() => {
    const summary = {
      correct: 0,
      wrong: 0,
      unanswered: 0,
    };
    for (const recap of normalizedRecaps) {
      const result = resolveParticipantResult(
        recap,
        effectiveSelectedReviewParticipantClientId,
        meClientId,
      );
      summary[result] += 1;
    }
    return summary;
  }, [
    effectiveSelectedReviewParticipantClientId,
    meClientId,
    normalizedRecaps,
    resolveParticipantResult,
  ]);

  const reviewPageCount = Math.max(
    1,
    Math.ceil(normalizedRecaps.length / recapsPerPage),
  );
  const safeReviewPage = Math.min(reviewPage, Math.max(0, reviewPageCount - 1));

  const pagedRecaps = useMemo(() => {
    const start = safeReviewPage * recapsPerPage;
    return normalizedRecaps.slice(start, start + recapsPerPage);
  }, [normalizedRecaps, recapsPerPage, safeReviewPage]);

  const effectiveSelectedRecapKey =
    selectedRecapKey &&
    pagedRecaps.some((item) => item.key === selectedRecapKey)
      ? selectedRecapKey
      : (pagedRecaps[0]?.key ?? null);

  const selectedRecap = useMemo(() => {
    if (!normalizedRecaps.length) return null;
    if (!effectiveSelectedRecapKey) return normalizedRecaps[0] ?? null;
    return (
      normalizedRecaps.find((recap) => recap.key === effectiveSelectedRecapKey) ??
      normalizedRecaps[0] ??
      null
    );
  }, [effectiveSelectedRecapKey, normalizedRecaps]);

  const selectedRecapLink = useMemo(() => {
    if (!selectedRecap) return null;
    return buildRecommendationLink(selectedRecap);
  }, [buildRecommendationLink, selectedRecap]);

  const selectedRecapAnswer = useMemo<RecapAnswerSnapshot>(() => {
    if (!selectedRecap) {
      return {
        choiceIndex: null,
        result: "unanswered",
        answeredAtMs: null,
      };
    }
    const answer = resolveParticipantAnswer(
      selectedRecap,
      effectiveSelectedReviewParticipantClientId,
      meClientId,
    );
    return {
      choiceIndex:
        typeof answer.choiceIndex === "number" ? answer.choiceIndex : null,
      result:
        answer.result === "correct" || answer.result === "wrong"
          ? answer.result
          : "unanswered",
      answeredAtMs:
        typeof answer.answeredAtMs === "number" ? answer.answeredAtMs : null,
    };
  }, [
    effectiveSelectedReviewParticipantClientId,
    meClientId,
    resolveParticipantAnswer,
    selectedRecap,
  ]);

  const selectedRecapCorrectRank = useMemo(() => {
    if (!selectedRecap) return null;
    if (!effectiveSelectedReviewParticipantClientId) return null;
    if (selectedRecapAnswer.result !== "correct") return null;
    return resolveCorrectAnsweredRank(
      selectedRecap,
      effectiveSelectedReviewParticipantClientId,
    );
  }, [
    effectiveSelectedReviewParticipantClientId,
    resolveCorrectAnsweredRank,
    selectedRecap,
    selectedRecapAnswer.result,
  ]);

  const reviewContextTransitionKey = `${effectiveSelectedReviewParticipantClientId ?? "none"}:${safeReviewPage}`;
  const reviewDetailTransitionKey = `${reviewContextTransitionKey}:${selectedRecap?.key ?? "none"}`;

  return {
    reviewRecapSummary,
    reviewPageCount,
    safeReviewPage,
    pagedRecaps,
    effectiveSelectedRecapKey,
    selectedRecap,
    selectedRecapLink,
    selectedRecapAnswer,
    selectedRecapCorrectRank,
    reviewContextTransitionKey,
    reviewDetailTransitionKey,
  };
};

export default useSettlementRecapSelectionState;
