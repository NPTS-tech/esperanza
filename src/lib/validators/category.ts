import { z } from "zod";

// Event categories are DB-backed (EventCategory table). Only ADMINs may create
// or delete them (POST /api/categories, DELETE /api/categories/[id]); every
// signed-in user can read them via GET /api/categories.

// Slugs follow the seed's convention: lowercase snake_case (see prisma/seed.ts).
export const category_slug_schema = z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, "Slug must be lowercase letters, numbers, and underscores");

export const create_category_schema = z.object({
    slug: category_slug_schema.optional(),
    name_en: z.string().min(1, "English name is required").max(100),
    name_es: z.string().min(1, "Spanish name is required").max(100),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #3b82f6"),
    emoji: z.string().min(1, "Emoji is required").max(8),
});

export type CreateCategoryInput = z.infer<typeof create_category_schema>;

// Derives the slug from the English name when the client doesn't supply one,
// matching the seeded categories' snake_case style ("Senior Services" -> "senior_services").
export function slugify_category_name(name_en: string): string {
    return name_en
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 50)
        .replace(/_+$/g, "");
}
