// census-aligned dropdown options for demographic intake

export const RACE_OPTIONS = [
    "White",
    "Black or African American",
    "American Indian or Alaska Native",
    "Asian",
    "Native Hawaiian or Other Pacific Islander",
    "Two or More Races",
    "Other",
];

export const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export const INCOME_BRACKETS = [
    "Less than $15,000",
    "$15,000 – $24,999",
    "$25,000 – $34,999",
    "$35,000 – $49,999",
    "$50,000 – $74,999",
    "$75,000 – $99,999",
    "$100,000 or more",
    "Prefer not to say",
];

export const COUNTY_OPTIONS = [
    "Dallas County",
    "Tarrant County",
    "Collin County",
    "Denton County",
    "Ellis County",
    "Kaufman County",
    "Rockwall County",
    "Other",
];

export const EDUCATION_OPTIONS = [
    "Less than high school",
    "High school diploma or GED",
    "Some college, no degree",
    "Associate's degree",
    "Bachelor's degree",
    "Graduate or professional degree",
];

export const INDUSTRY_OPTIONS = [
    "Agriculture",
    "Construction",
    "Manufacturing",
    "Retail Trade",
    "Transportation & Warehousing",
    "Information & Technology",
    "Finance & Insurance",
    "Healthcare & Social Assistance",
    "Education",
    "Food Service & Hospitality",
    "Government",
    "Other",
    "Not employed",
];

// Event reminder lead times offered in Profile settings, in minutes (default 60).
export const REMINDER_LEAD_OPTIONS = [15, 30, 60, 120, 1440] as const;

// Catch-all category that events fall back to when their category is deleted
// (see DELETE /api/categories/[id]). Seeded like any other EventCategory row so
// every event.category consumer keeps working; must not be deletable.
export const DEFAULT_EVENT_CATEGORY = {
    slug: "no_category",
    name_en: "No Category",
    name_es: "Sin Categoría",
    color: "#6b7280",
    emoji: "❔",
} as const;
