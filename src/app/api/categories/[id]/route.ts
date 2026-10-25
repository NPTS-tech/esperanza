import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_EVENT_CATEGORY } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/categories/[id] — remove an event category. ADMIN only.
//
// Events referencing the category are reassigned to the default "No Category"
// category (Event.category_id is required, so deletion can't leave them
// orphaned). User interests and provider program categories cascade
// automatically (see prisma/schema.prisma). The default category itself cannot
// be deleted — it must always exist as a reassignment target.
export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const category = await db.eventCategory.findUnique({
            where: { id },
            select: {
                id: true,
                slug: true,
                name_en: true,
                _count: { select: { events: true } },
            },
        });
        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 },
            );
        }

        if (category.slug === DEFAULT_EVENT_CATEGORY.slug) {
            return NextResponse.json(
                { error: "The default 'No Category' category cannot be deleted" },
                { status: 400 },
            );
        }

        // Ensure the fallback category exists even if the seed hasn't run.
        const default_category = await db.eventCategory.upsert({
            where: { slug: DEFAULT_EVENT_CATEGORY.slug },
            update: {},
            create: DEFAULT_EVENT_CATEGORY,
            select: { id: true },
        });

        const deleted_event_count = category._count.events;
        await db.$transaction([
            db.event.updateMany({
                where: { category_id: category.id },
                data: { category_id: default_category.id },
            }),
            db.eventCategory.delete({ where: { id } }),
        ]);

        return NextResponse.json({
            message: "Category deleted",
            reassigned_events: deleted_event_count,
        });
    } catch (error) {
        console.error("DELETE /api/categories/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
