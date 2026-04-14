import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

type TrendPoint = {
  date: string;
  count: number;
  cumulative_count: number;
};

type HourlyTrendPoint = {
  hour: number;
  count: number;
};

type DemographicBreakdown = {
  [key: string]: number;
};

type CohortData = {
  label: string;
  count: number;
  percentage: number;
};

function to_utc_day_key(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function start_of_day_utc(value: Date): Date {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function next_day_utc(value: Date): Date {
  const d = new Date(value);
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function build_rsvp_trend(params: {
  rsvp_dates: Date[];
  start_date: Date;
  end_date: Date;
}): TrendPoint[] {
  // Normalize to start of day for consistent comparison
  const norm_start = start_of_day_utc(params.start_date);
  const norm_end = start_of_day_utc(params.end_date);

  if (norm_end < norm_start) {
    return [];
  }

  const counts_by_day = new Map<string, number>();
  for (const date of params.rsvp_dates) {
    const key = to_utc_day_key(date);
    counts_by_day.set(key, (counts_by_day.get(key) ?? 0) + 1);
  }

  const trend: TrendPoint[] = [];
  let cursor = new Date(norm_start);
  let cumulative_count = 0;

  // Build trend for each day from start to end (inclusive)
  while (cursor <= norm_end) {
    const key = to_utc_day_key(cursor);
    const count = counts_by_day.get(key) ?? 0;
    cumulative_count += count;

    trend.push({
      date: key,
      count,
      cumulative_count,
    });

    cursor = next_day_utc(cursor);
  }

  return trend;
}

function build_hourly_trend(rsvp_dates: Date[]): HourlyTrendPoint[] {
  const hourly_counts = new Map<number, number>();

  for (const date of rsvp_dates) {
    const hour = date.getUTCHours();
    hourly_counts.set(hour, (hourly_counts.get(hour) ?? 0) + 1);
  }

  const trend: HourlyTrendPoint[] = [];
  for (let hour = 0; hour < 24; hour++) {
    trend.push({
      hour,
      count: hourly_counts.get(hour) ?? 0,
    });
  }

  return trend;
}

function build_demographic_breakdowns(rsvps: Array<{ user: { demographics: any | null } }>): {
  age_band: DemographicBreakdown;
  gender: DemographicBreakdown;
  employment_status: DemographicBreakdown;
  annual_income_bracket: DemographicBreakdown;
  education_level: DemographicBreakdown;
  race: DemographicBreakdown;
  ethnicity: DemographicBreakdown;
  marital_status: DemographicBreakdown;
  primary_language: DemographicBreakdown;
  county_of_residence: DemographicBreakdown;
} {
  const breakdowns = {
    age_band: {} as DemographicBreakdown,
    gender: {} as DemographicBreakdown,
    employment_status: {} as DemographicBreakdown,
    annual_income_bracket: {} as DemographicBreakdown,
    education_level: {} as DemographicBreakdown,
    race: {} as DemographicBreakdown,
    ethnicity: {} as DemographicBreakdown,
    marital_status: {} as DemographicBreakdown,
    primary_language: {} as DemographicBreakdown,
    county_of_residence: {} as DemographicBreakdown,
  };

  for (const rsvp of rsvps) {
    const demo = rsvp.user.demographics;
    if (!demo) continue;

    const fields: Array<[keyof typeof breakdowns, string | null]> = [
      ["age_band", demo.age_band],
      ["gender", demo.gender],
      ["employment_status", demo.employment_status],
      ["annual_income_bracket", demo.annual_income_bracket],
      ["education_level", demo.education_level],
      ["race", demo.race],
      ["ethnicity", demo.ethnicity],
      ["marital_status", demo.marital_status],
      ["primary_language", demo.primary_language],
      ["county_of_residence", demo.county_of_residence],
    ];

    for (const [field, value] of fields) {
      const label = value || "Not provided";
      breakdowns[field][label] = (breakdowns[field][label] ?? 0) + 1;
    }
  }

  return breakdowns;
}

function build_family_statistics(rsvps: Array<{ user: { demographics: any | null } }>): {
  with_children_under_5: number;
  with_children_5_to_18: number;
  with_children_over_18: number;
  avg_children_under_5: number;
  avg_children_5_to_18: number;
  avg_children_over_18: number;
  respondents_with_data: number;
} {
  let with_under_5 = 0;
  let with_5_to_18 = 0;
  let with_over_18 = 0;
  let total_under_5 = 0;
  let total_5_to_18 = 0;
  let total_over_18 = 0;
  let respondents = 0;

  for (const rsvp of rsvps) {
    const demo = rsvp.user.demographics;
    if (!demo) continue;

    respondents++;

    if ((demo.children_under_5_count ?? 0) > 0) with_under_5++;
    if ((demo.children_5_to_18_count ?? 0) > 0) with_5_to_18++;
    if ((demo.children_over_18_count ?? 0) > 0) with_over_18++;

    total_under_5 += demo.children_under_5_count ?? 0;
    total_5_to_18 += demo.children_5_to_18_count ?? 0;
    total_over_18 += demo.children_over_18_count ?? 0;
  }

  return {
    with_children_under_5: with_under_5,
    with_children_5_to_18: with_5_to_18,
    with_children_over_18: with_over_18,
    avg_children_under_5: respondents > 0 ? Number((total_under_5 / respondents).toFixed(2)) : 0,
    avg_children_5_to_18: respondents > 0 ? Number((total_5_to_18 / respondents).toFixed(2)) : 0,
    avg_children_over_18: respondents > 0 ? Number((total_over_18 / respondents).toFixed(2)) : 0,
    respondents_with_data: respondents,
  };
}

function build_top_cohorts(
  rsvps: Array<{ user: { demographics: any | null } }>,
  total_rsvps: number
): CohortData[] {
  const cohort_counts = new Map<string, number>();

  for (const rsvp of rsvps) {
    const demo = rsvp.user.demographics;
    if (!demo) continue;

    // Build cohort labels from key demographics
    const age = demo.age_band || "Unknown";
    const employment = demo.employment_status || "Not specified";
    const cohort_label = `${age} / ${employment}`;

    cohort_counts.set(cohort_label, (cohort_counts.get(cohort_label) ?? 0) + 1);
  }

  return Array.from(cohort_counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / total_rsvps) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 cohorts
}

function calculate_repeat_attendees(
  rsvps: Array<{ user_id: string }>,
  event_id: string
): { repeat_count: number; first_time_count: number; repeat_percentage: number } {
  const user_counts = new Map<string, number>();

  for (const rsvp of rsvps) {
    user_counts.set(rsvp.user_id, (user_counts.get(rsvp.user_id) ?? 0) + 1);
  }

  // A repeat attendee is someone who has RSVPd to this event more than once
  // (though should be unique constraint, so likely just counting unique attendees)
  let repeat_count = 0;
  let first_time_count = 0;

  for (const count of user_counts.values()) {
    if (count > 1) repeat_count++;
    else first_time_count++;
  }

  const repeat_percentage =
    user_counts.size > 0 ? Number(((repeat_count / user_counts.size) * 100).toFixed(1)) : 0;

  return { repeat_count, first_time_count, repeat_percentage };
}

// GET /api/events/[id]/analytics — detailed analytics for a single event
//
// Authorization:
// PROVIDER - may only view analytics for their own events
// ADMIN - may view analytics for any event
// USER - not authorized
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "PROVIDER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only providers and admins can view event analytics" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            provider_profile: {
              select: { org_name: true, logo_url: true },
            },
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const is_owner = event.provider_id === session.user.id;
    if (role === "PROVIDER" && !is_owner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rsvps = await db.rsvp.findMany({
      where: { event_id: id },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        user_id: true,
        created_at: true,
        user: {
          select: {
            demographics: true,
          },
        },
      },
    });

    const event_created_at = new Date(event.created_at);
    const event_start_time = new Date(event.start_time);
    const now = new Date();
    const trend_end_date = event_start_time < now ? event_start_time : now;

    const trend = build_rsvp_trend({
      rsvp_dates: rsvps.map((item) => item.created_at),
      start_date: event_created_at,
      end_date: trend_end_date,
    });

    const hourly_trend = build_hourly_trend(rsvps.map((item) => item.created_at));

    const demographics = build_demographic_breakdowns(rsvps);
    const family_stats = build_family_statistics(rsvps);
    const top_cohorts = build_top_cohorts(rsvps, rsvps.length);
    const repeat_stats = calculate_repeat_attendees(rsvps, id);

    const recent_rsvps = rsvps.slice(-10).reverse();
    const first_rsvp_at = rsvps.length > 0 ? rsvps[0].created_at.toISOString() : null;
    const last_rsvp_at = rsvps.length > 0 ? rsvps[rsvps.length - 1].created_at.toISOString() : null;
    const days_live = Math.max(
      1,
      Math.ceil(
        (trend_end_date.getTime() - event_created_at.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1,
    );

    // Calculate unique attendees and those with demographics data
    const unique_attendees = new Set(rsvps.map((r) => r.user_id)).size;
    const with_demographics = rsvps.filter((r) => r.user.demographics).length;

    return NextResponse.json(
      {
        event,
        summary: {
          total_rsvps: rsvps.length,
          unique_attendees,
          with_demographics,
          first_rsvp_at,
          last_rsvp_at,
          days_live,
          average_daily_rsvps: Number((rsvps.length / days_live).toFixed(2)),
        },
        rsvp_trend: trend,
        hourly_trend,
        demographics,
        family_statistics: family_stats,
        top_cohorts,
        repeat_attendance: repeat_stats,
        recent_rsvps: recent_rsvps.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          created_at: r.created_at.toISOString(),
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/events/[id]/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
