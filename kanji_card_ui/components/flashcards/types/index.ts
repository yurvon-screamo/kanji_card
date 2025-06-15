export interface JapaneseWord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
}

export interface CardSet {
  type: Collection;
  set: Set | null;
}

export interface SetList {
  type: Collection;
  sets: Set[];
}

export interface Set {
  id: string;
  words: JapaneseWord[];
  state: Collection;
}

export type ViewMode = "study" | "set-selection" | "pool" | "add-cards";
export type CardSide = 0 | 1 | 2;
export type StudyMode = "grid" | "jp" | "translate" | "mixed";

export interface GlobalStats {
  totalCards: number;
  totalSets: number;
}

export enum Collection {
  IN_PROGRESS = "inProgress",
  LEARNED = "learned",
  NEW = "new",
}
