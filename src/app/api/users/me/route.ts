import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const update_language_schema = z.object({
    language_pref: z.enum(["en", "es"]),
});

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = update_language_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const updated = await db.user.update({
            where: { id: session.user.id },
            data: { language_pref: parsed.data.language_pref },
            select: { id: true, email: true, role: true, language_pref: true },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH /api/users/me error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
