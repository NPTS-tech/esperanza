"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { CalendarDays, CheckCircle, AlertCircle, Ticket, UploadCloud } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, get_category_badge_variant, get_status_badge_variant } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { format_date_parts } from "@/lib/utils";
import { category_label, type CategoryDto, use_categories } from "@/lib/event_categories";
import type { LocationValue } from "@/components/location_picker";

const LocationPicker = dynamic(
    () => import("@/components/location_picker"),
    {
        ssr: false,
        loading: () => (
            <div
                className="w-full rounded-lg animate-pulse"
                style={{ height: "300px", background: "var(--color-border)" }}
            />
        ),
    },
);

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
    location_address: string;
    location_drag_hint: string;
    location_address_required: string;
    location_pick_required: string;
    start_time: string;
    time_section_label: string;
    time_section_hint: string;
    start_time_hint: string;
    end_time: string;
    end_time_hint: string;
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
    end_time_after_start_error: string;
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
    location_address: string;
    latitude: number | null;
    longitude: number | null;
    start_time: string;
    end_time: string;
    category: string;
    image_url: string;
};

type ProviderEvent = {
    id: string;
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location_name: string;
    latitude: number;
    longitude: number;
    start_time: string;
    end_time: string;
    provider_id: string;
    provider_email: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    category: CategoryDto;
    image_url: string | null;
    created_at: string;
    rsvp_count: number;
};

const INITIAL_FORM: FormState = {
    title_en: "", title_es: "", description_en: "", description_es: "",
    location_name: "", location_address: "", latitude: null, longitude: null,
    start_time: "", end_time: "", category: "", image_url: "",
};

function parse_category(value: unknown): CategoryDto | null {
    if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as CategoryDto).id === "string" &&
        typeof (value as CategoryDto).slug === "string" &&
        typeof (value as CategoryDto).name_en === "string" &&
        typeof (value as CategoryDto).name_es === "string" &&
        typeof (value as CategoryDto).color === "string" &&
        typeof (value as CategoryDto).emoji === "string"
    ) {
        return value as CategoryDto;
    }
    return null;
}

function to_provider_event(
    api_event: Record<string, unknown>,
    fallback_provider_email: string,
): ProviderEvent | null {
    const category = parse_category(api_event.category);
    if (
        typeof api_event.id !== "string" ||
        typeof api_event.title_en !== "string" ||
        typeof api_event.title_es !== "string" ||
        typeof api_event.description_en !== "string" ||
        typeof api_event.description_es !== "string" ||
        typeof api_event.location_name !== "string" ||
        typeof api_event.latitude !== "number" ||
        typeof api_event.longitude !== "number" ||
        typeof api_event.start_time !== "string" ||
        typeof api_event.end_time !== "string" ||
        typeof api_event.provider_id !== "string" ||
        typeof api_event.status !== "string" ||
        category === null ||
        typeof api_event.created_at !== "string"
    ) {
        return null;
    }

    const provider =
        typeof api_event.provider === "object" && api_event.provider !== null
            ? (api_event.provider as { email?: unknown })
            : null;

    const count =
        typeof api_event._count === "object" && api_event._count !== null
            ? (api_event._count as { rsvps?: unknown })
            : null;

    const status = api_event.status;
    if (
        status !== "PENDING" &&
        status !== "APPROVED" &&
        status !== "REJECTED" &&
        status !== "CANCELLED"
    ) {
        return null;
    }

    return {
        id: api_event.id,
        title_en: api_event.title_en,
        title_es: api_event.title_es,
        description_en: api_event.description_en,
        description_es: api_event.description_es,
        location_name: api_event.location_name,
        latitude: api_event.latitude,
        longitude: api_event.longitude,
        start_time: api_event.start_time,
        end_time: api_event.end_time,
        provider_id: api_event.provider_id,
        provider_email:
            typeof provider?.email === "string"
                ? provider.email
                : fallback_provider_email,
        status,
        category,
        image_url: typeof api_event.image_url === "string" ? api_event.image_url : null,
        created_at: api_event.created_at,
        rsvp_count: typeof count?.rsvps === "number" ? count.rsvps : 0,
    };
}

function add_hour(value: string): string {
    if (!value) return "";
    const date = new Date(value);
    date.setMinutes(date.getMinutes() + 60);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

export function ProviderDashboard(props: ProviderDashboardProps) {
    const locale = useLocale();
    const { categories } = use_categories();
    const [events, set_events] = useState<ProviderEvent[]>([]);
    const [form, set_form] = useState<FormState>(INITIAL_FORM);
    const [uploading_image, set_uploading_image] = useState(false);
    const [auto_translating, set_auto_translating] = useState(false);
    const [auto_translated_fields, set_auto_translated_fields] = useState<Set<string>>(new Set());
    const [info_message, set_info_message] = useState<string | null>(null);
    const [submitting, set_submitting] = useState(false);
    const image_input_id = "provider-event-image-upload";
    const { toasts, show_toast, dismiss } = useToast();

    const load_provider_events = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "200",
                provider_id: props.provider_id,
            });

            const response = await fetch(`/api/events?${params.toString()}`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to load provider events");
            }

            const data = (await response.json()) as {
                events?: Array<Record<string, unknown>>;
            };

            const mapped = (data.events ?? [])
                .map((event) => to_provider_event(event, props.provider_email))
                .filter((event): event is ProviderEvent => event !== null);

            set_events(mapped);
        } catch (error) {
            console.error("Failed to load provider events:", error);
            set_events([]);
        }
    }, [props.provider_email, props.provider_id]);

    useEffect(() => {
        void load_provider_events();
    }, [load_provider_events]);

    async function handle_image_file_change(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0];
        if (!file) return;

        set_uploading_image(true);

        const form_data = new FormData();
        form_data.append("file", file);

        try {
            const res = await fetch("/api/uploads/event-image", {
                method: "POST",
                body: form_data,
            });

            const raw = await res.text();
            let data: { url?: string; error?: string } = {};
            try {
                data = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : {};
            } catch {
                data = {
                    error: raw?.startsWith("<!DOCTYPE")
                        ? "Upload endpoint returned HTML (likely a server/config error)."
                        : "Image upload failed",
                };
            }

            if (!res.ok || !data.url) {
                throw new Error(data.error ?? "Image upload failed");
            }

            set_form((prev) => ({ ...prev, image_url: data.url! }));
        } catch (err) {
            show_toast(
                err instanceof Error ? err.message : "Image upload failed",
                "error",
            );
        } finally {
            set_uploading_image(false);
            e.target.value = "";
        }
    }

    const approved_count = events.filter((e) => e.status === "APPROVED").length;
    const pending_count = events.filter((e) => e.status === "PENDING").length;
    const total_rsvp_sum = events.reduce((sum, e) => sum + e.rsvp_count, 0);

    const hasTitleEn = !!form.title_en.trim();
    const hasTitleEs = !!form.title_es.trim();
    const hasDescEn = !!form.description_en.trim();
    const hasDescEs = !!form.description_es.trim();

    const has_any_source_text =
        hasTitleEn ||
        hasTitleEs ||
        hasDescEn ||
        hasDescEs;

    const has_any_missing_bilingual_field =
        (hasTitleEn && !hasTitleEs) ||
        (!hasTitleEn && hasTitleEs) ||
        (hasDescEn && !hasDescEs) ||
        (!hasDescEn && hasDescEs);

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_submitting(true);

        if (!hasTitleEn && !hasTitleEs) {
            show_toast("Please provide a title in at least one language.", "error");
            set_submitting(false);
            return;
        }
        if (!hasDescEn && !hasDescEs) {
            show_toast("Please provide a description in at least one language.", "error");
            set_submitting(false);
            return;
        }

        if (!form.location_address.trim()) {
            show_toast(props.location_address_required, "error");
            set_submitting(false);
            return;
        }
        if (form.latitude == null || form.longitude == null) {
            show_toast(props.location_pick_required, "error");
            set_submitting(false);
            return;
        }
        if (!form.start_time || !form.end_time) {
            set_submitting(false);
            return;
        }
        if (new Date(form.end_time) <= new Date(form.start_time)) {
            show_toast(props.end_time_after_start_error, "error");
            set_submitting(false);
            return;
        }

        let finalTitleEn = form.title_en.trim();
        let finalTitleEs = form.title_es.trim();
        let finalDescriptionEn = form.description_en.trim();
        let finalDescriptionEs = form.description_es.trim();

        const needsTranslation =
            (hasTitleEn && !hasTitleEs) ||
            (!hasTitleEn && hasTitleEs) ||
            (hasDescEn && !hasDescEs) ||
            (!hasDescEn && hasDescEs);

        if (needsTranslation) {
            set_auto_translating(true);
            const newly_translated = new Set<string>();
            try {
                const translate = async (text: string, sourceLang: "en" | "es", targetLang: "en" | "es") => {
                    const res = await fetch("/api/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text, sourceLang, targetLang }),
                    });
                    const json = (await res.json()) as { translatedText?: string; error?: string };
                    if (!res.ok || !json.translatedText) throw new Error(json.error || "Translation failed");
                    return json.translatedText;
                };

                if (hasTitleEn && !hasTitleEs) {
                    finalTitleEs = await translate(finalTitleEn, "en", "es");
                    set_form(prev => ({ ...prev, title_es: finalTitleEs }));
                    newly_translated.add("title_es");
                } else if (!hasTitleEn && hasTitleEs) {
                    finalTitleEn = await translate(finalTitleEs, "es", "en");
                    set_form(prev => ({ ...prev, title_en: finalTitleEn }));
                    newly_translated.add("title_en");
                }

                if (hasDescEn && !hasDescEs) {
                    finalDescriptionEs = await translate(finalDescriptionEn, "en", "es");
                    set_form(prev => ({ ...prev, description_es: finalDescriptionEs }));
                    newly_translated.add("description_es");
                } else if (!hasDescEn && hasDescEs) {
                    finalDescriptionEn = await translate(finalDescriptionEs, "es", "en");
                    set_form(prev => ({ ...prev, description_en: finalDescriptionEn }));
                    newly_translated.add("description_en");
                }
            } catch {
                show_toast("Translation failed. Please fill this field manually.", "error");
                set_auto_translating(false);
                set_submitting(false);
                return;
            }

            set_auto_translated_fields(prev => new Set([...prev, ...newly_translated]));
            set_info_message("Some fields were auto-translated. Please review and submit again.");
            set_auto_translating(false);
            set_submitting(false);
            document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const payload: Record<string, unknown> = {
            title_en: finalTitleEn,
            title_es: finalTitleEs,
            description_en: finalDescriptionEn,
            description_es: finalDescriptionEs,
            location_name:
                form.location_name.trim() || form.location_address.trim() || "TBD",
            location_address: form.location_address.trim(),
            latitude: form.latitude ?? 0,
            longitude: form.longitude ?? 0,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
            category_id: form.category,
        };

        if (form.image_url.trim()) {
            payload.image_url = form.image_url.trim();
        }

        try {
            const response = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = (await response.json()) as {
                error?: string;
                details?: Record<string, string[]>;
            };

            if (!response.ok) {
                const first_field_error = json.details
                    ? Object.values(json.details).find(
                        (messages) => Array.isArray(messages) && messages.length > 0,
                    )?.[0]
                    : null;

                throw new Error(
                    first_field_error ||
                    json.error ||
                    "Failed to submit event",
                );
            }

            set_form(INITIAL_FORM);
            set_auto_translated_fields(new Set());
            set_info_message(null);
            await load_provider_events();
            show_toast(props.event_submitted, "success");
        } catch (error) {
            show_toast(
                error instanceof Error ? error.message : "Failed to submit event",
                "error",
            );
        } finally {
            set_submitting(false);
        }
    }

    function update_form(field: keyof FormState, value: string) {
        // clear auto-translated badge when user edits
        if (auto_translated_fields.has(field)) {
            set_auto_translated_fields((prev) => {
                const next = new Set(prev);
                next.delete(field);
                return next;
            });
        }

        set_form((prev) => {
            if (field === "start_time") {
                return {
                    ...prev,
                    start_time: value,
                    end_time:
                        !prev.end_time || new Date(prev.end_time) <= new Date(value)
                            ? add_hour(value)
                            : prev.end_time,
                };
            }

            return { ...prev, [field]: value };
        });
    }

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Stat cards */}
            <div className="grid grid-cols-1 @sm:grid-cols-2 @4xl:grid-cols-4 gap-4">
                <StatCard label={props.my_total_events} value={events.length} icon={<CalendarDays size={20} />} iconColor="var(--color-primary)" />
                <StatCard label={props.approved_events} value={approved_count} icon={<CheckCircle size={20} />} iconColor="var(--color-success)" />
                <StatCard label={props.pending_events} value={pending_count} icon={<AlertCircle size={20} />} iconColor="var(--color-warning)" />
                <StatCard label={props.total_rsvps} value={total_rsvp_sum} icon={<Ticket size={20} />} iconColor="var(--color-accent)" />
            </div>

            {/* Submit event form */}
            <div className="card card-no-hover p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {props.submit_event}
                    </h2>
                    {has_any_source_text && has_any_missing_bilingual_field && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm text-xs"
                            disabled={auto_translating}
                            onClick={async () => {
                                if (!has_any_source_text || !has_any_missing_bilingual_field) {
                                    return;
                                }

                                set_auto_translating(true);
                                const newly_translated = new Set<string>();

                                try {
                                    const translate = async (text: string, sourceLang: "en" | "es", targetLang: "en" | "es") => {
                                        const res = await fetch("/api/translate", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ text, sourceLang, targetLang }),
                                        });
                                        const json = (await res.json()) as { translatedText?: string; error?: string };
                                        if (!res.ok || !json.translatedText) {
                                            throw new Error(json.error || "Translation failed");
                                        }
                                        return json.translatedText;
                                    };

                                    // Title pair
                                    if (hasTitleEn && !hasTitleEs) {
                                        const translated = await translate(form.title_en.trim(), "en", "es");
                                        set_form(prev => ({ ...prev, title_es: translated }));
                                        newly_translated.add("title_es");
                                    } else if (!hasTitleEn && hasTitleEs) {
                                        const translated = await translate(form.title_es.trim(), "es", "en");
                                        set_form(prev => ({ ...prev, title_en: translated }));
                                        newly_translated.add("title_en");
                                    }

                                    // Description pair
                                    if (hasDescEn && !hasDescEs) {
                                        const translated = await translate(form.description_en.trim(), "en", "es");
                                        set_form(prev => ({ ...prev, description_es: translated }));
                                        newly_translated.add("description_es");
                                    } else if (!hasDescEn && hasDescEs) {
                                        const translated = await translate(form.description_es.trim(), "es", "en");
                                        set_form(prev => ({ ...prev, description_en: translated }));
                                        newly_translated.add("description_en");
                                    }

                                    if (newly_translated.size > 0) {
                                        set_auto_translated_fields(prev => new Set([...prev, ...newly_translated]));
                                        set_info_message("Some fields were auto-translated. Please review and submit again.");
                                        document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
                                    }
                                } catch (err) {
                                    show_toast(
                                        err instanceof Error ? err.message : "Translation failed. Please fill this field manually.",
                                        "error",
                                    );
                                } finally {
                                    set_auto_translating(false);
                                }
                            }}
                        >
                            {auto_translating ? "Translating..." : "Translate missing fields"}
                        </button>
                    )}
                </div>
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
                    {info_message && (
                        <div
                            className="p-3 rounded-lg text-sm"
                            style={{ background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" }}
                        >
                            ✨ {info_message}
                        </div>
                    )}
                    <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
                        <FormField label={props.title_en}>
                            <Input
                                value={form.title_en}
                                onChange={(e) => update_form("title_en", e.target.value)}
                            />
                            {auto_translated_fields.has("title_en") && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                                    ✨ Auto-translated — review before submitting
                                </p>
                            )}
                        </FormField>
                        <FormField label={props.title_es}>
                            <Input
                                value={form.title_es}
                                onChange={(e) => update_form("title_es", e.target.value)}
                            />
                            {auto_translated_fields.has("title_es") && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                                    ✨ Auto-translated — review before submitting
                                </p>
                            )}
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
                        <FormField label={props.description_en}>
                            <Textarea
                                value={form.description_en}
                                onChange={(e) => update_form("description_en", e.target.value)}
                            />
                            {auto_translated_fields.has("description_en") && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                                    ✨ Auto-translated — review before submitting
                                </p>
                            )}
                        </FormField>
                        <FormField label={props.description_es}>
                            <Textarea
                                value={form.description_es}
                                onChange={(e) => update_form("description_es", e.target.value)}
                            />
                            {auto_translated_fields.has("description_es") && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                                    ✨ Auto-translated — review before submitting
                                </p>
                            )}
                        </FormField>
                    </div>
                    <FormField label={props.location_name} required>
                        <Input value={form.location_name} onChange={(e) => update_form("location_name", e.target.value)} required />
                    </FormField>
                    <FormField label={props.location_address} required>
                        <LocationPicker
                            label={undefined}
                            drag_hint={props.location_drag_hint}
                            value={{
                                location_name: form.location_name,
                                location_address: form.location_address,
                                latitude: form.latitude,
                                longitude: form.longitude,
                            }}
                            onChange={({ location_name, location_address, latitude, longitude }: LocationValue) =>
                                set_form((prev) => ({
                                    ...prev,
                                    location_name,
                                    location_address: location_address ?? prev.location_address,
                                    latitude,
                                    longitude,
                                }))
                            }
                        />
                    </FormField>
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                                {props.time_section_label} *
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                {props.time_section_hint}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
                            <FormField label={props.start_time} required>
                                <Input type="datetime-local" step={900} value={form.start_time} onChange={(e) => update_form("start_time", e.target.value)} required />
                                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.start_time_hint}
                                </p>
                            </FormField>
                            <FormField label={props.end_time} required>
                                <Input type="datetime-local" min={form.start_time || undefined} step={900} value={form.end_time} onChange={(e) => update_form("end_time", e.target.value)} required />
                                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                    {props.end_time_hint}
                                </p>
                            </FormField>
                        </div>
                    </div>
                    <FormField label={props.category}>
                        <Select value={form.category} onChange={(e) => update_form("category", e.target.value)} required>
                            <option value="" disabled>
                                {props.category_placeholder}
                            </option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{category_label(cat, locale)}</option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label={props.image_url}>
                        <div className="space-y-2">
                            <Input
                                id={image_input_id}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handle_image_file_change}
                                disabled={uploading_image}
                                className="sr-only"
                            />

                            <label
                                htmlFor={image_input_id}
                                className="w-full rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer"
                                style={{
                                    border: "1px dashed var(--color-border)",
                                    background: "var(--color-surface)",
                                }}
                            >
                                <div className="flex items-center gap-3 min-w-0 w-full">
                                    <span className="btn btn-secondary flex items-center gap-2" style={{ whiteSpace: "nowrap" }}>
                                        <UploadCloud size={14} />
                                        {uploading_image ? "Uploading" : "Choose file"}
                                    </span>

                                    <div className="min-w-0">
                                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                                            {uploading_image ? "Uploading image..." : "Upload event image"}
                                        </p>
                                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                            PNG, JPG, WEBP • Max 5MB
                                        </p>
                                    </div>
                                </div>
                            </label>

                            {form.image_url && (
                                <div className="space-y-2">
                                    <img
                                        src={form.image_url}
                                        alt="Uploaded event"
                                        className="w-full max-w-sm rounded-lg"
                                        style={{ border: "1px solid var(--color-border)" }}
                                    />
                                    <div className="flex gap-2">
                                        <a
                                            href={form.image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                        >
                                            View image
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => set_form((prev) => ({ ...prev, image_url: "" }))}
                                        >
                                            Remove image
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormField>
                    <button type="submit" className="btn btn-primary" disabled={auto_translating || submitting}>
                        {auto_translating ? "Translating..." : submitting ? "Submitting..." : props.submit}
                    </button>
                </form>
            </div>

            {/* My events table */}
            <div className="card p-4 md:p-6 pb-0 md:pb-0 overflow-hidden">
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
                                            <Badge variant={get_category_badge_variant(evt.category)}>{category_label(evt.category, locale)}</Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: "var(--color-text)" }}>
                                            <span className="block whitespace-nowrap">{format_date_parts(evt.start_time, locale).date}</span>
                                            <span className="block whitespace-nowrap text-xs" style={{ color: "var(--color-text-secondary)" }}>{format_date_parts(evt.start_time, locale).time}</span>
                                        </td>
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
