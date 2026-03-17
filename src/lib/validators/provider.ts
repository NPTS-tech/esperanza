import { z } from "zod";

// update_provider_profile_schema, used by PUT /api/providers/[id]/profile.
// All fields are optional — supports partial upsert.
export const update_provider_profile_schema = z.object({
    org_name: z.string().min(1).max(200).optional().nullable(),
    bio: z.string().max(2000).optional().nullable(),
    logo_url: z.string().url("Must be a valid URL").optional().nullable(),
    website_url: z.string().url("Must be a valid URL").optional().nullable(),
    contact_email: z.string().email("Must be a valid email").optional().nullable(),
    contact_phone: z.string().max(30).optional().nullable(),
});
