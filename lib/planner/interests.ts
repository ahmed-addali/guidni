import type { InterestMeta } from "./types";

// Interest metadata — used by the scoring engine.
// No icon imports here (UI icons live in the wizard components).
export const INTERESTS: InterestMeta[] = [
  {
    id: "adventures",
    defaultIntensity: "high",
    typicalBudget: 2,
    relatedTags: ["outdoor", "extreme", "climbing", "hiking", "adrenaline"],
    idealTime: "morning",
  },
  {
    id: "water_sports",
    defaultIntensity: "medium",
    typicalBudget: 2,
    relatedTags: ["beach", "summer", "sea", "diving", "snorkeling", "surfing"],
    idealTime: "morning",
  },
  {
    id: "culture",
    defaultIntensity: "low",
    typicalBudget: 1,
    relatedTags: ["history", "traditional", "heritage", "museum", "religious", "art"],
    idealTime: "morning",
  },
  {
    id: "food_drink",
    defaultIntensity: "low",
    typicalBudget: 2,
    relatedTags: ["local", "gastronomy", "cooking", "tasting", "cuisine", "restaurant"],
    idealTime: "evening",
  },
  {
    id: "nature_wildlife",
    defaultIntensity: "medium",
    typicalBudget: 2,
    relatedTags: ["animals", "hiking", "eco", "wildlife", "birds", "landscape"],
    idealTime: "morning",
  },
  {
    id: "attractions",
    defaultIntensity: "low",
    typicalBudget: 1,
    relatedTags: ["landmarks", "photo", "sightseeing", "famous", "iconic"],
    idealTime: "any",
  },
  {
    id: "sightseeing",
    defaultIntensity: "low",
    typicalBudget: 2,
    relatedTags: ["guided", "tour", "transport", "panorama", "viewpoint"],
    idealTime: "morning",
  },
  {
    id: "workshops",
    defaultIntensity: "low",
    typicalBudget: 2,
    relatedTags: ["learning", "hands-on", "crafts", "pottery", "cooking", "art"],
    idealTime: "afternoon",
  },
  {
    id: "wellness",
    defaultIntensity: "low",
    typicalBudget: 3,
    relatedTags: ["relaxation", "luxury", "spa", "yoga", "hammam", "massage"],
    idealTime: "afternoon",
  },
  {
    id: "shopping",
    defaultIntensity: "low",
    typicalBudget: 1,
    relatedTags: ["souvenirs", "local", "market", "souk", "artisan", "crafts"],
    idealTime: "afternoon",
  },
  {
    id: "family_friendly",
    defaultIntensity: "low",
    typicalBudget: 2,
    relatedTags: ["kids", "all-ages", "children", "park", "games", "family"],
    idealTime: "any",
  },
  {
    id: "events",
    defaultIntensity: "medium",
    typicalBudget: 2,
    relatedTags: ["seasonal", "entertainment", "music", "festival", "live", "night"],
    idealTime: "evening",
  },
  {
    id: "trips",
    defaultIntensity: "medium",
    typicalBudget: 2,
    relatedTags: ["transport", "guided", "excursion", "day-trip", "boat", "island"],
    idealTime: "morning",
  },
];

export const INTEREST_MAP = new Map(INTERESTS.map((i) => [i.id, i]));
