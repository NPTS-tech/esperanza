import { z } from "zod";
import {
    DALLAS_COUNTY_AGE_BAND_OPTIONS,
    DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS,
    DALLAS_COUNTY_COUNTY_OPTIONS,
    DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS,
    DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS,
    DALLAS_COUNTY_ETHNICITY_OPTIONS,
    DALLAS_COUNTY_GENDER_OPTIONS,
    DALLAS_COUNTY_MARITAL_STATUS_OPTIONS,
    DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS,
    DALLAS_COUNTY_RACE_OPTIONS,
} from "@/lib/dallas_county_profile_options";

export const login_schema = z.object({
    email: z
        .string()
        .email("Invalid email address"),
    password: z
        .string()
        .min(1, "Password is required"),
});

export const username_schema = z
    .string()
    .trim()
    .min(3, "Username is required")
    .max(50, "Username must be 50 characters or less")
    .regex(
        /^[A-Za-z0-9._-]+$/,
        "Username can only contain letters, numbers, periods, underscores, and hyphens",
    );

// Optional demographics: the UI may submit "" (unanswered, persisted as NULL)
// or "Rather Not Say" (a deliberate answer, persisted verbatim) via
// build_dallas_county_demographics_write_data.
function optional_option_schema(options: readonly [string, ...string[]]) {
    return z.enum(options).or(z.literal("")).optional();
}

export const dallas_county_demographics_schema = z.object({
    race: z.enum(DALLAS_COUNTY_RACE_OPTIONS, {
        required_error: "Race is required",
    }),
    gender: z.enum(DALLAS_COUNTY_GENDER_OPTIONS, {
        required_error: "Gender is required",
    }),
    age_band: z.enum(DALLAS_COUNTY_AGE_BAND_OPTIONS, {
        required_error: "Age range is required",
    }),
    children_under_5_count: z.coerce.number().int().min(0).default(0),
    children_5_to_18_count: z.coerce.number().int().min(0).default(0),
    children_over_18_count: z.coerce.number().int().min(0).default(0),
    county_of_residence: z.enum(DALLAS_COUNTY_COUNTY_OPTIONS, {
        required_error: "County is required",
    }),
    primary_language: z.enum(DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS, {
        required_error: "Primary language is required",
    }),
    ethnicity: optional_option_schema(DALLAS_COUNTY_ETHNICITY_OPTIONS),
    marital_status: optional_option_schema(DALLAS_COUNTY_MARITAL_STATUS_OPTIONS),
    employment_status: optional_option_schema(DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS),
    annual_income_bracket: optional_option_schema(DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS),
    education_level: optional_option_schema(DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS),
});

export const register_schema = z.object({
    username: username_schema,
    email: z
        .string()
        .email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be less than 128 characters"),
    confirm_password: z
        .string(),
    language_pref: z
        .enum(["en", "es"])
        .default("en"),
    share_with_providers: z.boolean().default(true),
    consent: z.boolean(),
    ...dallas_county_demographics_schema.shape,
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
}).refine((data) => data.consent === true, {
    message: "You must consent to data collection",
    path: ["consent"],
});

export const change_password_schema = z.object({
    current_password: z
        .string()
        .min(1, "Current password is required"),
    new_password: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .max(128, "New password must be less than 128 characters"),
});
