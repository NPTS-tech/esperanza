import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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

        const { email, password, language_pref, consent, ...demographic_data } = parsed.data;

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
        const existing_user = await db.user.findUnique({
            where: { email },
        });

        if (existing_user) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 },
            );
        }

        // hash password (12 salt rounds per tech doc security spec)
        const password_hash = await bcrypt.hash(password, 12);

        // create user + demographics in a transaction
        const user = await db.$transaction(async (tx) => {
            const new_user = await tx.user.create({
                data: {
                    email,
                    password_hash,
                    language_pref,
                    consented_at: consent ? new Date() : null,
                },
            });

            // always create demographics for new users (all fields are now required by validation)
            await tx.demographics.create({
                data: {
                    user_id: new_user.id,
                    race: demographic_data.race,
                    gender: demographic_data.gender,
                    age: demographic_data.age,
                    annual_personal_income: demographic_data.annual_personal_income,
                    annual_household_income: demographic_data.annual_household_income,
                    county: demographic_data.county,
                    has_children_under_18: demographic_data.has_children_under_18,
                    has_children_under_5: demographic_data.has_children_under_5,
                    educational_attainment: demographic_data.educational_attainment,
                    has_personal_vehicle: demographic_data.has_personal_vehicle,
                    is_employed: demographic_data.is_employed,
                    industry_area: demographic_data.industry_area,
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
                email: user.email,
                role: user.role,
                language_pref: user.language_pref,
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
