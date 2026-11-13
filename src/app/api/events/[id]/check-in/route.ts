import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { verify_checkin_token } from "@/lib/checkin";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/events/[id]/check-in — self-attested QR check-in for the signed-in
// attendee. Body: { token } — the HMAC token embedded in the event's QR code.
//
// Checks, in order:
//   1. Session — check-in is self-attested but must be authenticated.
//   2. Token   — proves the QR/link is genuine for this event.
//   3. Event   — must exist and be APPROVED. Non-visible events surface as 404
//                (same convention as GET /api/events/[id]).
//   4. Window  — any time up to end_time (checking in early is allowed); the
//                token itself never expires, the window is what bounds it.
//
// Effect: creates an RSVP if the user doesn't have one (door walk-ups) and
// stamps checked_in_at. Repeat scans are idempotent.
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const body = await request.json().catch(() => null);
        const token = typeof body?.token === "string" ? body.token : "";
        if (!token || !verify_checkin_token(id, token)) {
            return NextResponse.json({ error: "invalid_token" }, { status: 403 });
        }

        const event = await db.event.findUnique({
            where: { id },
            select: { id: true, status: true, end_time: true },
        });
        if (!event || event.status !== "APPROVED") {
            return NextResponse.json({ error: "not_found" }, { status: 404 });
        }

        const now = new Date();
        if (now > event.end_time) {
            return NextResponse.json({ error: "ended" }, { status: 403 });
        }

        const existing = await db.rsvp.findUnique({
            where: {
                user_id_event_id: { user_id: session.user.id, event_id: id },
            },
            select: { id: true, checked_in_at: true },
        });

        let rsvp_created = false;
        if (existing) {
            if (!existing.checked_in_at) {
                await db.rsvp.update({
                    where: { id: existing.id },
                    data: { checked_in_at: now },
                });
            }
        } else {
            try {
                await db.rsvp.create({
                    data: {
                        user_id: session.user.id,
                        event_id: id,
                        checked_in_at: now,
                    },
                });
                rsvp_created = true;
            } catch (error) {
                // Lost a create race against a concurrent check-in — stamp the row instead.
                if (
                    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
                    error.code !== "P2002"
                ) {
                    throw error;
                }
                await db.rsvp.update({
                    where: {
                        user_id_event_id: { user_id: session.user.id, event_id: id },
                    },
                    data: { checked_in_at: now },
                });
            }
        }

        const rsvp_count = await db.rsvp.count({ where: { event_id: id } });

        return NextResponse.json({
            checked_in: true,
            already_checked_in: Boolean(existing?.checked_in_at),
            rsvp_created,
            rsvp_count,
        });
    } catch (error) {
        console.error("POST /api/events/[id]/check-in error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
