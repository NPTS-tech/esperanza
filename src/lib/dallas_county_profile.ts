import type { Demographics } from "@prisma/client";

export type DallasCountyDemographicsInput = {
  race: string;
  gender: string;
  ethnicity: string;
  age_band: string;
  marital_status: string;
  children_under_5_count: number;
  children_5_to_18_count: number;
  children_over_18_count: number;
  county_of_residence: string;
  employment_status: string;
  annual_income_bracket: string;
  education_level: string;
  primary_language: string;
};

type StoredDemographics = Partial<
  Pick<
    Demographics,
    | "race"
    | "gender"
    | "ethnicity"
    | "age_band"
    | "marital_status"
    | "children_under_5_count"
    | "children_5_to_18_count"
    | "children_over_18_count"
    | "county_of_residence"
    | "employment_status"
    | "annual_income_bracket"
    | "education_level"
    | "primary_language"
    | "age"
    | "annual_personal_income"
    | "annual_household_income"
    | "county"
    | "has_children_under_18"
    | "has_children_under_5"
    | "educational_attainment"
    | "has_personal_vehicle"
    | "is_employed"
    | "industry_area"
  >
>;

export const EMPTY_DALLAS_COUNTY_DEMOGRAPHICS: DallasCountyDemographicsInput = {
  race: "",
  gender: "",
  ethnicity: "",
  age_band: "",
  marital_status: "",
  children_under_5_count: 0,
  children_5_to_18_count: 0,
  children_over_18_count: 0,
  county_of_residence: "",
  employment_status: "",
  annual_income_bracket: "",
  education_level: "",
  primary_language: "",
};

const AGE_BAND_TO_LEGACY_AGE: Record<string, number> = {
  "18-25": 18,
  "26-35": 26,
  "36-45": 36,
  "46-55": 46,
  "56-60": 56,
  "61-75": 61,
  "76+": 76,
};

const UNEMPLOYED_STATUSES = new Set([
  "Currently unemployed",
  "Retired",
]);

function to_county_of_residence(county: string | null | undefined): string {
  if (!county) return "";
  if (county === "Other") return county;
  return county.endsWith(" County") ? county.replace(/ County$/, "") : county;
}

function to_age_band(age: number | null | undefined): string {
  if (age == null) return "";
  if (age >= 76) return "76+";
  if (age >= 61) return "61-75";
  if (age >= 56) return "56-60";
  if (age >= 46) return "46-55";
  if (age >= 36) return "36-45";
  if (age >= 26) return "26-35";
  if (age >= 18) return "18-25";
  return "";
}

export function get_default_primary_language_for_locale(
  locale: string | null | undefined,
): string {
  if (locale === "es") return "Spanish";
  if (locale === "en") return "English";
  return "";
}

export function normalize_dallas_county_demographics(
  demographics: StoredDemographics | null | undefined,
  language_pref?: string | null,
): DallasCountyDemographicsInput {
  if (!demographics) {
    return {
      ...EMPTY_DALLAS_COUNTY_DEMOGRAPHICS,
      primary_language: get_default_primary_language_for_locale(language_pref),
    };
  }

  const children_under_5_count =
    demographics.children_under_5_count ??
    (demographics.has_children_under_5 ? 1 : 0);
  const children_5_to_18_count =
    demographics.children_5_to_18_count ??
    (demographics.has_children_under_18 && !demographics.has_children_under_5
      ? 1
      : 0);

  return {
    race: demographics.race ?? "",
    gender: demographics.gender ?? "",
    ethnicity: demographics.ethnicity ?? "",
    age_band: demographics.age_band ?? to_age_band(demographics.age),
    marital_status: demographics.marital_status ?? "",
    children_under_5_count,
    children_5_to_18_count,
    children_over_18_count: demographics.children_over_18_count ?? 0,
    county_of_residence:
      demographics.county_of_residence ??
      to_county_of_residence(demographics.county),
    employment_status:
      demographics.employment_status ??
      (demographics.is_employed ? "Employed full-time" : "Currently unemployed"),
    annual_income_bracket:
      demographics.annual_income_bracket ??
      demographics.annual_personal_income ??
      demographics.annual_household_income ??
      "",
    education_level:
      demographics.education_level ??
      demographics.educational_attainment ??
      "",
    primary_language:
      demographics.primary_language ??
      get_default_primary_language_for_locale(language_pref),
  };
}

export function build_dallas_county_demographics_write_data(
  input: DallasCountyDemographicsInput,
  existing?: StoredDemographics | null,
) {
  const children_under_5_count = Math.max(0, input.children_under_5_count);
  const children_5_to_18_count = Math.max(0, input.children_5_to_18_count);
  const children_over_18_count = Math.max(0, input.children_over_18_count);

  return {
    race: input.race,
    gender: input.gender,
    ethnicity: input.ethnicity,
    age_band: input.age_band,
    marital_status: input.marital_status,
    children_under_5_count,
    children_5_to_18_count,
    children_over_18_count,
    county_of_residence: input.county_of_residence,
    employment_status: input.employment_status,
    annual_income_bracket: input.annual_income_bracket,
    education_level: input.education_level,
    primary_language: input.primary_language,

    // Legacy compatibility for existing app surfaces that still read old columns.
    age: AGE_BAND_TO_LEGACY_AGE[input.age_band] ?? null,
    annual_personal_income: input.annual_income_bracket,
    annual_household_income: input.annual_income_bracket,
    county:
      input.county_of_residence === "Other"
        ? "Other"
        : `${input.county_of_residence} County`,
    has_children_under_18:
      children_under_5_count > 0 || children_5_to_18_count > 0,
    has_children_under_5: children_under_5_count > 0,
    educational_attainment: input.education_level,
    has_personal_vehicle: existing?.has_personal_vehicle ?? false,
    is_employed: !UNEMPLOYED_STATUSES.has(input.employment_status),
    industry_area: existing?.industry_area ?? input.employment_status,
  };
}
