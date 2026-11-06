import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const native_push_schema = z.object({
    token: z.string().min(10),
    platform: z.enum(["ios", "android"]),
});

// POST /api/push/native — register or update a native APNs/FCM device token
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = native_push_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid token data", details: parsed.error.issues }, { status: 400 });
        }

        const { token, platform } = parsed.data;
        // Native tokens use a standardized synthetic URI endpoint:
        // native://<platform>/<token>
        const syntheticEndpoint = `native://${platform}/${token}`;

        await db.pushSubscription.upsert({
            where: { endpoint: syntheticEndpoint },
            create: {
                endpoint: syntheticEndpoint,
                p256dh: `native-${platform}`,
                auth: `native-token`,
                user_id: session.user.id,
            },
            update: {
                user_id: session.user.id,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /api/push/native error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/push/native — unregister a native device token
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = native_push_schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid token data" }, { status: 400 });
        }

        const syntheticEndpoint = `native://${parsed.data.platform}/${parsed.data.token}`;

        await db.pushSubscription.deleteMany({
            where: { endpoint: syntheticEndpoint, user_id: session.user.id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/push/native error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
