import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
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

        // username uniqueness (email uniqueness is enforced by Better Auth below)
        const existing_username_user = await db.user.findUnique({ where: { username } });
        if (existing_username_user) {
            return NextResponse.json(
                { error: "That username is already taken" },
                { status: 409 },
            );
        }

        // Better Auth creates the user + credential account (hashes the password).
        // Custom input fields are configured in src/lib/auth.ts.
        let user_id: string;
        try {
            const result = await auth.api.signUpEmail({
                body: {
                    name: username,
                    email,
                    password,
                    username,
                    language_pref,
                    share_with_providers,
                    consented_at: new Date(),
                } as unknown as { name: string; email: string; password: string },
            });
            user_id = result.user.id;
        } catch (e) {
            if (e instanceof APIError) {
                return NextResponse.json(
                    { error: e.message || "An account with this email already exists" },
                    { status: 409 },
                );
            }
            throw e;
        }

        // linter freaks out here for some reason
        await db.demographics.create({
            data: {
                user_id,
                ...build_dallas_county_demographics_write_data(demographic_data),
            },
        });

        console.info("User registered successfully", { user_id, has_demographics: true });

        return NextResponse.json(
            {
                id: user_id,
                username,
                email,
                role: "USER",
                language_pref,
                share_with_providers,
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
