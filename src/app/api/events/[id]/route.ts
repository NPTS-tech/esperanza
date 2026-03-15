import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_event_schema } from "@/lib/validators/event";
import { EventStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };


// GET /api/events/[id] — fetch a single event by ID
//
// Visibility is the same as the events list endpoint (GET /api/events):
// USER - APPROVED events only
// PROVIDER - All of their own events + all approved public events
// ADMIN - All events
//
// Note: All non-visible events surface as 404 rather than 403 to avoid leaking the existence of unapproved events to users.
export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const event = await db.event.findUnique({
            where: { id },
            include: {
                provider: {
                    select: { id: true, email: true },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const role = session.user.role;
        const is_own = event.provider_id === session.user.id;

        if (role === "USER" && event.status !== "APPROVED") {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (role === "PROVIDER" && event.status !== "APPROVED" && !is_own) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("GET /api/events/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


// PATCH /api/events/[id] — partial update of event content fields
//
// Authorization:
// PROVIDER - may only update their own events
// ADMIN - may update any event
// USER - not authorized
//
// ! TEST Implementation: Re-review gate
// If a PROVIDER edits any content field on an APPROVED event, the event is
// automatically reset to PENDING so admin can re-verify the changes before
// the event becomes publicly visible again.
//
// Status transitions are intentionally not handled here. Use the dedicated
// PATCH /api/events/[id]/status route (admin only) for approvals/rejections
// Note: This is meant to keep permissions structural rather than conditional, might need refactoring later if needed
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const role = session.user.role;

        const existing = await db.event.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const is_own = existing.provider_id === session.user.id;
        if (role === "USER" || (role === "PROVIDER" && !is_own)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = update_event_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        // Re-review gate
        // When a PROVIDER edits content on an already-APPROVED event, reset it
        // to PENDING so the admin reviews the changes before it resurfaces publicly. 
        //
        // Note: Image-only changes (image_url) are excluded from this rule
        // as they do not affect the accuracy of event information.

        // Todo: hardcoded for now, change to a more scalable solution.
        const CONTENT_FIELDS = [
            "title_en",
            "title_es",
            "description_en",
            "description_es",
            "location_name",
            "location_address",
            "latitude",
            "longitude",
            "start_time",
            "end_time",
            "category",
            "target_age_min",
            "target_age_max",
        ] as const;

        const update_data: typeof parsed.data & { status?: EventStatus } = { ...parsed.data };

        if (role === "PROVIDER" && existing.status === "APPROVED") {
            const has_content_change = CONTENT_FIELDS.some(
                (field) => update_data[field] !== undefined,
            );
            if (has_content_change) {
                update_data.status = EventStatus.PENDING;
            }
        }

        const updated = await db.event.update({
            where: { id },
            data: update_data,
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
        console.error("PATCH /api/events/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/events/[id] — remove an event
// 
// Authorization:
// PROVIDER - may only delete their own events
// ADMIN - may delete any event
// USER - not authorized
//
// Note: Hard delete that should also remove rspvs via cascading.
export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const role = session.user.role;

        const existing = await db.event.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const is_own = existing.provider_id === session.user.id;
        if (role === "USER" || (role === "PROVIDER" && !is_own)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.$transaction([
            db.rsvp.deleteMany({ where: { event_id: id } }),
            db.event.delete({ where: { id } }),
        ]);

        return NextResponse.json({ message: "Event deleted" });
    } catch (error) {
        console.error("DELETE /api/events/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}