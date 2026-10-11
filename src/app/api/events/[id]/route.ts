import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_event_schema } from "@/lib/validators/event";
import { ensureBilingualEventFields } from "@/lib/services/event-translation";
import { TranslationUnavailableError } from "@/lib/services/translation";

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
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const event = await db.event.findUnique({
            where: { id },
            include: {
                provider: {
                    select: {
                        id: true,
                        email: true,
                        provider_profile: {
                            select: { org_name: true, logo_url: true },
                        },
                    },
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
        const session = await getSession();
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

        // Content fields that trigger re-review when modified by providers
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
        ] as const;

        const update_data: typeof parsed.data & { status?: string } = { ...parsed.data };

        // Admin edits should never force a re-review.
        // Keep whatever current status the event already has.
        if (role === "ADMIN") {
            update_data.status = existing.status;
        }

        if (role === "PROVIDER" && existing.status === "APPROVED") {
            const has_content_change = CONTENT_FIELDS.some(
                (field) => update_data[field] !== undefined,
            );
            if (has_content_change) {
                update_data.status = "PENDING";
            }
        }

        // Ensure bilingual title/description after applying patch.
        // Merge existing values with incoming patch, then fill any missing counterpart language.
        let bilingualFields = {
            title_en: existing.title_en,
            title_es: existing.title_es,
            description_en: existing.description_en,
            description_es: existing.description_es,
        };

        if (
            update_data.title_en !== undefined ||
            update_data.title_es !== undefined ||
            update_data.description_en !== undefined ||
            update_data.description_es !== undefined
        ) {
            const mergedForTranslation = {
                title_en: (update_data.title_en ?? existing.title_en) ?? "",
                title_es: (update_data.title_es ?? existing.title_es) ?? "",
                description_en: (update_data.description_en ?? existing.description_en) ?? "",
                description_es: (update_data.description_es ?? existing.description_es) ?? "",
            };

            try {
                bilingualFields = await ensureBilingualEventFields(mergedForTranslation);
            } catch (error) {
                console.error("ensureBilingualEventFields error (update):", error);
                if (error instanceof TranslationUnavailableError) {
                    return NextResponse.json(
                        {
                            error:
                                "Auto-translation is temporarily unavailable. Please provide both the English and Spanish title and description.",
                        },
                        { status: 422 },
                    );
                }
                return NextResponse.json(
                    { error: error instanceof Error ? error.message : "Invalid event content" },
                    { status: 400 },
                );
            }

            if (update_data.title_en !== undefined || update_data.title_es !== undefined) {
                update_data.title_en = bilingualFields.title_en;
                update_data.title_es = bilingualFields.title_es;
            }

            if (update_data.description_en !== undefined || update_data.description_es !== undefined) {
                update_data.description_en = bilingualFields.description_en;
                update_data.description_es = bilingualFields.description_es;
            }
        }

        // A rescheduled event needs a fresh reminder at the new time.
        if (
            update_data.start_time !== undefined &&
            update_data.start_time.getTime() !== existing.start_time.getTime()
        ) {
            await db.rsvp.updateMany({
                where: { event_id: id },
                data: { reminder_sent_at: null },
            });
        }

        const updated = await db.event.update({
            where: { id },
            data: update_data,
            include: {
                provider: {
                    select: {
                        id: true,
                        email: true,
                        provider_profile: {
                            select: { org_name: true, logo_url: true },
                        },
                    },
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
        const session = await getSession();
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