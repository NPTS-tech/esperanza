import { z } from "zod";

// TODO: Admin UI for managing categories post-MVP? For now, hardcoded in both backend and frontend.
export const EVENT_CATEGORIES = [
    "Health",
    "Employment",
    "Financial",
    "Recreation",
    "Transit",
    "Senior Services",
    "Education",
    "Community",
    "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Custom refinements for event validation
const age_range_refinement = (data: {
    target_age_min?: number | null;
    target_age_max?: number | null;
}) => {
    if (data.target_age_min != null && data.target_age_max != null) {
        return data.target_age_max > data.target_age_min;
    }
    return true;
};


// create_event_schema, used by POST /api/events.
// All bilingual fields are required at creation time.
export const create_event_schema = z
    .object({
        title_en: z.string().min(1, "English title is required").max(200),
        title_es: z.string().min(1, "Spanish title is required").max(200),
        description_en: z
            .string()
            .min(1, "English description is required")
            .max(5000),
        description_es: z
            .string()
            .min(1, "Spanish description is required")
            .max(5000),
        location_name: z.string().min(1, "Location name is required").max(300),
        location_address: z.string().min(1, "Location address is required").max(500),
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
        start_time: z.coerce.date().refine((d) => d > new Date(), {
            message: "Start time must be in the future",
        }),
        end_time: z.coerce.date(),
        category: z.enum(EVENT_CATEGORIES),

        // Optional demographic age targeting.
        // Drives senior service notifications (65+) and any other age-gated recommendations.
        target_age_min: z.coerce
            .number()
            .int()
            .min(0)
            .max(120)
            .optional()
            .nullable(),
        target_age_max: z.coerce
            .number()
            .int()
            .min(0)
            .max(120)
            .optional()
            .nullable(),

        image_url: z.string().url("Must be a valid URL").optional().nullable(),
    })
    .refine((data) => data.end_time > data.start_time, {
        message: "End time must be after start time",
        path: ["end_time"],
    })
    .refine(age_range_refinement, {
        message: "target_age_max must be greater than target_age_min",
        path: ["target_age_max"],
    });

// update_event_schema, used by PATCH /api/events/[id].
// All fields are optional for partial updating.

// ! IMPORTANT - status is intentionally excluded here.
// Status transitions (PENDING -> APPROVED / REJECTED / CANCELLED) are handled
// by a dedicated PATCH /api/events/[id]/status route that is ADMIN-only.

// Keeping status out of this schema prevents providers from self-approving events regardless of how the route layer is implemented.
export const update_event_schema = z
    .object({
        title_en: z.string().min(1).max(200).optional(),
        title_es: z.string().min(1).max(200).optional(),
        description_en: z.string().min(1).max(5000).optional(),
        description_es: z.string().min(1).max(5000).optional(),
        location_name: z.string().min(1).max(300).optional(),
        location_address: z.string().min(1).max(500).optional(),
        latitude: z.coerce.number().min(-90).max(90).optional(),
        longitude: z.coerce.number().min(-180).max(180).optional(),
        start_time: z.coerce.date().optional(),
        end_time: z.coerce.date().optional(),
        category: z.enum(EVENT_CATEGORIES).optional(),
        target_age_min: z.coerce
            .number()
            .int()
            .min(0)
            .max(120)
            .optional()
            .nullable(),
        target_age_max: z.coerce
            .number()
            .int()
            .min(0)
            .max(120)
            .optional()
            .nullable(),
        image_url: z.string().url("Must be a valid URL").optional().nullable(),
    })
    .refine(
        (data) => {
            if (data.start_time && data.end_time) {
                return data.end_time > data.start_time;
            }
            return true;
        },
        {
            message: "End time must be after start time",
            path: ["end_time"],
        },
    )
    .refine(age_range_refinement, {
        message: "target_age_max must be greater than target_age_min",
        path: ["target_age_max"],
    });

// update_event_status_schema, used by PATCH /api/events/[id]/status for admin-only status updates.
export const update_event_status_schema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], {
        required_error: "Status is required",
    }),
});

// event_query_schema, used by GET /api/events for validating query parameters.
export const event_query_schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(1000).default(20),
    category: z.enum(EVENT_CATEGORIES).optional(),
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
        .optional(),
    search: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    provider_id: z.string().uuid().optional(),
});