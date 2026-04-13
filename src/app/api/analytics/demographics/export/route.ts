import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { get_provider_demographics_analytics } from "@/lib/provider_demographics_analytics";
import { provider_demographics_query_schema } from "@/lib/validators/analytics";

function escape_csv_value(value: string | number) {
  const string_value = String(value);
  if (
    string_value.includes(",") ||
    string_value.includes("\"") ||
    string_value.includes("\n")
  ) {
    return `"${string_value.replaceAll("\"", "\"\"")}"`;
  }

  return string_value;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Only providers can export demographic analytics" },
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

    const headers = [
      "row_number",
      "race",
      "gender",
      "ethnicity",
      "age_band",
      "marital_status",
      "children_under_5_count",
      "children_5_to_18_count",
      "children_over_18_count",
      "county_of_residence",
      "employment_status",
      "annual_income_bracket",
      "education_level",
      "primary_language",
      "shared_event_count",
      "shared_rsvp_count",
    ];

    const rows = analytics.dataset.map((row, index) =>
      [
        index + 1,
        row.race,
        row.gender,
        row.ethnicity,
        row.age_band,
        row.marital_status,
        row.children_under_5_count,
        row.children_5_to_18_count,
        row.children_over_18_count,
        row.county_of_residence,
        row.employment_status,
        row.annual_income_bracket,
        row.education_level,
        row.primary_language,
        row.shared_event_count,
        row.shared_rsvp_count,
      ]
        .map(escape_csv_value)
        .join(","),
    );

    const csv = `${headers.join(",")}\n${rows.join("\n")}`;
    const filename = `provider-demographics-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/analytics/demographics/export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
