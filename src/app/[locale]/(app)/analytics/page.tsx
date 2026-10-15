"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
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
type AnalyticsTab = "overview" | "demographics" | "events";

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
  const [active_tab, set_active_tab] = useState<AnalyticsTab>("overview");
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
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
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
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            {session?.user?.role === "ADMIN"
              ? "Platform Analytics"
              : "Your Event Analytics"}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Overview of all your events and engagement metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="analytics-period"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Time Range:
          </label>
          <Select
            id="analytics-period"
            aria-label="Analytics period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as AnalyticsPeriod)
            }
            className="min-w-35"
          >
            {ANALYTICS_PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {get_period_label(option)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-lg mb-6 text-sm"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="text-center py-12"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>{t("loading")}</p>
        </div>
      ) : !stats ? (
        <div
          className="text-center py-12"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>No data available</p>
        </div>
      ) : (
        <>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-5 gap-4 mb-8">
            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total Events
                </p>
                <CalendarDays size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.total_events}
              </p>
            </div>

            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Approved
                </p>
                <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.approved_events}
              </p>
            </div>

            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pending
                </p>
                <Clock size={16} style={{ color: "#f59e0b" }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.pending_events}
              </p>
            </div>

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
                {stats.total_rsvps}
              </p>
            </div>

            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Avg per Event
                </p>
                <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                {stats.average_rsvps_per_event}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
            {(["overview", "demographics", "events"] as const).map((tab) => (
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
                {tab === "demographics" && "Demographic Groups"}
                {tab === "events" && "Events"}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {active_tab === "overview" && (
            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                Event Performance Summary
              </h2>
              <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                    Status Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Active (Approved)
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-text)" }}>
                        {stats.approved_events}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Pending Approval
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-text)" }}>
                        {stats.pending_events}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        Total
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                        {stats.total_events}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                    Engagement Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Total RSVPs
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-text)" }}>
                        {stats.total_rsvps}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Average per Event
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-text)" }}>
                        {stats.average_rsvps_per_event}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Engagement Rate
                      </span>
                      <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                        {stats.total_events > 0
                          ? Math.round(
                              (stats.total_rsvps /
                                (stats.total_events * 10)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demographics Tab */}
          {active_tab === "demographics" && (
            <div className="space-y-6">
              {is_provider ? (
                <>
                  {demographicsError && (
                    <div
                      className="p-4 rounded-lg text-sm"
                      style={{ background: "#fee2e2", color: "#991b1b" }}
                    >
                      {demographicsError}
                    </div>
                  )}

                  {demographicsLoading ? (
                    <div
                      className="text-center py-8"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <p>{t("loading")}</p>
                    </div>
                  ) : demographics?.summary.shared_user_count ? (
                    <>
                      {/* Demographics Summary Cards */}
                      <div className="grid grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-4 gap-4">
                        <div
                          className="card p-6"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <p
                            className="text-xs font-semibold uppercase mb-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            Shared Residents
                          </p>
                          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                            {demographics.summary.shared_user_count}
                          </p>
                        </div>

                        <div
                          className="card p-6"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <p
                            className="text-xs font-semibold uppercase mb-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            Shared RSVPs
                          </p>
                          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                            {demographics.summary.shared_rsvp_count}
                          </p>
                        </div>

                        <div
                          className="card p-6"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <p
                            className="text-xs font-semibold uppercase mb-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            Events with Data
                          </p>
                          <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                            {demographics.summary.shared_event_count}
                          </p>
                        </div>

                        <a
                          href={demographics_export_href}
                          className="card p-6 flex items-center justify-center cursor-pointer no-underline transition-opacity hover:opacity-90"
                          style={{
                            border: "1px solid var(--color-border)",
                            background: "var(--color-primary)",
                          }}
                        >
                          <div className="text-center">
                            <Download size={20} style={{ color: "white", margin: "0 auto 8px" }} />
                            <p className="text-sm font-medium" style={{ color: "white" }}>
                              Download CSV
                            </p>
                          </div>
                        </a>
                      </div>

                      {/* Demographic Breakdowns */}
                      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
                        {BREAKDOWN_CARD_FIELDS.slice(0, 3).map((field) => {
                          const items = demographics.breakdowns[field.key].slice(0, 5);
                          return (
                            <div
                              key={field.key}
                              className="card p-6"
                              style={{ border: "1px solid var(--color-border)" }}
                            >
                              <h3
                                className="text-sm font-semibold mb-4"
                                style={{ color: "var(--color-text)" }}
                              >
                                {auth_t(field.label_key)}
                              </h3>
                              <div className="space-y-3">
                                {items.map((item) => (
                                  <div
                                    key={`${field.key}-${item.value || "empty"}`}
                                    className="flex items-center justify-between"
                                  >
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--color-text-secondary)" }}
                                    >
                                      {item.value || t("analytics_demographics_not_provided")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-1.5 rounded-full"
                                        style={{
                                          width: `${Math.max(30, item.percentage * 2)}px`,
                                          background: "var(--color-primary)",
                                        }}
                                      />
                                      <span
                                        className="text-xs font-medium w-12 text-right"
                                        style={{ color: "var(--color-text)" }}
                                      >
                                        {item.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
                        {BREAKDOWN_CARD_FIELDS.slice(3).map((field) => {
                          const items = demographics.breakdowns[field.key].slice(0, 5);
                          return (
                            <div
                              key={field.key}
                              className="card p-6"
                              style={{ border: "1px solid var(--color-border)" }}
                            >
                              <h3
                                className="text-sm font-semibold mb-4"
                                style={{ color: "var(--color-text)" }}
                              >
                                {auth_t(field.label_key)}
                              </h3>
                              <div className="space-y-3">
                                {items.map((item) => (
                                  <div
                                    key={`${field.key}-${item.value || "empty"}`}
                                    className="flex items-center justify-between"
                                  >
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--color-text-secondary)" }}
                                    >
                                      {item.value || t("analytics_demographics_not_provided")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-1.5 rounded-full"
                                        style={{
                                          width: `${Math.max(30, item.percentage * 2)}px`,
                                          background: "var(--color-primary)",
                                        }}
                                      />
                                      <span
                                        className="text-xs font-medium w-12 text-right"
                                        style={{ color: "var(--color-text)" }}
                                      >
                                        {item.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Children Statistics */}
                      <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
                        <h3
                          className="text-sm font-semibold mb-4"
                          style={{ color: "var(--color-text)" }}
                        >
                          {t("analytics_children_title")}
                        </h3>
                        <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
                          <div
                            className="p-4 rounded-lg"
                            style={{
                              background: "var(--color-surface)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold uppercase mb-2"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {auth_t("children_under_5_count")}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                              {demographics.children.under_5_total}
                            </p>
                          </div>

                          <div
                            className="p-4 rounded-lg"
                            style={{
                              background: "var(--color-surface)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold uppercase mb-2"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {auth_t("children_5_to_18_count")}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                              {demographics.children.age_5_to_18_total}
                            </p>
                          </div>

                          <div
                            className="p-4 rounded-lg"
                            style={{
                              background: "var(--color-surface)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold uppercase mb-2"
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
                    <div
                      className="card p-6 text-center"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      <p style={{ color: "var(--color-text-secondary)" }}>
                        {t("analytics_demographics_empty")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="card p-6 text-center"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    Demographic data is only available for providers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {active_tab === "events" && (
            <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                Events
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
                        className="p-4 rounded-lg flex items-center justify-between cursor-pointer transition-colors border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                        style={{ background: "var(--color-surface)" }}
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
                            {event.status} · {new Date(event.start_time).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4 shrink-0">
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
          )}
        </>
      )}
    </div>
  );
}
