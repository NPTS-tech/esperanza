"use client";

import { useState } from "react";
import { Users, CalendarDays, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, get_category_badge_variant, get_status_badge_variant, get_role_badge_variant } from "@/components/ui/badge";
import { format_date } from "@/lib/utils";
import {
    mock_users,
    mock_events,
    type MockUser,
    type MockEvent
} from "@/lib/mock_data";

export type AdminDashboardProps = {
    title: string;
    subtitle: string;
    pending_events: string;
    all_events: string;
    user_management: string;
    approve: string;
    reject: string;
    deactivate: string;
    total_users: string;
    total_events: string;
    pending_approvals: string;
    total_rsvps: string;
    event_title: string;
    provider: string;
    category: string;
    date: string;
    status: string;
    actions: string;
    email: string;
    role: string;
    created: string;
    no_pending: string;
    deactivated: string;
};

type ExtendedMockUser = MockUser & { deactivated?: boolean };

export function AdminDashboard(props: AdminDashboardProps) {
    const [events, set_events] = useState<MockEvent[]>(() => [...mock_events]);
    const [users, set_users] = useState<ExtendedMockUser[]>(() =>
        mock_users.map((u) => ({ ...u, deactivated: false }))
    );

    const pending_count = events.filter((e) => e.status === "PENDING").length;
    const approved_count = events.filter((e) => e.status === "APPROVED").length;
    const rejected_count = events.filter((e) => e.status === "REJECTED").length;
    const total_rsvp_sum = events.reduce((sum, e) => sum + e.rsvp_count, 0);
    const pending_events = events.filter((e) => e.status === "PENDING");

    function handle_approve_event(event_id: string) {
        set_events((prev) =>
            prev.map((e) => e.id === event_id ? { ...e, status: "APPROVED" as const } : e)
        );
    }

    function handle_reject_event(event_id: string) {
        set_events((prev) =>
            prev.map((e) => e.id === event_id ? { ...e, status: "REJECTED" as const } : e)
        );
    }

    function handle_deactivate_user(user_id: string) {
        set_users((prev) =>
            prev.map((u) => u.id === user_id ? { ...u, deactivated: true } : u)
        );
    }

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label={props.total_users}
                    value={users.length}
                    icon={<Users size={20} />}
                    iconColor="var(--color-primary)"
                />
                <StatCard
                    label={props.total_events}
                    value={events.length}
                    icon={<CalendarDays size={20} />}
                    iconColor="var(--color-secondary)"
                />
                <StatCard
                    label={props.pending_approvals}
                    value={pending_count}
                    icon={<AlertCircle size={20} />}
                    iconColor="var(--color-warning)"
                />
                <StatCard
                    label={props.total_rsvps}
                    value={total_rsvp_sum}
                    icon={<Ticket size={20} />}
                    iconColor="var(--color-accent)"
                />
            </div>

            {/* Pending events */}
            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.pending_events}
                </h2>
                {pending_events.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                        {props.no_pending}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    {[props.event_title, props.provider, props.category, props.date, props.status, props.actions].map((h) => (
                                        <th key={h} className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pending_events.map((evt) => (
                                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.title_en}</td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{evt.provider_email}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={get_category_badge_variant(evt.category)}>{evt.category}</Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{format_date(evt.start_time)}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={get_status_badge_variant(evt.status)}>{evt.status}</Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handle_approve_event(evt.id)}>
                                                    {props.approve}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handle_reject_event(evt.id)}>
                                                    {props.reject}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* All events */}
            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                    {props.all_events}
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                    {events.length} total · {pending_count} pending · {approved_count} approved · {rejected_count} rejected
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                {[props.event_title, props.provider, props.category, props.date, props.status].map((h) => (
                                    <th key={h} className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((evt) => (
                                <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.title_en}</td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{evt.provider_email}</td>
                                    <td className="px-4 py-2">
                                        <Badge variant={get_category_badge_variant(evt.category)}>{evt.category}</Badge>
                                    </td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{format_date(evt.start_time)}</td>
                                    <td className="px-4 py-2">
                                        <Badge variant={get_status_badge_variant(evt.status)}>{evt.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User management */}
            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.user_management}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                {[props.email, props.role, props.created, props.actions].map((h) => (
                                    <th key={h} className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr
                                    key={u.id}
                                    style={{
                                        borderBottom: "1px solid var(--color-border)",
                                        opacity: u.deactivated ? 0.6 : 1,
                                    }}
                                >
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{u.email}</td>
                                    <td className="px-4 py-2">
                                        <Badge variant={get_role_badge_variant(u.role)}>{u.role}</Badge>
                                    </td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                        {format_date(u.created_at)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {u.role !== "ADMIN" && !u.deactivated && (
                                            <Button size="sm" variant="destructive" onClick={() => handle_deactivate_user(u.id)}>
                                                {props.deactivate}
                                            </Button>
                                        )}
                                        {u.deactivated && (
                                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{props.deactivated}</span>
                                        )}
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
