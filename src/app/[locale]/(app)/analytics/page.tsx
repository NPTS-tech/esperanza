"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  TrendingUp,
  Users,
} from "lucide-react";

import type { EventData } from "@/components/event_card";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/routing";

interface AnalyticsStats {
  total_events: number;
  approved_events: number;
  pending_events: number;
  total_rsvps: number;
  average_rsvps_per_event: number;
  events: EventData[];
}

interface DemographicBreakdownItem {
  value: string;
  count: number;
  percentage: number;
}

interface ProviderDemographicsAnalytics {
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
  breakdowns: {
    race: DemographicBreakdownItem[];
    gender: DemographicBreakdownItem[];
    ethnicity: DemographicBreakdownItem[];
    age_band: DemographicBreakdownItem[];
    marital_status: DemographicBreakdownItem[];
    county_of_residence: DemographicBreakdownItem[];
    employment_status: DemographicBreakdownItem[];
    annual_income_bracket: DemographicBreakdownItem[];
    education_level: DemographicBreakdownItem[];
    primary_language: DemographicBreakdownItem[];
  };
  children: {
    under_5_total: number;
    age_5_to_18_total: number;
    over_18_total: number;
    average_under_5_per_user: number;
    average_5_to_18_per_user: number;
    average_over_18_per_user: number;
  };
}

type AnalyticsPeriod = "week" | "month" | "year" | "all";

const BREAKDOWN_CARD_FIELDS = [
  { key: "race", label_key: "race" },
  { key: "gender", label_key: "gender" },
  { key: "ethnicity", label_key: "ethnicity" },
  { key: "age_band", label_key: "age_band" },
  { key: "county_of_residence", label_key: "county" },
  { key: "employment_status", label_key: "employment_status" },
] as const;

const ANALYTICS_PERIOD_OPTIONS: AnalyticsPeriod[] = [
  "week",
  "month",
  "year",
  "all",
];

function get_period_label(period: string): string {
  const labels: Record<string, string> = {
    week: "Last 7 Days",
    month: "Last 30 Days",
    year: "Last 365 Days",
    all: "All Time",
  };
  return labels[period] || period;
}

function build_period_search_params(period: AnalyticsPeriod) {
  const params = new URLSearchParams();

  if (period === "all") {
    return params;
  }

  const now = new Date();
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  params.set("start_date", start.toISOString());
  params.set("end_date", now.toISOString());

  return params;
}

export default function AnalyticsPage() {
  const t = useTranslations("Events");
  const auth_t = useTranslations("Auth");
  const { data: session } = useSession();

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [demographics, setDemographics] =
    useState<ProviderDemographicsAnalytics | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demographicsLoading, setDemographicsLoading] = useState(false);
  const [demographicsError, setDemographicsError] = useState<string | null>(
    null,
  );

  const is_provider = session?.user?.role === "PROVIDER";

  const fetch_analytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = build_period_search_params(period);
      params.set("page", "1");
      params.set("limit", "100");

      const res = await fetch(`/api/events?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");

      const data: { events: EventData[] } = await res.json();

      const total_events = data.events.length;
      const approved = data.events.filter((e) => e.status === "APPROVED").length;
      const pending = data.events.filter((e) => e.status === "PENDING").length;
      const total_rsvps = data.events.reduce((sum, e) => sum + e._count.rsvps, 0);
      const avg_rsvps = total_events > 0 ? Math.round(total_rsvps / total_events) : 0;

      setStats({
        total_events,
        approved_events: approved,
        pending_events: pending,
        total_rsvps,
        average_rsvps_per_event: avg_rsvps,
        events: data.events,
      });
    } catch {
      setError(t("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  const fetch_demographics = useCallback(async () => {
    if (!is_provider) {
      setDemographics(null);
      setDemographicsError(null);
      setDemographicsLoading(false);
      return;
    }

    setDemographicsLoading(true);
    setDemographicsError(null);

    try {
      const params = build_period_search_params(period);
      const query = params.toString();
      const res = await fetch(
        query
          ? `/api/analytics/demographics?${query}`
          : "/api/analytics/demographics",
        { cache: "no-store" },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch demographic analytics");
      }

      const data: ProviderDemographicsAnalytics = await res.json();
      setDemographics(data);
    } catch {
      setDemographicsError(t("analytics_demographics_error"));
    } finally {
      setDemographicsLoading(false);
    }
  }, [is_provider, period, t]);

  useEffect(() => {
    fetch_analytics();
  }, [fetch_analytics]);

  useEffect(() => {
    fetch_demographics();
  }, [fetch_demographics]);

  const demographics_export_href = useMemo(() => {
    const params = build_period_search_params(period).toString();
    return params
      ? `/api/analytics/demographics/export?${params}`
      : "/api/analytics/demographics/export";
  }, [period]);

  if (session?.user?.role !== "PROVIDER" && session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: "var(--color-text)" }}
        >
          Unauthorized
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          You don&apos;t have permission to view analytics.
        </p>
        <Link
          href="/"
          className="text-sm mt-4 inline-block"
          style={{ color: "var(--color-primary)" }}
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {session?.user?.role === "ADMIN"
              ? "Platform Analytics"
              : "Your Event Analytics"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Overview of all your events and engagement
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor="analytics-period"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Time Range
          </label>
          <Select
            id="analytics-period"
            aria-label="Analytics period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as AnalyticsPeriod)
            }
            className="min-w-[180px]"
          >
            {ANALYTICS_PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {get_period_label(option)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div
          className="p-4 rounded-lg mb-6 text-sm"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          className="text-center py-12"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>{t("loading")}</p>
        </div>
      )}

      {!loading && stats && (
        <>
          {is_provider && (
            <div
              className="card p-6 mb-8"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {t("analytics_demographics_title")}
                  </h2>
                  <p
                    className="text-sm mt-1 max-w-3xl"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {t("analytics_demographics_subtitle")}
                  </p>
                </div>

                <a
                  href={demographics_export_href}
                  className="inline-flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 no-underline"
                  style={{
                    color: "#fff",
                    background: "var(--color-primary)",
                  }}
                >
                  <Download size={14} />
                  {t("analytics_demographics_export")}
                </a>
              </div>

              <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
                {t("analytics_demographics_note")}
              </p>

              {demographicsError && (
                <div
                  className="p-4 rounded-lg mb-4 text-sm"
                  style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                  {demographicsError}
                </div>
              )}

              {demographicsLoading ? (
                <p style={{ color: "var(--color-text-secondary)" }}>{t("loading")}</p>
              ) : demographics?.summary.shared_user_count ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div
                      className="rounded-lg p-4"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {t("analytics_shared_residents")}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                        {demographics.summary.shared_user_count}
                      </p>
                    </div>

                    <div
                      className="rounded-lg p-4"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {t("analytics_shared_rsvps")}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                        {demographics.summary.shared_rsvp_count}
                      </p>
                    </div>

                    <div
                      className="rounded-lg p-4"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {t("analytics_shared_events")}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                        {demographics.summary.shared_event_count}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                    {BREAKDOWN_CARD_FIELDS.map((field) => {
                      const items = demographics.breakdowns[field.key].slice(0, 3);

                      return (
                        <div
                          key={field.key}
                          className="rounded-lg p-4"
                          style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <h3
                            className="text-sm font-semibold mb-3"
                            style={{ color: "var(--color-text)" }}
                          >
                            {auth_t(field.label_key)}
                          </h3>

                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={`${field.key}-${item.value || "empty"}`}
                                className="flex items-start justify-between gap-3"
                              >
                                <span
                                  className="text-sm"
                                  style={{ color: "var(--color-text)" }}
                                >
                                  {item.value || t("analytics_demographics_not_provided")}
                                </span>
                                <span
                                  className="text-xs font-medium whitespace-nowrap"
                                  style={{ color: "var(--color-text-secondary)" }}
                                >
                                  {item.count} ({item.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <h3
                      className="text-sm font-semibold mb-3"
                      style={{ color: "var(--color-text)" }}
                    >
                      {t("analytics_children_title")}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div
                        className="rounded-lg p-4"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {auth_t("children_under_5_count")}
                        </p>
                        <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                          {demographics.children.under_5_total}
                        </p>
                      </div>

                      <div
                        className="rounded-lg p-4"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {auth_t("children_5_to_18_count")}
                        </p>
                        <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                          {demographics.children.age_5_to_18_total}
                        </p>
                      </div>

                      <div
                        className="rounded-lg p-4"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {auth_t("children_over_18_count")}
                        </p>
                        <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                          {demographics.children.over_18_total}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {t("analytics_demographics_empty")}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total Events
                </p>
                <CalendarDays size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.total_events}
              </p>
            </div>

            <div className="card p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Approved
                </p>
                <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.approved_events}
              </p>
            </div>

            <div className="card p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pending
                </p>
                <Clock size={16} style={{ color: "var(--color-warning)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.pending_events}
              </p>
            </div>

            <div className="card p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total RSVPs
                </p>
                <Users size={16} style={{ color: "var(--color-accent)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.total_rsvps}
              </p>
            </div>

            <div className="card p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Avg per Event
                </p>
                <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.average_rsvps_per_event}
              </p>
            </div>
          </div>

          <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              Event Breakdown
            </h2>

            {stats.events.length === 0 ? (
              <p
                className="text-sm text-center py-8"
                style={{ color: "var(--color-text-secondary)" }}
              >
                No events found for this period
              </p>
            ) : (
              <div className="space-y-3">
                {stats.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/analytics/${event.id}`}
                    className="block no-underline"
                  >
                    <div
                      className="p-4 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--color-border)";
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {event.title_en}
                        </h3>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Status: {event.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--color-text)" }}
                          >
                            {event._count.rsvps}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            RSVPs
                          </p>
                        </div>
                        <span style={{ color: "var(--color-text-secondary)" }}>›</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
