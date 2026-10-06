import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { change_password_schema } from "@/lib/validators/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = change_password_schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        // Better Auth verifies the current password against the credential account
        // and updates it (401 if unauthenticated, 400 if current password is wrong).
        try {
            await auth.api.changePassword({
                body: {
                    currentPassword: parsed.data.current_password,
                    newPassword: parsed.data.new_password,
                },
                headers: await headers(),
            });
        } catch (e) {
            if (e instanceof APIError) {
                const status = e.status === "UNAUTHORIZED" ? 401 : 403;
                return NextResponse.json(
                    { error: e.message || "Current password is incorrect" },
                    { status },
                );
            }
            throw e;
        }

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
