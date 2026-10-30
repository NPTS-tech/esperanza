import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { admin_create_user_schema, user_query_schema } from "@/lib/validators/user";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = admin_create_user_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { username, email, password, role, language_pref } = parsed.data;

        // Uniqueness of username and email (email is also enforced by the DB).
        const existing_username_user = await db.user.findUnique({ where: { username } });
        if (existing_username_user) {
            return NextResponse.json(
                { error: "That username is already taken" },
                { status: 409 },
            );
        }
        const existing_email_user = await db.user.findUnique({ where: { email } });
        if (existing_email_user) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 },
            );
        }

        // Created directly via Prisma instead of auth.api.signUpEmail so that no
        // session cookie is set — signing up through the auth API would sign the
        // admin's browser into the newly created account. Same shape as the seed
        // script: user row + "credential" account row holding the password hash.
        const password_hash = await hashPassword(password);
        const user = await db.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    name: username,
                    username,
                    email,
                    emailVerified: true,
                    role,
                    language_pref,
                    share_with_providers: false,
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    language_pref: true,
                    created_at: true,
                },
            });

            // Better Auth stores the password on a "credential" account row keyed
            // by the user's id, not on the user itself.
            await tx.account.create({
                data: {
                    accountId: created.id,
                    providerId: "credential",
                    userId: created.id,
                    password: password_hash,
                },
            });

            return created;
        });

        console.info("Admin created user", {
            admin_id: session.user.id,
            user_id: user.id,
            role,
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("POST /api/users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
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
            where.email = { contains: search };
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
