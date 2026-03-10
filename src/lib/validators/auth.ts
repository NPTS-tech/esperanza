import { z } from "zod";

export const login_schema = z.object({
    email: z
        .string()
        .email("Invalid email address"),
    password: z
        .string()
        .min(1, "Password is required"),
});

export const register_schema = z.object({
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

    // demographics (all optional)
    race: z.string().optional(),
    gender: z.string().optional(),
    age: z.coerce.number().int().min(0).max(120).optional().nullable(),
    annual_personal_income: z.string().optional(),
    annual_household_income: z.string().optional(),
    county: z.string().optional(),
    has_children_under_18: z.boolean().default(false),
    has_children_under_5: z.boolean().default(false),
    educational_attainment: z.string().optional(),
    has_personal_vehicle: z.boolean().default(false),
    is_employed: z.boolean().default(false),
    industry_area: z.string().optional(),

    consent: z.boolean(),
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
