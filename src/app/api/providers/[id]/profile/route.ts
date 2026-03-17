import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { update_provider_profile_schema } from "@/lib/validators/provider";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/providers/[id]/profile — fetch a provider's public profile
//
// Auth required (any authenticated user).
// Returns the profile if the user exists and has role=PROVIDER.
// If no profile row exists yet, returns an empty profile shape.
export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const provider = await db.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                provider_profile: true,
            },
        });

        if (!provider || provider.role !== "PROVIDER") {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const profile = provider.provider_profile ?? {
            id: null,
            user_id: provider.id,
            org_name: null,
            bio: null,
            logo_url: null,
            website_url: null,
            contact_email: null,
            contact_phone: null,
        };

        return NextResponse.json({ email: provider.email, ...profile });
    } catch (error) {
        console.error("GET /api/providers/[id]/profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/providers/[id]/profile — create or update a provider's profile
//
// Authorization:
// PROVIDER - may only update their own profile
// ADMIN - may update any provider's profile
// USER - not authorized
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const role = session.user.role;

        if (role === "USER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (role === "PROVIDER" && session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify target user exists and is a provider
        const target = await db.user.findUnique({
            where: { id },
            select: { role: true },
        });

        if (!target || target.role !== "PROVIDER") {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = update_provider_profile_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const profile = await db.providerProfile.upsert({
            where: { user_id: id },
            create: { user_id: id, ...parsed.data },
            update: parsed.data,
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error("PUT /api/providers/[id]/profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
