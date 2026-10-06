import type { Prisma } from "@/generated/prisma/client";

import {
  normalize_dallas_county_demographics,
  type DallasCountyDemographicsInput,
} from "@/lib/dallas_county_profile";
import { db } from "@/lib/db";

const BREAKDOWN_FIELDS = [
  "race",
  "gender",
  "ethnicity",
  "age_band",
  "marital_status",
  "county_of_residence",
  "employment_status",
  "annual_income_bracket",
  "education_level",
  "primary_language",
] as const;

type BreakdownField = (typeof BREAKDOWN_FIELDS)[number];

type UserAggregate = {
  demographics: DallasCountyDemographicsInput;
  event_ids: Set<string>;
  rsvp_count: number;
};

export type ProviderDemographicsDatasetRow = DallasCountyDemographicsInput & {
  shared_event_count: number;
  shared_rsvp_count: number;
};

export type ProviderDemographicsBreakdownItem = {
  value: string;
  count: number;
  percentage: number;
};

export type ProviderDemographicsAnalytics = {
  summary: {
    shared_user_count: number;
    shared_rsvp_count: number;
    shared_event_count: number;
    total_event_count: number;
    generated_at: string;
    filters: {
      start_date: string | null;
      end_date: string | null;
    };
  };
  breakdowns: Record<BreakdownField, ProviderDemographicsBreakdownItem[]>;
  children: {
    under_5_total: number;
    age_5_to_18_total: number;
    over_18_total: number;
    average_under_5_per_user: number;
    average_5_to_18_per_user: number;
    average_over_18_per_user: number;
  };
  dataset: ProviderDemographicsDatasetRow[];
};

function to_percentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
}

function to_average(total: number, count: number): number {
  if (count === 0) return 0;
  return Number((total / count).toFixed(1));
}

function build_breakdown(
  rows: ProviderDemographicsDatasetRow[],
  field: BreakdownField,
): ProviderDemographicsBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = row[field].trim();
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
      percentage: to_percentage(count, rows.length),
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.value.localeCompare(right.value),
    );
}

function build_dataset_rows(aggregates: Map<string, UserAggregate>) {
  return [...aggregates.values()]
    .map(({ demographics, event_ids, rsvp_count }) => ({
      ...demographics,
      shared_event_count: event_ids.size,
      shared_rsvp_count: rsvp_count,
    }))
    .sort(
      (left, right) =>
        right.shared_rsvp_count - left.shared_rsvp_count ||
        right.shared_event_count - left.shared_event_count ||
        left.age_band.localeCompare(right.age_band) ||
        left.race.localeCompare(right.race),
    );
}

export async function get_provider_demographics_analytics(params: {
  provider_id: string;
  start_date?: Date;
  end_date?: Date;
}): Promise<ProviderDemographicsAnalytics> {
  const event_where: Prisma.EventWhereInput = {
    provider_id: params.provider_id,
  };

  if (params.start_date || params.end_date) {
    event_where.start_time = {};

    if (params.start_date) {
      event_where.start_time.gte = params.start_date;
    }

    if (params.end_date) {
      event_where.start_time.lte = params.end_date;
    }
  }

  const [total_event_count, rsvps] = await db.$transaction([
    db.event.count({ where: event_where }),
    db.rsvp.findMany({
      where: {
        event: event_where,
        user: {
          role: "USER",
          share_with_providers: true,
        },
      },
      select: {
        user_id: true,
        event_id: true,
        user: {
          select: {
            language_pref: true,
            demographics: true,
          },
        },
      },
    }),
  ]);

  const shared_event_ids = new Set<string>();
  const aggregates = new Map<string, UserAggregate>();

  for (const rsvp of rsvps) {
    if (!rsvp.user.demographics) continue;

    shared_event_ids.add(rsvp.event_id);

    const existing = aggregates.get(rsvp.user_id);
    if (existing) {
      existing.event_ids.add(rsvp.event_id);
      existing.rsvp_count += 1;
      continue;
    }

    aggregates.set(rsvp.user_id, {
      demographics: normalize_dallas_county_demographics(
        rsvp.user.demographics,
        rsvp.user.language_pref,
      ),
      event_ids: new Set([rsvp.event_id]),
      rsvp_count: 1,
    });
  }

  const dataset = build_dataset_rows(aggregates);

  const under_5_total = dataset.reduce(
    (sum, row) => sum + row.children_under_5_count,
    0,
  );
  const age_5_to_18_total = dataset.reduce(
    (sum, row) => sum + row.children_5_to_18_count,
    0,
  );
  const over_18_total = dataset.reduce(
    (sum, row) => sum + row.children_over_18_count,
    0,
  );

  const breakdowns = Object.fromEntries(
    BREAKDOWN_FIELDS.map((field) => [field, build_breakdown(dataset, field)]),
  ) as Record<BreakdownField, ProviderDemographicsBreakdownItem[]>;

  return {
    summary: {
      shared_user_count: dataset.length,
      shared_rsvp_count: rsvps.length,
      shared_event_count: shared_event_ids.size,
      total_event_count,
      generated_at: new Date().toISOString(),
      filters: {
        start_date: params.start_date?.toISOString() ?? null,
        end_date: params.end_date?.toISOString() ?? null,
      },
    },
    breakdowns,
    children: {
      under_5_total,
      age_5_to_18_total,
      over_18_total,
      average_under_5_per_user: to_average(under_5_total, dataset.length),
      average_5_to_18_per_user: to_average(age_5_to_18_total, dataset.length),
      average_over_18_per_user: to_average(over_18_total, dataset.length),
    },
    dataset,
  };
}
