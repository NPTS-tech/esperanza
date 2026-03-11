"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, AlertCircle, Ticket } from "lucide-react";
import { mock_events, EVENT_CATEGORIES, type MockEvent } from "@/lib/mock_data";

export type ProviderDashboardProps = {
    title: string;
    subtitle: string;
    submit_event: string;
    my_events: string;
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location_name: string;
    latitude: string;
    longitude: string;
    start_time: string;
    end_time: string;
    category: string;
    category_placeholder: string;
    image_url: string;
    submit: string;
    my_total_events: string;
    approved_events: string;
    pending_events: string;
    total_rsvps: string;
    rsvp_count: string;
    reapproval_warning: string;
    event_submitted: string;
    no_events: string;
    table_title: string;
    date: string;
    status: string;
};

type FormState = {
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location_name: string;
    latitude: string;
    longitude: string;
    start_time: string;
    end_time: string;
    category: string;
    image_url: string;
};

const INITIAL_FORM: FormState = {
    title_en: "",
    title_es: "",
    description_en: "",
    description_es: "",
    location_name: "",
    latitude: "",
    longitude: "",
    start_time: "",
    end_time: "",
    category: "",
    image_url: ""
};

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

export function ProviderDashboard(
    props: ProviderDashboardProps & { provider_id: string; provider_email: string }
) {
    const [events, set_events] = useState<MockEvent[]>(() =>
        mock_events.filter((e) => e.provider_id === props.provider_id)
    );
    const [form, set_form] = useState<FormState>(INITIAL_FORM);
    const [success_message, set_success_message] = useState<string | null>(null);

    const approved_count = events.filter((e) => e.status === "APPROVED").length;
    const pending_count = events.filter((e) => e.status === "PENDING").length;
    const total_rsvp_sum = events.reduce((sum, e) => sum + e.rsvp_count, 0);

    function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title_en.trim() || !form.title_es.trim()) return;
        if (!form.start_time || !form.end_time) return;

        const new_event: MockEvent = {
            id: `evt-${Date.now()}`,
            title_en: form.title_en.trim(),
            title_es: form.title_es.trim(),
            description_en: form.description_en.trim(),
            description_es: form.description_es.trim(),
            location_name: form.location_name.trim() || "TBD",
            latitude: parseFloat(form.latitude) || 0,
            longitude: parseFloat(form.longitude) || 0,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
            provider_id: props.provider_id,
            provider_email: props.provider_email,
            status: "PENDING",
            category: form.category || "Community",
            image_url: form.image_url.trim() || null,
            created_at: new Date().toISOString(),
            rsvp_count: 0
        };

        set_events((prev) => [new_event, ...prev]);
        set_form(INITIAL_FORM);
        set_success_message(props.event_submitted);
        setTimeout(() => set_success_message(null), 4000);
    }

    function update_form(field: keyof FormState, value: string) {
        set_form((prev) => ({ ...prev, [field]: value }));
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <CalendarDays size={20} style={{ color: "var(--color-primary)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.my_total_events}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {events.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={20} style={{ color: "var(--color-success)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.approved_events}
                            </p>
                            <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                {approved_count}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} style={{ color: "var(--color-warning)" }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                {props.pending_events}
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
                    {props.submit_event}
                </h2>
                <div
                    className="flex items-center gap-3 p-3 mb-4 rounded-lg"
                    style={{
                        backgroundColor: "rgba(212, 168, 83, 0.15)",
                        borderLeft: "4px solid var(--color-warning)"
                    }}
                >
                    <AlertCircle size={16} style={{ color: "var(--color-warning)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>
                        {props.reapproval_warning}
                    </p>
                </div>
                {success_message && (
                    <div
                        className="mb-4 p-3 rounded-lg text-sm"
                        style={{
                            backgroundColor: "rgba(124, 144, 112, 0.2)",
                            color: "var(--color-success)"
                        }}
                    >
                        {success_message}
                    </div>
                )}
                <form onSubmit={handle_submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.title_en} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={form.title_en}
                                onChange={(e) => update_form("title_en", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.title_es} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={form.title_es}
                                onChange={(e) => update_form("title_es", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.description_en}
                            </label>
                            <textarea
                                className="input min-h-[80px]"
                                value={form.description_en}
                                onChange={(e) => update_form("description_en", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.description_es}
                            </label>
                            <textarea
                                className="input min-h-[80px]"
                                value={form.description_es}
                                onChange={(e) => update_form("description_es", e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                            {props.location_name}
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={form.location_name}
                            onChange={(e) => update_form("location_name", e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.latitude}
                            </label>
                            <input
                                type="number"
                                step="any"
                                className="input"
                                value={form.latitude}
                                onChange={(e) => update_form("latitude", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.longitude}
                            </label>
                            <input
                                type="number"
                                step="any"
                                className="input"
                                value={form.longitude}
                                onChange={(e) => update_form("longitude", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.start_time} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={form.start_time}
                                onChange={(e) => update_form("start_time", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                                {props.end_time} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={form.end_time}
                                onChange={(e) => update_form("end_time", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                            {props.category}
                        </label>
                        <select
                            className="select"
                            value={form.category}
                            onChange={(e) => update_form("category", e.target.value)}
                        >
                            <option value="">{props.category_placeholder}</option>
                            {EVENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                            {props.image_url}
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={form.image_url}
                            onChange={(e) => update_form("image_url", e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        {props.submit}
                    </button>
                </form>
            </div>

            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.my_events}
                </h2>
                {events.length === 0 ? (
                    <p className="text-sm py-8" style={{ color: "var(--color-text-secondary)" }}>
                        {props.no_events}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <th className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {props.table_title}
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
                                        {props.rsvp_count}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((evt) => (
                                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>
                                            {evt.title_en}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={get_category_badge_class(evt.category)}>{evt.category}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>
                                            {format_date(evt.start_time)}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={get_status_badge_class(evt.status)}>{evt.status}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>
                                            {evt.rsvp_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
