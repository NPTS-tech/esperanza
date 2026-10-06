import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_user_role_schema } from "@/lib/validators/user";

type RouteContext = { params: Promise<{ id: string }> };

const user_select = {
    id: true,
    email: true,
    role: true,
    language_pref: true,
    consented_at: true,
    created_at: true,
    demographics: {
        select: {
            race: true,
            gender: true,
            age: true,
            county: true,
        },
    },
    _count: {
        select: { rsvps: true },
    },
} as const;

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const user = await db.user.findUnique({
            where: { id },
            select: user_select,
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        console.error("GET /api/users/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        if (id === session.user.id) {
            return NextResponse.json(
                { error: "You cannot change your own role" },
                { status: 400 },
            );
        }

        const body = await request.json();
        const parsed = update_user_role_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const updated = await db.user.update({
            where: { id },
            data: { role: parsed.data.role },
            select: {
                id: true,
                email: true,
                role: true,
                language_pref: true,
                created_at: true,
            },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH /api/users/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

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
        if (id === session.user.id) {
            return NextResponse.json(
                { error: "You cannot delete your own account" },
                { status: 400 },
            );
        }

        await db.$transaction([
            db.rsvp.deleteMany({ where: { event: { provider_id: id } } }),
            db.event.deleteMany({ where: { provider_id: id } }),
            db.rsvp.deleteMany({ where: { user_id: id } }),
            db.analyticsEvent.deleteMany({ where: { user_id: id } }),
            db.demographics.deleteMany({ where: { user_id: id } }),
            db.announcement.deleteMany({ where: { author_id: id } }),
            db.user.delete({ where: { id } }),
        ]);
        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("DELETE /api/users/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
