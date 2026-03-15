"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

export type AdminEventsDashboardProps = {
  title: string;
  subtitle: string;
  pending_events: string;
  all_events: string;
  approve: string;
  reject: string;
  deactivate: string;
  total_events: string;
  pending_approvals: string;
  total_rsvps: string;
  event_title: string;
  provider: string;
  category: string;
  date: string;
  status: string;
  actions: string;
  no_pending: string;
  loading_events: string;
  error_loading_events: string;
  retry: string;
  status_update_success: string;
  status_update_error: string;
  status_cancelled: string;
  edit: string;
  delete: string;
  deleting: string;
  delete_confirm: string;
  delete_success: string;
  delete_error: string;
};

type EventStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type ApiEvent = {
  id: string;
  title_en: string;
  category: string;
  start_time: string;
  status: EventStatus;
  provider: {
    email: string;
  };
  _count: {
    rsvps: number;
  };
};

type PaginatedEventsResponse = {
  events: ApiEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

function get_status_badge_class(status: EventStatus): string {
  if (status === "PENDING") return "badge badge-pending";
  if (status === "APPROVED") return "badge badge-approved";
  if (status === "REJECTED") return "badge badge-rejected";
  if (status === "CANCELLED") return "badge badge-rejected";
  return "badge";
}

function get_category_badge_class(category: string): string {
  const slug = category.toLowerCase().replace(/\s+/g, "");
  return `badge badge-${slug}`;
}

function get_status_label(
  status: EventStatus,
  props: AdminEventsDashboardProps,
): string {
  if (status === "CANCELLED") {
    return props.status_cancelled;
  }
  return status;
}

function format_date(iso_string: string, locale: string): string {
  const d = new Date(iso_string);
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminEventsDashboard(props: AdminEventsDashboardProps) {
  const locale = useLocale();
  const [events, set_events] = useState<ApiEvent[]>([]);
  const [pending_events, set_pending_events] = useState<ApiEvent[]>([]);
  const [total_events_count, set_total_events_count] = useState(0);
  const [pending_count, set_pending_count] = useState(0);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const review_label = locale === "es" ? "Revisar" : "Review";

  const approved_count = useMemo(
    () => events.filter((e) => e.status === "APPROVED").length,
    [events],
  );
  const rejected_count = useMemo(
    () => events.filter((e) => e.status === "REJECTED").length,
    [events],
  );
  const cancelled_count = useMemo(
    () => events.filter((e) => e.status === "CANCELLED").length,
    [events],
  );

  const total_rsvp_sum = useMemo(
    () => events.reduce((sum, e) => sum + e._count.rsvps, 0),
    [events],
  );

  const fetch_events = useCallback(async () => {
    set_loading(true);
    set_error(null);

    try {
      const [all_res, pending_res] = await Promise.all([
        fetch("/api/events?page=1&limit=100"),
        fetch("/api/events?page=1&limit=100&status=PENDING"),
      ]);

      if (!all_res.ok || !pending_res.ok) {
        throw new Error("Failed to fetch events");
      }

      const all_data = (await all_res.json()) as PaginatedEventsResponse;
      const pending_data =
        (await pending_res.json()) as PaginatedEventsResponse;

      set_events(all_data.events);
      set_total_events_count(all_data.pagination.total);
      set_pending_events(pending_data.events);
      set_pending_count(pending_data.pagination.total);
    } catch {
      set_error(props.error_loading_events);
    } finally {
      set_loading(false);
    }
  }, [props.error_loading_events]);

  useEffect(() => {
    fetch_events();
  }, [fetch_events]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {loading && (
        <div
          className="card p-4 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {props.loading_events}
        </div>
      )}

      {error && (
        <div className="card p-4 flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
          <Button size="sm" variant="secondary" onClick={fetch_events}>
            {props.retry}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/events" className="no-underline block">
        <div className="card p-4" style={{ cursor: "pointer" }}>
          <div className="flex items-center gap-3">
            <CalendarDays
              size={20}
              style={{ color: "var(--color-secondary)" }}
            />
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {props.total_events}
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {total_events_count}
              </p>
            </div>
          </div>
        </div>
        </Link>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: "var(--color-warning)" }} />
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {props.pending_approvals}
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {pending_count}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Ticket size={20} style={{ color: "var(--color-accent)" }} />
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {props.total_rsvps}
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {total_rsvp_sum}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {props.pending_events}
        </h2>
        {!loading && pending_events.length === 0 ? (
          <p
            className="text-sm py-8"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {props.no_pending}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-160"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.event_title}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.provider}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.category}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.date}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.status}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending_events.map((evt) => (
                  <tr
                    key={evt.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text)" }}
                    >
                        <Link
                          href={`/events/${evt.id}`}
                          className="font-medium underline underline-offset-2 decoration-transparent hover:decoration-current"
                          style={{ color: "var(--color-text)" }}
                        >
                          {evt.title_en}
                        </Link>
                    </td>
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {evt.provider.email}
                    </td>
                    <td className="px-4 py-2">
                      <span className={get_category_badge_class(evt.category)}>
                        {evt.category}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text)" }}
                    >
                      <span>{format_date(evt.start_time, locale)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={get_status_badge_class(evt.status)}>
                        {get_status_label(evt.status, props)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/events/${evt.id}`}
                          className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground"
                        >
                          {review_label}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-4 md:p-6">
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--color-text)" }}
        >
          {props.all_events}
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {total_events_count} total · {pending_count} pending ·{" "}
          {approved_count} approved · {rejected_count} rejected ·{" "}
          {cancelled_count} {props.status_cancelled.toLowerCase()}
        </p>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-160"
            style={{ borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.event_title}
                </th>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.provider}
                </th>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.category}
                </th>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.date}
                </th>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.status}
                </th>
                <th
                  className="text-left text-xs font-semibold px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {props.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr
                  key={evt.id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td
                    className="px-4 py-2 text-sm"
                    style={{ color: "var(--color-text)" }}
                  >
                    {evt.title_en}
                  </td>
                  <td
                    className="px-4 py-2 text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {evt.provider.email}
                  </td>
                  <td className="px-4 py-2">
                    <span className={get_category_badge_class(evt.category)}>
                      {evt.category}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2 text-sm"
                    style={{ color: "var(--color-text)" }}
                  >
                    <span>{format_date(evt.start_time, locale)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={get_status_badge_class(evt.status)}>
                      {get_status_label(evt.status, props)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/events/${evt.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground"
                      >
                        {review_label}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
