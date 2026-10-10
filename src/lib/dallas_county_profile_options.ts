export const DALLAS_COUNTY_GENDER_OPTIONS = [
  "Female",
  "Male",
  "Other"
] as const;

export const DALLAS_COUNTY_RACE_OPTIONS = [
  "White",
  "Black or African American",
  "American Indian/Alaska Native",
  "Asian",
  "Native Hawaiian/Pacific Islander",
] as const;

export const DALLAS_COUNTY_ETHNICITY_OPTIONS = [
  "Hispanic/Latino",
  "Not Hispanic/Latino",
  "Rather Not Say"
] as const;

export const DALLAS_COUNTY_AGE_BAND_OPTIONS = [
  "18-25",
  "26-35",
  "36-45",
  "46-55",
  "56-60",
  "61-75",
  "76+",
] as const;

export const DALLAS_COUNTY_MARITAL_STATUS_OPTIONS = [
  "Single (never married)",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
  "Rather Not Say"
] as const;

export const DALLAS_COUNTY_CHILDREN_CATEGORIES = [
  "Under 5",
  "Between 5 - 18",
  "Over 18",
  "None",
] as const;

export const DALLAS_COUNTY_COUNTY_OPTIONS = [
  "Dallas",
  "Tarrant",
  "Collin",
  "Denton",
  "Rockwall",
  "Kaufman",
  "Ellis",
  "Johnson",
  "Other",
] as const;

export const DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Temporary/Seasonal worker",
  "Currently unemployed",
  "Retired",
  "Rather Not Say"
] as const;

export const DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS = [
  "0-$10,000",
  "$10,000-$20,000",
  "$20,000-$30,000",
  "$30,000-$40,000",
  "$40,000-$50,000",
  "$50,000-$60,000",
  "$60,000-$70,000",
  "$70,000-$80,000",
  "$80,000-$90,000",
  "$90,000-$100,000",
  "Over $100,000",
  "Rather Not Say"
] as const;

export const DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS = [
  "Some high school",
  "High school diploma",
  "Some college",
  "Associates degree",
  "Bachelor degree",
  "Graduate degree",
  "Rather Not Say"
] as const;

export const DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Other",
] as const;

export const DALLAS_COUNTY_PROFILE_OPTIONS = {
  gender: DALLAS_COUNTY_GENDER_OPTIONS,
  race: DALLAS_COUNTY_RACE_OPTIONS,
  ethnicity: DALLAS_COUNTY_ETHNICITY_OPTIONS,
  age_band: DALLAS_COUNTY_AGE_BAND_OPTIONS,
  marital_status: DALLAS_COUNTY_MARITAL_STATUS_OPTIONS,
  children_categories: DALLAS_COUNTY_CHILDREN_CATEGORIES,
  county_of_residence: DALLAS_COUNTY_COUNTY_OPTIONS,
  employment_status: DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS,
  annual_income_bracket: DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS,
  education_level: DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS,
  primary_language: DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS,
} as const;
