import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_event_status_schema } from "@/lib/validators/event";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/events/[id]/status - transition an event's approval status
// This route is ADMIN only.
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Only admins can change event status" },
                { status: 403 },
            );
        }

        const { id } = await context.params;

        const existing = await db.event.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = update_event_status_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const updated = await db.event.update({
            where: { id },
            data: { status: parsed.data.status },
            include: {
                provider: {
                    select: { id: true, email: true },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH /api/events/[id]/status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}