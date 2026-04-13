// Shared types - portable to React Native later

export type ItemType = "candidate" | "measure";
export type SwipeChoice = "yes" | "no" | "skip";

export interface TopicData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface JurisdictionData {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
}

export interface StanceData {
  id: string;
  topic: string;
  position: string;
  summary: string;
}

export interface CandidateData {
  id: string;
  name: string;
  office: string;
  party?: string;
  jurisdiction: JurisdictionData;
  shortSummary: string;
  longSummary?: string;
  imageUrl?: string;
  websiteUrl?: string;
  electionDate?: string;
  topics: TopicData[];
  stances: StanceData[];
}

export interface BallotMeasureData {
  id: string;
  title: string;
  measureCode?: string;
  jurisdiction: JurisdictionData;
  electionDate?: string;
  category?: string;
  shortSummary: string;
  longSummary?: string;
  yesMeans?: string;
  noMeans?: string;
  proArguments?: string[];
  conArguments?: string[];
  topics: TopicData[];
}

export type SwipeItem =
  | { type: "candidate"; data: CandidateData }
  | { type: "measure"; data: BallotMeasureData };

export interface SwipeRecord {
  id: string;
  sessionId: string;
  itemType: ItemType;
  itemId: string;
  choice: SwipeChoice;
  createdAt: string;
}

export interface SwipeResults {
  total: number;
  yes: SwipeItem[];
  no: SwipeItem[];
  skipped: SwipeItem[];
}
