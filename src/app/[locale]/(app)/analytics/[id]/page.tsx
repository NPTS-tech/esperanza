"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Users,
  TrendingUp,
  CalendarDays,
  MapPin,
  ArrowLeft,
  Activity,
  Clock3,
  BarChart3,
  PieChart,
  Repeat,
} from "lucide-react";
import type { EventData } from "@/components/event_card";

interface RsvpData {
  id: string;
  user_id: string;
  created_at: string;
}

interface EventAnalyticsData {
  event: EventData;
  summary: {
    total_rsvps: number;
    unique_attendees: number;
    with_demographics: number;
    first_rsvp_at: string | null;
    last_rsvp_at: string | null;
    days_live: number;
    average_daily_rsvps: number;
  };
  rsvp_trend: Array<{ date: string; count: number; cumulative_count: number }>;
  hourly_trend: Array<{ hour: number; count: number }>;
  demographics: {
    age_band: Record<string, number>;
    gender: Record<string, number>;
    employment_status: Record<string, number>;
    annual_income_bracket: Record<string, number>;
    education_level: Record<string, number>;
    race: Record<string, number>;
    ethnicity: Record<string, number>;
    marital_status: Record<string, number>;
    primary_language: Record<string, number>;
    county_of_residence: Record<string, number>;
  };
  family_statistics: {
    with_children_under_5: number;
    with_children_5_to_18: number;
    with_children_over_18: number;
    avg_children_under_5: number;
    avg_children_5_to_18: number;
    avg_children_over_18: number;
    respondents_with_data: number;
  };
  top_cohorts: Array<{ label: string; count: number; percentage: number }>;
  repeat_attendance: {
    repeat_count: number;
    first_time_count: number;
    repeat_percentage: number;
  };
  recent_rsvps: RsvpData[];
}

type Tab = "overview" | "demographics" | "timing" | "cohorts";

function format_date(date_string: string, locale: string) {
  return new Date(date_string).toLocaleDateString(
    locale === "es" ? "es-US" : "en-US",
    { weekday: "short", month: "short", day: "numeric" },
  );
}

function format_time(date_string: string, locale: string) {
  return new Date(date_string).toLocaleTimeString(
    locale === "es" ? "es-US" : "en-US",
    { hour: "numeric", minute: "2-digit" },
  );
}

function format_short_date(date_string: string, locale: string) {
  return new Date(date_string).toLocaleDateString(
    locale === "es" ? "es-US" : "en-US",
    { month: "short", day: "numeric" },
  );
}

function format_hour(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const display_hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display_hour} ${period}`;
}

function DailyTrendChart({
  data,
  locale,
}: {
  data: Array<{ date: string; count: number; cumulative_count: number }>;
  locale: string;
}) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
        No RSVP trend data available
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-48 overflow-x-auto pb-2">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="shrink-0 flex flex-col items-center"
          title={`${item.date}: ${item.count} RSVPs (${item.cumulative_count} cumulative)`}
        >
          <span className="text-[10px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{item.count}</span>
          <div
            style={{
              width: "24px",
              height: `${(item.count / maxCount) * 140}px`,
              background: "var(--color-primary)",
              borderRadius: "4px 4px 0 0",
              minHeight: item.count > 0 ? 4 : 0,
            }}
          />
          <p
            className="text-xs mt-2 text-center whitespace-nowrap"
            style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}
          >
            {format_short_date(item.date, locale)}
          </p>
        </div>
      ))}
    </div>
  );
}

function HourlyTrendChart({
  data,
}: {
  data: Array<{ hour: number; count: number }>;
}) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
        No hourly data available
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-48">
      {data.map((item) => (
        <div
          key={item.hour}
          className="flex-1 flex flex-col items-center"
          title={`${format_hour(item.hour)}: ${item.count} RSVPs`}
        >
          <span className="text-[10px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{item.count > 0 ? item.count : ""}</span>
          <div
            style={{
              width: "100%",
              height: `${(item.count / maxCount) * 140}px`,
              background: "var(--color-accent)",
              borderRadius: "4px 4px 0 0",
              minHeight: item.count > 0 ? 4 : 0,
            }}
          />
          <p
            className="text-xs mt-2 text-center"
            style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}
          >
            {format_hour(item.hour)}
          </p>
        </div>
      ))}
    </div>
  );
}

function DemographicBreakdown({
  title,
  data,
  total_respondents,
}: {
  title: string;
  data: Record<string, number>;
  total_respondents: number;
}) {
  if (!data || Object.keys(data).length === 0 || total_respondents === 0) {
    return null;
  }

  const entries = Object.entries(data)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / total_respondents) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
        {title}
      </h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-3">
            <span
              className="text-xs flex-1 truncate"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {entry.label}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.max(40, entry.percentage * 1.5)}px`,
                  background: "var(--color-primary)",
                }}
              />
              <span
                className="text-xs font-medium w-12 text-right"
                style={{ color: "var(--color-text)" }}
              >
                {entry.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventAnalyticsPage() {
  const t = useTranslations("Events");
  const locale = useLocale();
  const params = useParams();
  const event_id = params.id as string;

  const [data, setData] = useState<EventAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active_tab, set_active_tab] = useState<Tab>("overview");
  const [trend_range, set_trend_range] = useState<"7" | "14" | "30" | "all">("14");

  const fetch_event_analytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event_id}/analytics`, {
        cache: "no-store",
      });

      if (res.status === 404) {
        setError(t("error_not_found"));
        return;
      }
      if (res.status === 403) {
        setError("You don't have permission to view this event's analytics");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch event");

      const analytics: EventAnalyticsData = await res.json();
      setData(analytics);
    } catch {
      setError(t("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [event_id, t]);

  useEffect(() => {
    fetch_event_analytics();
  }, [fetch_event_analytics]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p style={{ color: "var(--color-text-secondary)" }}>{t("loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
          {error || t("error_not_found")}
        </p>
        <Link
          href="/analytics"
          className="text-sm inline-flex items-center gap-1"
          style={{ color: "var(--color-primary)" }}
        >
          <ArrowLeft size={14} />
          Back to Analytics
        </Link>
      </div>
    );
  }

  const title = locale === "es" ? data.event.title_es : data.event.title_en;

  // Filter trend data based on selected range
  const get_filtered_trend = () => {
    const all_data = data.rsvp_trend;
    if (trend_range === "all") return all_data;
    const days = parseInt(trend_range);
    return all_data.slice(-days);
  };

  const filtered_trend = get_filtered_trend();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/analytics"
        className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft size={16} />
        Back to Analytics
      </Link>

      {/* Event header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          {title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            {format_date(data.event.start_time, locale)}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            {data.event.location_name}
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            {data.summary.total_rsvps} RSVPs
          </div>
        </div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-4 gap-4 mb-8">
        {/* Total RSVPs */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Total RSVPs
            </p>
            <Users size={16} style={{ color: "var(--color-accent)" }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.summary.total_rsvps}
          </p>
        </div>

        {/* Unique Attendees */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Unique Guests
            </p>
            <PieChart size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.summary.unique_attendees}
          </p>
        </div>

        {/* With Demographics */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              With Profile Data
            </p>
            <BarChart3 size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.summary.with_demographics}
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {data.summary.unique_attendees > 0
              ? `${Number(((data.summary.with_demographics / data.summary.unique_attendees) * 100).toFixed(0))}% coverage`
              : "No data"}
          </p>
        </div>

        {/* Avg Daily RSVPs */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Avg Daily
            </p>
            <Activity size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.summary.average_daily_rsvps}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["overview", "demographics", "timing", "cohorts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => set_active_tab(tab)}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: active_tab === tab ? "var(--color-primary)" : "transparent",
              color: active_tab === tab ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            {tab === "overview" && "Overview"}
            {tab === "demographics" && "Demographics"}
            {tab === "timing" && "Timing"}
            {tab === "cohorts" && "Demographic Groups"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {active_tab === "overview" && (
        <div className="space-y-8">
          {/* Daily Trend with Range Selector */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Daily RSVP Trend
              </h2>
              <div className="flex gap-2">
                {(["7", "14", "30", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => set_trend_range(range)}
                    className="px-3 py-1 text-xs rounded transition-colors"
                    style={{
                      background:
                        trend_range === range ? "var(--color-primary)" : "var(--color-surface)",
                      color:
                        trend_range === range ? "white" : "var(--color-text-secondary)",
                      border: `1px solid ${
                        trend_range === range ? "var(--color-primary)" : "var(--color-border)"
                      }`,
                    }}
                  >
                    {range === "all" ? "All" : `${range}d`}
                  </button>
                ))}
              </div>
            </div>
            <DailyTrendChart data={filtered_trend} locale={locale} />
            <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-secondary)" }}>
              Showing {filtered_trend.length} days of RSVP activity
            </p>
          </div>

          {/* Recent RSVP Activity */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              Recent RSVP Activity
            </h2>

            {data.recent_rsvps.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                No RSVPs yet for this event.
              </p>
            ) : (
              <div className="space-y-2">
                {data.recent_rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      <Users size={14} />
                      <span className="text-sm">Attendee RSVP</span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Clock3 size={12} />
                      {format_date(rsvp.created_at, locale)} at{" "}
                      {format_time(rsvp.created_at, locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {active_tab === "demographics" && (
        <div className="space-y-8">
          {/* Family Statistics */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text)" }}>
              Family & Children
            </h2>
            <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
              <div>
                <p
                  className="text-xs font-semibold uppercase mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Households with Children
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Under 5 years
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.with_children_under_5}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Ages 5-18
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.with_children_5_to_18}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Over 18 years
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.with_children_over_18}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Average Children per Respondent
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Under 5 years
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.avg_children_under_5}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Ages 5-18
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.avg_children_5_to_18}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Over 18 years
                    </span>
                    <span className="font-bold" style={{ color: "var(--color-text)" }}>
                      {data.family_statistics.avg_children_over_18}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demographics Breakdowns Grid */}
          <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <DemographicBreakdown
                title="Age Groups"
                data={data.demographics.age_band}
                total_respondents={data.summary.with_demographics}
              />
              <DemographicBreakdown
                title="Gender"
                data={data.demographics.gender}
                total_respondents={data.summary.with_demographics}
              />
              <DemographicBreakdown
                title="Race/Ethnicity"
                data={data.demographics.race}
                total_respondents={data.summary.with_demographics}
              />
            </div>

            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <DemographicBreakdown
                title="Employment Status"
                data={data.demographics.employment_status}
                total_respondents={data.summary.with_demographics}
              />
              <DemographicBreakdown
                title="Education Level"
                data={data.demographics.education_level}
                total_respondents={data.summary.with_demographics}
              />
              <DemographicBreakdown
                title="County of Residence"
                data={data.demographics.county_of_residence}
                total_respondents={data.summary.with_demographics}
              />
            </div>
          </div>

          {/* Additional Demographics */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
              <DemographicBreakdown
                title="Income Bracket"
                data={data.demographics.annual_income_bracket}
                total_respondents={data.summary.with_demographics}
              />
              <DemographicBreakdown
                title="Marital Status"
                data={data.demographics.marital_status}
                total_respondents={data.summary.with_demographics}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timing Tab */}
      {active_tab === "timing" && (
        <div className="space-y-8">
          {/* Hourly Pattern */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text)" }}>
              Peak RSVP Times (Hourly)
            </h2>
            <HourlyTrendChart data={data.hourly_trend} />
            <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-secondary)" }}>
              UTC timezone - shows when most RSVPs occurred by hour of day
            </p>
          </div>

          {/* Repeat Attendance */}
          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text)" }}>
              Attendee Patterns
            </h2>
            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
              <div
                className="p-6 rounded-lg"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    First Time
                  </p>
                  <Users size={16} style={{ color: "var(--color-primary)" }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {data.repeat_attendance.first_time_count}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {data.summary.unique_attendees > 0
                    ? `${Number(
                        (
                          (data.repeat_attendance.first_time_count /
                            data.summary.unique_attendees) *
                          100
                        ).toFixed(0),
                      )}% of attendees`
                    : "No data"}
                </p>
              </div>

              <div
                className="p-6 rounded-lg"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Return Visitors
                  </p>
                  <Repeat size={16} style={{ color: "var(--color-accent)" }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {data.repeat_attendance.repeat_count}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {data.repeat_attendance.repeat_percentage}% of attendees
                </p>
              </div>

              <div
                className="p-6 rounded-lg"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Peak Activity
                  </p>
                  <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                  {data.hourly_trend.length > 0
                    ? (() => {
                        const max = data.hourly_trend.reduce((a, b) =>
                          a.count > b.count ? a : b,
                        );
                        return format_hour(max.hour);
                      })()
                    : "N/A"}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Most RSVPs received at this time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cohorts Tab */}
      {active_tab === "cohorts" && (
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text)" }}>
            Top Demographic Groups
          </h2>

          {data.top_cohorts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Not enough demographic data to display cohorts
            </p>
          ) : (
            <div className="space-y-3">
              {data.top_cohorts.map((cohort, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full"
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "var(--color-text)" }}>
                        {cohort.label}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {cohort.count} attendees
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {cohort.percentage}%
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      of RSVPs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
