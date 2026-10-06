import { NextResponse } from "next/server";

// ALB health check target (middleware skips /api, so this is reachable unauthenticated).
export function GET() {
    return NextResponse.json({ status: "ok" });
}
