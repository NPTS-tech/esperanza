"use client";

import { useState } from "react";
import { Users, CalendarDays, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function get_status_badge_class(status: MockEvent["status"]): string {
    if (status === "PENDING") return "badge badge-pending";
    if (status === "APPROVED") return "badge badge-approved";
    if (status === "REJECTED") return "badge badge-rejected";
    return "badge";
}

function get_category_badge_class(category: string): string {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    return `badge badge-${slug}`;
}

function format_date(iso_string: string): string {
    const d = new Date(iso_string);
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function AdminDashboard(props: AdminDashboardProps) {
    const [events, set_events] = useState<MockEvent[]>(() => [...mock_events]);
    const [users, set_users] = useState<ExtendedMockUser[]>(() =>
        mock_users.map((u) => ({ ...u, deactivated: false }))
    );

    const pending_count = events.filter((e) => e.status === "PENDING").length;
    const total_rsvp_sum = events.reduce((sum, e) => sum + e.rsvp_count, 0);

    function handle_approve_event(event_id: string) {
        set_events((prev) =>
            prev.map((e) =>
                e.id === event_id ? { ...e, status: "APPROVED" as const } : e
            )
        );
    }

    function handle_reject_event(event_id: string) {
        set_events((prev) =>
            prev.map((e) =>
                e.id === event_id ? { ...e, status: "REJECTED" as const } : e
            )
        );
    }

    function handle_deactivate_user(user_id: string) {
        set_users((prev) =>
            prev.map((u) =>
                u.id === user_id ? { ...u, deactivated: true } : u
            )
        );
    }

    const pending_events = events.filter((e) => e.status === "PENDING");
    const approved_count = events.filter((e) => e.status === "APPROVED").length;
    const rejected_count = events.filter((e) => e.status === "REJECTED").length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <Users size={20} style={{ color: "var(--color-primary)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.total_users}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {users.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <CalendarDays size={20} style={{ color: "var(--color-secondary)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.total_events}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {events.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} style={{ color: "var(--color-warning)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.pending_approvals}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {pending_count}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <Ticket size={20} style={{ color: "var(--color-accent)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.total_rsvps}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {total_rsvp_sum}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.pending_events}
                </h2>
                {pending_events.length === 0 ? (
                    <p className="text-sm py-8" style={{ color: "var(--color-text-secondary)" }}>
                        {props.no_pending}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.event_title}
                                    </th>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.provider}
                                    </th>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.category}
                                    </th>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.date}
                                    </th>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.status}
                                    </th>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending_events.map((evt) => (
                                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.title_en}</td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{evt.provider_email}</td>
                                        <td className="px-4 py-2">
                                            <span className={get_category_badge_class(evt.category)}>{evt.category}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{format_date(evt.start_time)}</td>
                                        <td className="px-4 py-2">
                                            <span className={get_status_badge_class(evt.status)}>{evt.status}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handle_approve_event(evt.id)}
                                                >
                                                    {props.approve}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handle_reject_event(evt.id)}
                                                >
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
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.event_title}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.provider}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.category}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.date}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.status}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((evt) => (
                                <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.title_en}</td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{evt.provider_email}</td>
                                    <td className="px-4 py-2">
                                        <span className={get_category_badge_class(evt.category)}>{evt.category}</span>
                                    </td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{format_date(evt.start_time)}</td>
                                    <td className="px-4 py-2">
                                        <span className={get_status_badge_class(evt.status)}>{evt.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.user_management}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.email}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.role}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.created}
                                </th>
                                <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.actions}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr
                                    key={u.id}
                                    style={{
                                        borderBottom: "1px solid var(--color-border)",
                                        opacity: u.deactivated ? 0.6 : 1
                                    }}
                                >
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{u.email}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`badge ${
                                                u.role === "ADMIN"
                                                    ? "badge-approved"
                                                    : u.role === "PROVIDER"
                                                    ? "badge-health"
                                                    : "badge-pending"
                                            }`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                        {format_date(u.created_at)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {u.role !== "ADMIN" && !u.deactivated && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handle_deactivate_user(u.id)}
                                            >
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
