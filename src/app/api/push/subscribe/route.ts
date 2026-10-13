import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const subscription_schema = z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

// POST /api/push/subscribe — save this browser's PushSubscription for the signed-in user
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = subscription_schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const { endpoint, keys } = parsed.data;
        // Endpoint is the natural key; re-subscribing on a shared device moves it to the new user.
        await db.pushSubscription.upsert({
            where: { endpoint },
            create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_id: session.user.id },
            update: { p256dh: keys.p256dh, auth: keys.auth, user_id: session.user.id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /api/push/subscribe error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/push/subscribe — remove this browser's subscription
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = subscription_schema.pick({ endpoint: true }).safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        await db.pushSubscription.deleteMany({
            where: { endpoint: parsed.data.endpoint, user_id: session.user.id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/push/subscribe error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
