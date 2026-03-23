import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { create_event_schema, event_query_schema } from "@/lib/validators/event";
import { ensureBilingualEventFields } from "@/lib/services/event-translation";
import { Prisma } from "@prisma/client";

// GET /api/events — list events with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const raw_params = Object.fromEntries(searchParams.entries());
    const parsed = event_query_schema.safeParse(raw_params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      page,
      limit,
      category,
      status,
      search,
      start_date,
      end_date,
      provider_id,
    } = parsed.data;
    const skip = (page - 1) * limit;
    const role = session.user.role;
    const user_id = session.user.id;

    // Role-based visibility
    //
    // USER - APPROVED events only, ignoring any provided status filter since users can only see approved events.
    //
    // PROVIDER - Two modes depending on status filter:
    // 1. No status filter, or status=APPROVED:
    //    All approved public events + all of their own events
    // 2. If status is a non-APPROVED value (PENDING/REJECTED/CANCELLED):
    //    Only their own events matching that status. Do not mix in other providers events
    //
    // ADMIN - All events, Status filter applied directly if provided.
    const where: Prisma.EventWhereInput = {};

    if (role === "USER") {
      // Hardcoded to APPROVED regardless of any status query param
      where.status = "APPROVED";
    } else if (role === "PROVIDER") {
      if (status === "APPROVED") {
        // Explicit approved filter — show only approved events (same as USER)
        where.status = "APPROVED";
      } else if (status) {
        // Provider is filtering by a non-public status (e.g. PENDING)
        // Return only their own events with that status
        where.provider_id = user_id;
        where.status = status;
      } else {
        // No status filter — show all approved public events plus all of their own events
        where.OR = [{ status: "APPROVED" }, { provider_id: user_id }];
      }
    } else if (role === "ADMIN") {
      // Admins see everything, but can filter by status if they want
      if (status) where.status = status;
    }

    // Category filter — open to all roles
    if (category) {
      where.category = category;
    }

    // Date range filter — open to all roles, applies to event start_time
    if (start_date || end_date) {
      where.start_time = {};
      if (start_date) where.start_time.gte = start_date;
      if (end_date) where.start_time.lte = end_date;
    }

    // provider_id filter — open to all roles
    // USERs can use this to browse a specific provider's public events
    if (provider_id) {
      where.provider_id = provider_id;
    }

    // Full-text search across both language variants of title, description, and location name.
    if (search) {
      const search_condition: Prisma.EventWhereInput = {
        OR: [
          { title_en: { contains: search, mode: "insensitive" } },
          { title_es: { contains: search, mode: "insensitive" } },
          { description_en: { contains: search, mode: "insensitive" } },
          { description_es: { contains: search, mode: "insensitive" } },
          { location_name: { contains: search, mode: "insensitive" } },
          { location_address: { contains: search, mode: "insensitive" } },
        ],
      };

      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        search_condition,
      ];
    }

    // Execute query and total count in parallel.
    const [events, total] = await db.$transaction([
      db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { start_time: "asc" },
        include: {
          provider: {
            select: { id: true, email: true },
          },
          _count: {
            select: { rsvps: true },
          },
        },
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/events — create a new event
//
// Status assignment:
// PROVIDER - PENDING  (enters the admin approval queue)
// ADMIN - APPROVED (bypasses the queue, immediately visible)
//
// provider_id is sourced from the session
// Note: Post-MVP, we may want to allow admins to create events on behalf of providers, which would require accepting an optional provider_id in the request body and validating it.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "PROVIDER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only providers and admins can create events" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = create_event_schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const initial_status = role === "ADMIN" ? "APPROVED" : "PENDING";

    let bilingualFields;
    try {
      bilingualFields = await ensureBilingualEventFields(parsed.data);
    } catch (error) {
      console.error("ensureBilingualEventFields error (create):", error);
      return NextResponse.json(
        {
          error: "Translation service unavailable",
        },
        { status: 502 },
      );
    }

    const event = await db.event.create({
      data: {
        ...parsed.data,
        ...bilingualFields,
        provider_id: session.user.id,
        status: initial_status,
      },
      include: {
        provider: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
