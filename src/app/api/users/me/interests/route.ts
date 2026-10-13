import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_interests_schema } from "@/lib/validators/user";

const category_select = {
    id: true,
    slug: true,
    name_en: true,
    name_es: true,
    color: true,
    emoji: true,
} as const;

type CategoryDto = {
    id: string;
    slug: string;
    name_en: string;
    name_es: string;
    color: string;
    emoji: string;
};

async function load_interests(user_id: string) {
    const interests = await db.eventCategory.findMany({
        where: { interests: { some: { user_id } } },
        select: category_select,
        orderBy: { slug: "asc" },
    });
    return interests;
}

// GET /api/users/me/interests — the current user's saved category interests.
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const interests: CategoryDto[] = await load_interests(session.user.id);
        return NextResponse.json({
            category_ids: interests.map((category) => category.id),
            interests,
        });
    } catch (error) {
        console.error("GET /api/users/me/interests error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// PUT /api/users/me/interests — replace the current user's interests with the
// provided list of category IDs (empty list clears them).
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = update_interests_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const user_id = session.user.id;
        const unique_ids = [...new Set(parsed.data.category_ids)];

        // Validate every id against the seeded category table.
        const found = await db.eventCategory.findMany({
            where: { id: { in: unique_ids } },
            select: { id: true },
        });
        if (found.length !== unique_ids.length) {
            return NextResponse.json(
                { error: "Unknown category in list" },
                { status: 400 },
            );
        }

        // Full replacement: wipe and re-create. Interests rows are tiny,
        // and SQLite has no INSERT ... CONFLICT DO NOTHING via Prisma.
        await db.$transaction([
            db.userInterestEventCategory.deleteMany({ where: { user_id } }),
            db.userInterestEventCategory.createMany({
                data: unique_ids.map((category_id) => ({ user_id, category_id })),
            }),
        ]);

        const interests: CategoryDto[] = await load_interests(user_id);
        return NextResponse.json({
            category_ids: interests.map((category) => category.id),
            interests,
        });
    } catch (error) {
        console.error("PUT /api/users/me/interests error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
