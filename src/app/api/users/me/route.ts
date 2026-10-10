import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    build_dallas_county_demographics_write_data,
    normalize_dallas_county_demographics,
} from "@/lib/dallas_county_profile";
import { update_my_profile_schema } from "@/lib/validators/user";

const my_profile_select = {
    id: true,
    username: true,
    email: true,
    role: true,
    language_pref: true,
    share_with_providers: true,
    consented_at: true,
    interests: {
        select: {
            category_id: true,
        },
    },
    demographics: {
        select: {
            race: true,
            gender: true,
            ethnicity: true,
            age_band: true,
            marital_status: true,
            children_under_5_count: true,
            children_5_to_18_count: true,
            children_over_18_count: true,
            county_of_residence: true,
            employment_status: true,
            annual_income_bracket: true,
            education_level: true,
            primary_language: true,
            age: true,
            annual_personal_income: true,
            annual_household_income: true,
            county: true,
            has_children_under_18: true,
            has_children_under_5: true,
            educational_attainment: true,
            has_personal_vehicle: true,
            is_employed: true,
            industry_area: true,
        },
    },
    rsvps: {
        orderBy: {
            created_at: "desc",
        },
        take: 25,
        select: {
            id: true,
            created_at: true,
            event: {
                select: {
                    id: true,
                    title_en: true,
                    title_es: true,
                    start_time: true,
                    category: {
                        select: {
                            id: true,
                            slug: true,
                            name_en: true,
                            name_es: true,
                            color: true,
                            emoji: true,
                        },
                    },
                    status: true,
                    image_url: true,
                    location_name: true,
                    location_address: true,
                },
            },
        },
    },
} as const;

type CategoryDto = {
    id: string;
    slug: string;
    name_en: string;
    name_es: string;
    color: string;
    emoji: string;
};

type MyProfileUser = {
    id: string;
    username: string | null;
    email: string;
    role: string;
    language_pref: string;
    share_with_providers: boolean;
    consented_at: Date | null;
    interests: { category_id: string }[];
    demographics: {
        race: string;
        gender: string;
        ethnicity: string | null;
        age_band: string;
        marital_status: string | null;
        children_under_5_count: number;
        children_5_to_18_count: number;
        children_over_18_count: number;
        county_of_residence: string;
        employment_status: string | null;
        annual_income_bracket: string | null;
        education_level: string | null;
        primary_language: string;
        age: number | null;
        annual_personal_income: string | null;
        annual_household_income: string | null;
        county: string;
        has_children_under_18: boolean;
        has_children_under_5: boolean;
        educational_attainment: string | null;
        has_personal_vehicle: boolean;
        is_employed: boolean;
        industry_area: string | null;
    } | null;
    rsvps: {
        id: string;
        created_at: Date;
        event: {
            id: string;
            title_en: string;
            title_es: string;
            start_time: Date;
            category: CategoryDto;
            status: string;
            image_url: string | null;
            location_name: string;
            location_address: string | null;
        };
    }[];
};

function serialize_profile(user: MyProfileUser) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        language_pref: user.language_pref,
        share_with_providers: user.share_with_providers,
        consented_at: user.consented_at,
        interests: user.interests.map((interest) => interest.category_id),
        demographics: normalize_dallas_county_demographics(
            user.demographics,
            user.language_pref,
        ),
        rsvps: user.rsvps.map((rsvp) => ({
            id: rsvp.id,
            created_at: rsvp.created_at,
            event: {
                id: rsvp.event.id,
                title_en: rsvp.event.title_en,
                title_es: rsvp.event.title_es,
                start_time: rsvp.event.start_time,
                category: rsvp.event.category,
                status: rsvp.event.status,
                image_url: rsvp.event.image_url,
                location_name: rsvp.event.location_name,
                location_address: rsvp.event.location_address,
            },
        })),
    };
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: my_profile_select,
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(serialize_profile(user));
    } catch (error) {
        console.error("GET /api/users/me error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = update_my_profile_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const current = await db.user.findUnique({
            where: { id: session.user.id },
            select: my_profile_select,
        });

        if (!current) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (
            parsed.data.username !== undefined &&
            parsed.data.username !== current.username
        ) {
            const existing_username = await db.user.findUnique({
                where: {
                    username: parsed.data.username,
                },
                select: { id: true },
            });

            if (existing_username) {
                return NextResponse.json(
                    { error: "That username is already taken" },
                    { status: 409 },
                );
            }
        }

        const updated = await db.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    ...(parsed.data.username !== undefined
                        ? { username: parsed.data.username }
                        : {}),
                    ...(parsed.data.language_pref !== undefined
                        ? { language_pref: parsed.data.language_pref }
                        : {}),
                    ...(parsed.data.share_with_providers !== undefined
                        ? { share_with_providers: parsed.data.share_with_providers }
                        : {}),
                },
            });

            if (parsed.data.demographics) {
                const merged_demographics = {
                    ...normalize_dallas_county_demographics(
                        current.demographics,
                        parsed.data.language_pref ?? current.language_pref,
                    ),
                    ...parsed.data.demographics,
                };

                const demographics_data = build_dallas_county_demographics_write_data(
                    merged_demographics,
                    current.demographics,
                );

                if (current.demographics) {
                    await tx.demographics.update({
                        where: { user_id: session.user.id },
                        data: demographics_data,
                    });
                } else {
                    await tx.demographics.create({
                        data: {
                            user_id: session.user.id,
                            ...demographics_data,
                        },
                    });
                }
            }

            return tx.user.findUniqueOrThrow({
                where: { id: session.user.id },
                select: my_profile_select,
            });
        });

        return NextResponse.json(serialize_profile(updated));
    } catch (error) {
        console.error("PATCH /api/users/me error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
