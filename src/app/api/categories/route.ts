import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    create_category_schema,
    slugify_category_name,
    category_slug_schema,
} from "@/lib/validators/category";

// GET /api/categories — list all event categories.
// Public: the sign-up interests step needs this before the user has a session.
// Client components cache this response via use_categories().
// `_count.events` is additive and used by the admin categories dashboard.
export async function GET() {
    try {
        const categories = await db.eventCategory.findMany({
            orderBy: { slug: "asc" },
            select: {
                id: true,
                slug: true,
                name_en: true,
                name_es: true,
                color: true,
                emoji: true,
                _count: { select: { events: true } },
            },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("GET /api/categories error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// POST /api/categories — create an event category. ADMIN only.
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = create_category_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const slug = parsed.data.slug ?? slugify_category_name(parsed.data.name_en);
        const slug_check = category_slug_schema.safeParse(slug);
        if (!slug_check.success) {
            return NextResponse.json(
                { error: "Could not derive a valid slug from the English name" },
                { status: 400 },
            );
        }

        const existing = await db.eventCategory.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json(
                { error: "A category with this slug already exists" },
                { status: 409 },
            );
        }

        const category = await db.eventCategory.create({
            data: {
                slug,
                name_en: parsed.data.name_en,
                name_es: parsed.data.name_es,
                color: parsed.data.color.toLowerCase(),
                emoji: parsed.data.emoji,
            },
            select: {
                id: true,
                slug: true,
                name_en: true,
                name_es: true,
                color: true,
                emoji: true,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error("POST /api/categories error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
