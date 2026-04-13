import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { get_provider_demographics_analytics } from "@/lib/provider_demographics_analytics";
import { provider_demographics_query_schema } from "@/lib/validators/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Only providers can access demographic analytics" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const raw_params = Object.fromEntries(searchParams.entries());
    const parsed = provider_demographics_query_schema.safeParse(raw_params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const analytics = await get_provider_demographics_analytics({
      provider_id: session.user.id,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
    });

    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/analytics/demographics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
