"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { CalendarDays, Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { EventData } from "@/components/event_card";

interface AnalyticsStats {
  total_events: number;
  approved_events: number;
  pending_events: number;
  total_rsvps: number;
  average_rsvps_per_event: number;
  events: EventData[];
}

function get_period_label(period: string): string {
  const labels: Record<string, string> = {
    week: "Last 7 Days",
    month: "Last 30 Days",
    year: "Last 365 Days",
    all: "All Time",
  };
  return labels[period] || period;
}

export default function AnalyticsPage() {
  const t = useTranslations("Events");
  const { data: session } = useSession();

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year" | "all">("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_analytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");

      // Calculate date range for period
      const now = new Date();
      if (period !== "all") {
        const days = period === "week" ? 7 : period === "month" ? 30 : 365;
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.set("start_date", start.toISOString());
      }

      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data: { events: EventData[] } = await res.json();

      // Calculate stats
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

  useEffect(() => {
    fetch_analytics();
  }, [fetch_analytics]);

  // Only show analytics for providers and admins
  if (session?.user?.role !== "PROVIDER" && session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
          Unauthorized
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          You don't have permission to view analytics.
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
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {session?.user?.role === "ADMIN" ? "Platform Analytics" : "Your Event Analytics"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Overview of all your events and engagement
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["week", "month", "year", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                cursor: "pointer",
                background: period === p ? "var(--color-primary)" : "var(--color-surface)",
                color: period === p ? "#fff" : "var(--color-text)",
                transition: "background .15s, color .15s",
              }}
              onMouseEnter={(e) => {
                if (period !== p) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (period !== p) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface)";
              }}
            >
              {get_period_label(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-lg mb-6 text-sm"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12" style={{ color: "var(--color-text-secondary)" }}>
          <p>{t("loading")}</p>
        </div>
      )}

      {/* Stats grid */}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Events */}
            <div
              className="card p-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total Events
                </p>
                <CalendarDays size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stats.total_events}
              </p>
            </div>

            {/* Approved Events */}
            <div
              className="card p-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Approved
                </p>
                <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stats.approved_events}
              </p>
            </div>

            {/* Pending Events */}
            <div
              className="card p-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pending
                </p>
                <Clock size={16} style={{ color: "var(--color-warning)" }} />
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stats.pending_events}
              </p>
            </div>

            {/* Total RSVPs */}
            <div
              className="card p-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total RSVPs
                </p>
                <Users size={16} style={{ color: "var(--color-accent)" }} />
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stats.total_rsvps}
              </p>
            </div>

            {/* Average RSVPs */}
            <div
              className="card p-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Avg per Event
                </p>
                <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stats.average_rsvps_per_event}
              </p>
            </div>
          </div>

          {/* Events list with individual analytics */}
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
                        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {event.title_en}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                          Status: {event.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {event._count.rsvps}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
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
