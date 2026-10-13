import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories — list all event categories.
// Public: the sign-up interests step needs this before the user has a session.
// Client components cache this response via use_categories().
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
