"use client";

import { useEffect, useState } from "react";

// Event categories are DB-backed (prisma/seed.ts + GET /api/categories).
// Events embed their category object, so components can style and localize
// without touching the cat_* translation keys that used to exist.
export interface CategoryDto {
    id: string;
    slug: string;
    name_en: string;
    name_es: string;
    color: string;
    emoji: string;
}

export function category_label(category: CategoryDto, locale: string): string {
    return locale === "es" ? category.name_es : category.name_en;
}

// Module-level cache + in-flight dedupe so every dropdown/chip grid on a page
// shares one request without needing a context provider.
let cached_categories: CategoryDto[] | null = null;
let in_flight: Promise<CategoryDto[]> | null = null;

async function fetch_categories(): Promise<CategoryDto[]> {
    if (!in_flight) {
        in_flight = fetch("/api/categories", { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to load categories");
                const data = (await res.json()) as { categories: CategoryDto[] };
                cached_categories = data.categories;
                return data.categories;
            })
            .finally(() => {
                in_flight = null;
            });
    }
    return in_flight;
}

// react-hooks lint requires the hook function itself to be camelCase;
// snake_case alias keeps the repo's naming convention at the call sites.
function useEventCategories() {
    const [categories, set_categories] = useState<CategoryDto[]>(
        cached_categories ?? [],
    );
    const [loading, set_loading] = useState(cached_categories === null);

    useEffect(() => {
        let cancelled = false;

        if (cached_categories) {
            set_categories(cached_categories);
            set_loading(false);
            return;
        }

        fetch_categories()
            .then((data) => {
                if (!cancelled) set_categories(data);
            })
            .catch(() => {
                // components render their own empty/error states
            })
            .finally(() => {
                if (!cancelled) set_loading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { categories, loading };
}

export const use_categories = useEventCategories;

// Drops the module-level cache so the next use_categories() call refetches.
// Admin mutations (create/delete category) call this after a successful write.
export function clear_categories_cache(): void {
    cached_categories = null;
}
