import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user_query_schema } from "@/lib/validators/user";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const raw_params = Object.fromEntries(searchParams.entries());
        const parsed = user_query_schema.safeParse(raw_params);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { page, limit, role, search } = parsed.data;
        const where: Prisma.UserWhereInput = {};
        if (role) where.role = role;
        if (search) {
            where.email = { contains: search, mode: "insensitive" };
        }

        const [users, total] = await db.$transaction([
            db.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: "desc" },
                select: {
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
                },
            }),
            db.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
