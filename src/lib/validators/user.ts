import { z } from "zod";
import {
    dallas_county_demographics_schema,
    username_schema,
} from "./auth";

export const update_user_role_schema = z.object({
    role: z.enum(["USER", "PROVIDER", "ADMIN"], {
        required_error: "Role is required",
    }),
});

export const user_query_schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(["USER", "PROVIDER", "ADMIN"]).optional(),
    search: z.string().optional(),
});

export const dallas_county_demographics_update_schema = z.object({
    race: dallas_county_demographics_schema.shape.race.optional(),
    gender: dallas_county_demographics_schema.shape.gender.optional(),
    ethnicity: dallas_county_demographics_schema.shape.ethnicity.optional(),
    age_band: dallas_county_demographics_schema.shape.age_band.optional(),
    marital_status: dallas_county_demographics_schema.shape.marital_status.optional(),
    children_under_5_count: z.coerce.number().int().min(0).optional(),
    children_5_to_18_count: z.coerce.number().int().min(0).optional(),
    children_over_18_count: z.coerce.number().int().min(0).optional(),
    county_of_residence: dallas_county_demographics_schema.shape.county_of_residence.optional(),
    employment_status: dallas_county_demographics_schema.shape.employment_status.optional(),
    annual_income_bracket: dallas_county_demographics_schema.shape.annual_income_bracket.optional(),
    education_level: dallas_county_demographics_schema.shape.education_level.optional(),
    primary_language: dallas_county_demographics_schema.shape.primary_language.optional(),
});

export const update_my_profile_schema = z
    .object({
        username: username_schema.optional(),
        language_pref: z.enum(["en", "es"]).optional(),
        share_with_providers: z.boolean().optional(),
        demographics: dallas_county_demographics_update_schema.optional(),
    })
    .refine(
        (data) =>
            data.username !== undefined ||
            data.language_pref !== undefined ||
            data.share_with_providers !== undefined ||
            data.demographics !== undefined,
        {
            message: "At least one field is required",
        },
    );
