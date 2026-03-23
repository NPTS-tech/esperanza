import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ical from "ical-generator";

type RouteContext = { params: Promise<{ id: string }> };

function slugify(s: string): string {
    return s
        .slice(0, 50)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .toLowerCase() || "event";
}

// GET /api/events/[id]/ics — same visibility as GET /api/events/[id]
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const event = await db.event.findUnique({
            where: { id },
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

        const localeParam = request.nextUrl.searchParams.get("locale");
        const useEs = localeParam === "es";
        const summary = useEs ? event.title_es : event.title_en;
        const description = useEs ? event.description_es : event.description_en;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://esperanza.local";
        const locale = useEs ? "es" : "en";
        const eventUrl = `${baseUrl}/${locale}/events/${event.id}`;
        const location = event.location_address
            ? `${event.location_name}, ${event.location_address}`
            : event.location_name;

        const calendar = ical({ name: "Esperanza Event" });
        calendar.createEvent({
            id: `${event.id}@${new URL(baseUrl).hostname}`,
            start: event.start_time,
            end: event.end_time,
            summary: summary || event.title_en,
            description: (description || event.description_en)?.slice(0, 3000),
            location,
            url: eventUrl,
        });

        const icsString = calendar.toString();
        const filename = `${slugify(summary || "event")}.ics`;

        return new Response(icsString, {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("GET /api/events/[id]/ics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
