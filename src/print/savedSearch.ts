export interface SavedSearch {
  "1": string;
  "3": SavedSearchParams;
}

export interface SavedSearchParams {
  "7"?: SavedSearchRoute[] | null;
  "8": string; // cabin
}

export interface SavedSearchRoute {
  "3"?: string[] | null; // origin
  "5"?: string[] | null; // destination
}
