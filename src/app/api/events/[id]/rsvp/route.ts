import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

async function resolve_rsvp_context(context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { id } = await context.params;

  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!event || event.status !== "APPROVED") {
    return {
      error: NextResponse.json({ error: "Event not found" }, { status: 404 }),
    };
  }

  return { user_id: session.user.id, event_id: id };
}

// GET /api/events/[id]/rsvp — returns current RSVP status for signed-in user
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await resolve_rsvp_context(context);
    if ("error" in resolved) return resolved.error;

    const existing = await db.rsvp.findUnique({
      where: {
        user_id_event_id: {
          user_id: resolved.user_id,
          event_id: resolved.event_id,
        },
      },
      select: { id: true },
    });

    const rsvp_count = await db.rsvp.count({
      where: { event_id: resolved.event_id },
    });

    return NextResponse.json({
      hasRsvp: Boolean(existing),
      rsvp_count,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/rsvp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/events/[id]/rsvp — create RSVP for signed-in user
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await resolve_rsvp_context(context);
    if ("error" in resolved) return resolved.error;

    try {
      await db.rsvp.create({
        data: {
          user_id: resolved.user_id,
          event_id: resolved.event_id,
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }

    const rsvp_count = await db.rsvp.count({
      where: { event_id: resolved.event_id },
    });

    return NextResponse.json({
      hasRsvp: true,
      rsvp_count,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[id]/rsvp — remove RSVP for signed-in user
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await resolve_rsvp_context(context);
    if ("error" in resolved) return resolved.error;

    await db.rsvp.deleteMany({
      where: {
        user_id: resolved.user_id,
        event_id: resolved.event_id,
      },
    });

    const rsvp_count = await db.rsvp.count({
      where: { event_id: resolved.event_id },
    });

    return NextResponse.json({
      hasRsvp: false,
      rsvp_count,
    });
  } catch (error) {
    console.error("DELETE /api/events/[id]/rsvp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
