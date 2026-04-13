import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { build_dallas_county_demographics_write_data } from "@/lib/dallas_county_profile";
import { register_schema } from "@/lib/validators/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = register_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const {
            username,
            email,
            password,
            language_pref,
            share_with_providers,
            consent,
            ...demographic_data
        } = parsed.data;

        // invariant: consent must always be true after validation
        if (!consent) {
            console.error("Registration invariant violation: consent is false after register_schema validation", {
                email,
            });
            return NextResponse.json(
                { error: "Registration failed due to an internal validation error" },
                { status: 500 },
            );
        }

        // check for existing user
        const [existing_email_user, existing_username_user] = await Promise.all([
            db.user.findUnique({
                where: { email },
            }),
            db.user.findUnique({
                where: { username },
            }),
        ]);

        if (existing_email_user) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 },
            );
        }

        if (existing_username_user) {
            return NextResponse.json(
                { error: "That username is already taken" },
                { status: 409 },
            );
        }

        // hash password (12 salt rounds per tech doc security spec)
        const password_hash = await bcrypt.hash(password, 12);

        // create user + demographics in a transaction
        const user = await db.$transaction(async (tx) => {
            const new_user = await tx.user.create({
                data: {
                    username,
                    email,
                    password_hash,
                    language_pref,
                    share_with_providers,
                    consented_at: consent ? new Date() : null,
                },
            });

            await tx.demographics.create({
                data: {
                    user_id: new_user.id,
                    ...build_dallas_county_demographics_write_data(demographic_data),
                },
            });

            return new_user;
        });

        // structured log for monitoring successful registrations
        console.info("User registered successfully", {
            user_id: user.id,
            has_demographics: true,
        });

        // never return password_hash or other sensitive fields to the client
        return NextResponse.json(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                language_pref: user.language_pref,
                share_with_providers: user.share_with_providers,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
