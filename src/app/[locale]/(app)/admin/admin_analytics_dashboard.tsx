"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

type ApiEvent = {
    id: string;
    _count: { rsvps: number };
    status: string;
};

type PaginatedEventsResponse = {
    events: ApiEvent[];
    pagination: { total: number };
};

export type AdminAnalyticsDashboardProps = {
    total_events: string;
    pending_approvals: string;
    total_rsvps: string;
    loading_events: string;
    error_loading_events: string;
    retry: string;
};

export function AdminAnalyticsDashboard(props: AdminAnalyticsDashboardProps) {
    const [total_events_count, set_total_events_count] = useState(0);
    const [pending_count, set_pending_count] = useState(0);
    const [total_rsvp_sum, set_total_rsvp_sum] = useState(0);
    const [loading, set_loading] = useState(true);
    const [error, set_error] = useState<string | null>(null);

    const fetch_stats = useCallback(async () => {
        set_loading(true);
        set_error(null);
        try {
            const [all_res, pending_res] = await Promise.all([
                fetch("/api/events?page=1&limit=100"),
                fetch("/api/events?page=1&limit=100&status=PENDING"),
            ]);
            if (!all_res.ok || !pending_res.ok) {
                throw new Error("Failed to fetch");
            }
            const all_data = (await all_res.json()) as PaginatedEventsResponse;
            const pending_data = (await pending_res.json()) as PaginatedEventsResponse;
            set_total_events_count(all_data.pagination.total);
            set_pending_count(pending_data.pagination.total);
            const sum = all_data.events.reduce((s, e) => s + e._count.rsvps, 0);
            set_total_rsvp_sum(sum);
        } catch {
            set_error(props.error_loading_events);
        } finally {
            set_loading(false);
        }
    }, [props.error_loading_events]);

    useEffect(() => {
        fetch_stats();
    }, [fetch_stats]);

    if (loading) {
        return (
            <div
                className="card p-4 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
            >
                {props.loading_events}
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-4 flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                    {error}
                </p>
                <Button size="sm" variant="secondary" onClick={fetch_stats}>
                    {props.retry}
                </Button>
            </div>
        );
    }

    return (
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
            <Link href="/admin/events" className="no-underline block">
            <div className="card p-4" style={{ cursor: "pointer" }}>
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
            </Link>
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
    );
}
