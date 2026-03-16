"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { Users, TrendingUp, CalendarDays, MapPin, ArrowLeft } from "lucide-react";
import type { EventData } from "@/components/event_card";

interface RsvpData {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

interface EventAnalyticsData {
  event: EventData;
  rsvps: RsvpData[];
  rsvp_count: number;
  rsvp_trend: Array<{ date: string; count: number }>;
}

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

// Chart component - simple bar chart for RSVP trend
function RsvpTrendChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
        No RSVP trend data available
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex-1 flex flex-col items-center"
          title={`${item.date}: ${item.count} RSVPs`}
        >
          <div
            style={{
              width: "100%",
              height: `${(item.count / maxCount) * 140}px`,
              background: "var(--color-primary)",
              borderRadius: "4px 4px 0 0",
              minHeight: item.count > 0 ? 4 : 0,
            }}
          />
          <p
            className="text-xs mt-2 text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {item.date}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function EventAnalyticsPage() {
  const t = useTranslations("Events");
  const locale = useLocale();
  const { data: session } = useSession();
  const params = useParams();
  const event_id = params.id as string;

  const [data, setData] = useState<EventAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_event_analytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event_id}`);
      if (res.status === 404) {
        setError(t("error_not_found"));
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch event");

      const event: EventData = await res.json();

      // Check if user is the provider or admin
      const isOwner = session?.user?.id === event.provider_id;
      const isAdmin = session?.user?.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        setError("You don't have permission to view this event's analytics");
        return;
      }

      // For now, simulate RSVP data - in a real app, fetch from API
      // Generate trend data based on event's RSVPs
      const rsvpCount = event._count.rsvps;
      const eventDate = new Date(event.start_time);
      const createdDate = new Date(event.created_at);

      // Create trend data from creation to event start
      const trendData = [];
      let currentDate = new Date(createdDate);
      let accumulatedRsvps = 0;

      while (currentDate <= eventDate) {
        const dayOfWeek = currentDate.getDay();
        // Simulate realistic RSVP distribution (fewer RSVPs on weekends)
        const dailyRate = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.0;
        const dailyRsvps = Math.floor((rsvpCount / 10) * dailyRate);
        accumulatedRsvps = Math.min(accumulatedRsvps + dailyRsvps, rsvpCount);

        trendData.push({
          date: format_date(currentDate.toISOString(), locale),
          count: accumulatedRsvps,
        });

        currentDate.setDate(currentDate.getDate() + 1);
        if (trendData.length > 14) break; // Limit to 14 days for display
      }

      setData({
        event,
        rsvps: [], // Placeholder - would fetch real RSVP data from API
        rsvp_count: rsvpCount,
        rsvp_trend: trendData,
      });
    } catch {
      setError(t("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [event_id, session?.user?.id, session?.user?.role, t, locale]);

  useEffect(() => {
    fetch_event_analytics();
  }, [fetch_event_analytics]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p style={{ color: "var(--color-text-secondary)" }}>{t("loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
            {data.event._count.rsvps} RSVPs
          </div>
        </div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            {data.rsvp_count}
          </p>
        </div>

        {/* Status */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Status
            </p>
            <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.event.status}
          </p>
        </div>

        {/* Category */}
        <div className="card p-6" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Category
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            {data.event.category}
          </p>
        </div>
      </div>

      {/* RSVP Trend Chart */}
      <div className="card p-6 mb-8" style={{ border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text)" }}>
          RSVP Trend
        </h2>
        <RsvpTrendChart data={data.rsvp_trend} />
        <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-secondary)" }}>
          RSVPs from event creation to event date
        </p>
      </div>

      {/* Space for future metrics */}
      <div className="card p-6" style={{ border: "1px dashed var(--color-border)" }}>
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
          More analytics coming soon: <br />
          Demographics breakdown, attendance tracking, and more detailed insights
        </p>
      </div>
    </div>
  );
}
