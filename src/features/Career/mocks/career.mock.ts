import type {
  CareerCollectionRankRow,
  CareerCompositeStats,
  CareerHeroStats,
  CareerHighlightItem,
  CareerOverviewData,
  CareerShareCardData,
  CareerShareTemplate,
  CareerWeeklyStats,
} from "../types/career";

export const mockCareerHeroStats: CareerHeroStats = {
  displayName: "ZhenYu",
  descriptor: "綜合表現 / 題庫戰績 / 分享匯出",
  totalMatches: 128,
  totalScore: 84200,
  bestScore: 9820,
  bestRank: 1,
  playTimeSec: 14 * 3600 + 36 * 60,
  bestCombo: 17,
};

export const mockCareerCompositeStats: CareerCompositeStats = {
  averagePlacement: 2.4,
  averageScore: 6578,
  top3Rate: 0.74,
  firstPlaceCount: 18,
  averageAccuracyRate: 0.81,
  trend: [
    { label: "5/12", score: 6230 },
    { label: "5/13", score: 7820 },
    { label: "5/14", score: 7040 },
    { label: "5/15", score: 8910 },
    { label: "5/16", score: 7480 },
    { label: "5/17", score: 9020 },
    { label: "5/18", score: 9820 },
  ],
};

export const mockCareerWeeklyStats: CareerWeeklyStats = {
  currentMatches: 12,
  previousMatches: 8,
  matchesDelta: 4,

  currentScore: 6240,
  previousScore: 4260,
  scoreDelta: 1980,

  currentAccuracyRate: 0.81,
  previousAccuracyRate: 0.75,
  accuracyDelta: 0.06,
};

export const mockCareerHighlights: CareerHighlightItem[] = [
  {
    key: "bestScore",
    label: "近期最高分",
    value: "9,820",
    subtitle: "J-POP Night Mix",
    accentClass:
      "border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(147,51,234,0.18),rgba(55,16,74,0.78))]",
  },
  {
    key: "bestPlacement",
    label: "近期最佳名次",
    value: "1/8",
    subtitle: "Anime OP Party",
    accentClass:
      "border border-sky-300/28 bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(18,35,76,0.78))]",
  },
  {
    key: "bestCombo",
    label: "近期最佳 Combo",
    value: "x17",
    subtitle: "City Pop Mix",
    accentClass:
      "border border-cyan-300/28 bg-[linear-gradient(180deg,rgba(6,182,212,0.18),rgba(13,52,63,0.78))]",
  },
  {
    key: "bestAccuracy",
    label: "近期最佳答對率",
    value: "92%",
    subtitle: "Weekend Challenge",
    accentClass:
      "border border-amber-300/28 bg-[linear-gradient(180deg,rgba(245,158,11,0.18),rgba(69,41,11,0.78))]",
  },
];

export const mockCareerCollectionRankRows: CareerCollectionRankRow[] = [
  {
    id: "playlist-jpop-night-mix",
    title: "J-POP Night Mix",
    leaderboardRank: 3,
    previousLeaderboardRank: 5,
    delta: 2,
    bestScore: 9820,
    playCount: 14,
    lastPlayedAt: "5/18 21:42",
  },
  {
    id: "playlist-anime-op-party",
    title: "Anime OP Party",
    leaderboardRank: 7,
    previousLeaderboardRank: 4,
    delta: -3,
    bestScore: 9180,
    playCount: 11,
    lastPlayedAt: "5/17 20:18",
  },
  {
    id: "playlist-city-pop-mix",
    title: "City Pop Mix",
    leaderboardRank: 5,
    previousLeaderboardRank: 5,
    delta: 0,
    bestScore: 8760,
    playCount: 9,
    lastPlayedAt: "5/16 23:05",
  },
  {
    id: "playlist-weekend-challenge",
    title: "Weekend Challenge",
    leaderboardRank: 2,
    previousLeaderboardRank: 6,
    delta: 4,
    bestScore: 9010,
    playCount: 8,
    lastPlayedAt: "5/18 19:30",
  },
  {
    id: "playlist-rock-battle",
    title: "Rock Battle",
    leaderboardRank: 11,
    previousLeaderboardRank: 8,
    delta: -3,
    bestScore: 8120,
    playCount: 7,
    lastPlayedAt: "5/15 18:14",
  },
  {
    id: "playlist-ballad-marathon",
    title: "Ballad Marathon",
    leaderboardRank: 6,
    previousLeaderboardRank: 9,
    delta: 3,
    bestScore: 8540,
    playCount: 10,
    lastPlayedAt: "5/14 22:51",
  },
];

export const mockCareerOverviewData: CareerOverviewData = {
  hero: mockCareerHeroStats,
  composite: mockCareerCompositeStats,
  weekly: mockCareerWeeklyStats,
  highlights: mockCareerHighlights,
  collectionShortcuts: [
    {
      id: "playlist-weekend-challenge",
      title: "Weekend Challenge",
      leaderboardRank: 2,
      previousLeaderboardRank: 6,
      delta: 4,
    },
    {
      id: "playlist-jpop-night-mix",
      title: "J-POP Night Mix",
      leaderboardRank: 3,
      previousLeaderboardRank: 5,
      delta: 2,
    },
    {
      id: "playlist-anime-op-party",
      title: "Anime OP Party",
      leaderboardRank: 7,
      previousLeaderboardRank: 4,
      delta: -3,
    },
  ],
};

export const mockCareerShareCardBase: CareerShareCardData = {
  playerName: "ZhenYu",
  descriptor: "綜合表現穩定成長中",
  totalMatches: 128,
  totalScore: 84200,
  bestScore: 9820,
  bestRank: 1,
  bestCombo: 17,
  playTimeSec: 14 * 3600 + 36 * 60,
  weeklyScoreDelta: 1980,
  weeklyMatchesDelta: 4,
  weeklyAccuracyDelta: 0.06,
  highlightTitle: "近期最佳單場",
  highlightValue: "9,820",
  highlightSubtitle: "J-POP Night Mix",
};

export const mockCareerShareCaptions: Record<CareerShareTemplate, string> = {
  career:
    "我最近在 Muizo 持續刷新自己的戰績，最高分來到 9,820，最佳名次打到 1/8，還在繼續往更穩定的綜合表現前進。",
  weekly:
    "這週在 Muizo 又往前推了一點：總分 +1,980、對戰數 +4、答對率也繼續提升中。",
  highlight:
    "剛剛在 Muizo 打出近期最佳一場，分數衝到 9,820，還把自己的節奏掌控再往上拉了一截。",
};
