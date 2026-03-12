"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, AlertCircle, Ticket } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, get_category_badge_variant, get_status_badge_variant } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { format_date } from "@/lib/utils";
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
    provider_id: string;
    provider_email: string;
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
    title_en: "", title_es: "", description_en: "", description_es: "",
    location_name: "", latitude: "", longitude: "",
    start_time: "", end_time: "", category: "", image_url: "",
};

export function ProviderDashboard(props: ProviderDashboardProps) {
    const [events, set_events] = useState<MockEvent[]>(() =>
        mock_events.filter((e) => e.provider_id === props.provider_id)
    );
    const [form, set_form] = useState<FormState>(INITIAL_FORM);
    const { toasts, show_toast, dismiss } = useToast();

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
            rsvp_count: 0,
        };

        set_events((prev) => [new_event, ...prev]);
        set_form(INITIAL_FORM);
        show_toast(props.event_submitted, "success");
    }

    function update_form(field: keyof FormState, value: string) {
        set_form((prev) => ({ ...prev, [field]: value }));
    }

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label={props.my_total_events} value={events.length} icon={<CalendarDays size={20} />} iconColor="var(--color-primary)" />
                <StatCard label={props.approved_events} value={approved_count} icon={<CheckCircle size={20} />} iconColor="var(--color-success)" />
                <StatCard label={props.pending_events} value={pending_count} icon={<AlertCircle size={20} />} iconColor="var(--color-warning)" />
                <StatCard label={props.total_rsvps} value={total_rsvp_sum} icon={<Ticket size={20} />} iconColor="var(--color-accent)" />
            </div>

            {/* Submit event form */}
            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.submit_event}
                </h2>
                <div
                    className="flex items-center gap-3 p-3 mb-4 rounded-lg"
                    style={{ backgroundColor: "rgba(212,168,83,0.15)", borderLeft: "4px solid var(--color-warning)" }}
                >
                    <AlertCircle size={16} style={{ color: "var(--color-warning)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>
                        {props.reapproval_warning}
                    </p>
                </div>

                <form onSubmit={handle_submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={props.title_en} required>
                            <Input value={form.title_en} onChange={(e) => update_form("title_en", e.target.value)} required />
                        </FormField>
                        <FormField label={props.title_es} required>
                            <Input value={form.title_es} onChange={(e) => update_form("title_es", e.target.value)} required />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={props.description_en}>
                            <Textarea value={form.description_en} onChange={(e) => update_form("description_en", e.target.value)} />
                        </FormField>
                        <FormField label={props.description_es}>
                            <Textarea value={form.description_es} onChange={(e) => update_form("description_es", e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label={props.location_name}>
                        <Input value={form.location_name} onChange={(e) => update_form("location_name", e.target.value)} />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={props.latitude}>
                            <Input type="number" step="any" value={form.latitude} onChange={(e) => update_form("latitude", e.target.value)} />
                        </FormField>
                        <FormField label={props.longitude}>
                            <Input type="number" step="any" value={form.longitude} onChange={(e) => update_form("longitude", e.target.value)} />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={props.start_time} required>
                            <Input type="datetime-local" value={form.start_time} onChange={(e) => update_form("start_time", e.target.value)} required />
                        </FormField>
                        <FormField label={props.end_time} required>
                            <Input type="datetime-local" value={form.end_time} onChange={(e) => update_form("end_time", e.target.value)} required />
                        </FormField>
                    </div>
                    <FormField label={props.category}>
                        <Select value={form.category} onChange={(e) => update_form("category", e.target.value)}>
                            <option value="">{props.category_placeholder}</option>
                            {EVENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label={props.image_url}>
                        <Input type="text" value={form.image_url} onChange={(e) => update_form("image_url", e.target.value)} />
                    </FormField>
                    <button type="submit" className="btn btn-primary">
                        {props.submit}
                    </button>
                </form>
            </div>

            {/* My events table */}
            <div className="card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    {props.my_events}
                </h2>
                {events.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                        {props.no_events}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    {[props.table_title, props.category, props.date, props.status, props.rsvp_count].map((h) => (
                                        <th key={h} className="text-left text-xs font-semibold px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((evt) => (
                                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.title_en}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={get_category_badge_variant(evt.category)}>{evt.category}</Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{format_date(evt.start_time)}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={get_status_badge_variant(evt.status)}>{evt.status}</Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>{evt.rsvp_count}</td>
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
