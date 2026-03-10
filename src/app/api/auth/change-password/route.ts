import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { change_password_schema } from "@/lib/validators/auth";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const parsed = change_password_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // verify current password
        const current_valid = await bcrypt.compare(
            parsed.data.current_password,
            user.password_hash,
        );

        if (!current_valid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 403 },
            );
        }

        // hash and update
        const new_hash = await bcrypt.hash(parsed.data.new_password, 12);

        await db.user.update({
            where: { id: session.user.id },
            data: { password_hash: new_hash },
        });

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
