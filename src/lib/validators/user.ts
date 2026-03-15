import { z } from "zod";

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
