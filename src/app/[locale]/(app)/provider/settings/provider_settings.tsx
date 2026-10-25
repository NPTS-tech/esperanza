"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { category_label, use_categories } from "@/lib/event_categories";
import { DEFAULT_EVENT_CATEGORY } from "@/lib/constants";

type ProviderSettingsProps = {
    provider_id: string;
    label_org_name: string;
    placeholder_org_name: string;
    label_bio: string;
    placeholder_bio: string;
    label_logo_url: string;
    placeholder_logo_url: string;
    label_website_url: string;
    placeholder_website_url: string;
    label_contact_email: string;
    placeholder_contact_email: string;
    label_contact_phone: string;
    placeholder_contact_phone: string;
    label_programs: string;
    help_programs: string;
    msg_programs_unavailable: string;
    label_beneficiaries: string;
    placeholder_beneficiaries: string;
    label_save: string;
    label_saving: string;
    msg_saved: string;
    msg_error_saving: string;
    msg_error_loading: string;
    label_view_public: string;
    label_back: string;
    title?: string;
    subtitle?: string;
};

type ProfileForm = {
    org_name: string;
    bio: string;
    logo_url: string;
    website_url: string;
    contact_email: string;
    contact_phone: string;
    beneficiaries: string;
};

type ProgramCategory = {
    id: string;
    slug: string;
    name_en: string;
    name_es: string;
    color: string;
    emoji: string;
};

const empty_form: ProfileForm = {
    org_name: "",
    bio: "",
    logo_url: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    beneficiaries: "",
};

export function ProviderSettings({
    provider_id,
    label_org_name,
    placeholder_org_name,
    label_bio,
    placeholder_bio,
    label_logo_url,
    placeholder_logo_url,
    label_website_url,
    placeholder_website_url,
    label_contact_email,
    placeholder_contact_email,
    label_contact_phone,
    placeholder_contact_phone,
    label_programs,
    help_programs,
    msg_programs_unavailable,
    label_beneficiaries,
    placeholder_beneficiaries,
    label_save,
    label_saving,
    msg_saved,
    msg_error_saving,
    msg_error_loading,
    label_view_public,
    label_back,
    title,
    subtitle,
}: ProviderSettingsProps) {
    const locale = useLocale();
    const { categories } = use_categories();
    const [form, set_form] = useState<ProfileForm>(empty_form);
    const [program_ids, set_program_ids] = useState<string[]>([]);
    const [loading, set_loading] = useState(false);
    const [fetching, set_fetching] = useState(true);
    const { toasts, show_toast, dismiss } = useToast();

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/providers/${provider_id}/profile`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                set_form({
                    org_name: data.org_name ?? "",
                    bio: data.bio ?? "",
                    logo_url: data.logo_url ?? "",
                    website_url: data.website_url ?? "",
                    contact_email: data.contact_email ?? "",
                    contact_phone: data.contact_phone ?? "",
                    beneficiaries: data.beneficiaries ?? "",
                });
                set_program_ids(
                    (Array.isArray(data.programs) ? data.programs : [])
                        .map((c: ProgramCategory) => c.id),
                );
            } catch {
                show_toast(msg_error_loading, "error");
            } finally {
                set_fetching(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider_id]);

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_loading(true);
        try {
            const payload: Record<string, string | string[] | null> = {};
            for (const [k, v] of Object.entries(form)) {
                payload[k] = v.trim() === "" ? null : v.trim();
            }
            payload.category_ids = program_ids;
            const res = await fetch(`/api/providers/${provider_id}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
            show_toast(msg_saved, "success");
        } catch {
            show_toast(msg_error_saving, "error");
        } finally {
            set_loading(false);
        }
    }

    function field(key: keyof ProfileForm, value: string) {
        set_form((prev) => ({ ...prev, [key]: value }));
    }

    function toggle_program(category_id: string) {
        set_program_ids((current) =>
            current.includes(category_id)
                ? current.filter((id) => id !== category_id)
                : [...current, category_id],
        );
    }

    if (fetching) {
        return (
            <div className="card p-6" style={{ color: "var(--color-text-secondary)" }}>
                Loading…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            <form onSubmit={handle_submit} className="card p-6 space-y-5">
                {title && (
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                {/* Logo preview + URL */}
                {form.logo_url && (
                    <div className="flex items-center gap-4 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={form.logo_url}
                            alt="Logo preview"
                            className="w-16 h-16 rounded-full object-cover border"
                            style={{ borderColor: "var(--color-border)" }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                    </div>
                )}

                <FormField label={label_org_name}>
                    <Input
                        value={form.org_name}
                        onChange={(e) => field("org_name", e.target.value)}
                        placeholder={placeholder_org_name}
                        maxLength={200}
                    />
                </FormField>

                <FormField label={label_bio}>
                    <textarea
                        value={form.bio}
                        onChange={(e) => field("bio", e.target.value)}
                        placeholder={placeholder_bio}
                        maxLength={2000}
                        rows={4}
                        className="input resize-y"
                    />
                </FormField>

                <FormField label={label_logo_url}>
                    <Input
                        type="url"
                        value={form.logo_url}
                        onChange={(e) => field("logo_url", e.target.value)}
                        placeholder={placeholder_logo_url}
                    />
                </FormField>

                <FormField label={label_website_url}>
                    <Input
                        type="url"
                        value={form.website_url}
                        onChange={(e) => field("website_url", e.target.value)}
                        placeholder={placeholder_website_url}
                    />
                </FormField>

                <FormField label={label_contact_email}>
                    <Input
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => field("contact_email", e.target.value)}
                        placeholder={placeholder_contact_email}
                    />
                </FormField>

                <FormField label={label_contact_phone}>
                    <Input
                        type="tel"
                        value={form.contact_phone}
                        onChange={(e) => field("contact_phone", e.target.value)}
                        placeholder={placeholder_contact_phone}
                        maxLength={30}
                    />
                </FormField>

                <FormField label={label_programs} hint={help_programs}>
                    {categories.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {msg_programs_unavailable}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {categories
                                .filter(
                                    (cat) =>
                                        cat.slug !== DEFAULT_EVENT_CATEGORY.slug,
                                )
                                .map((cat) => {
                                const selected = program_ids.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => toggle_program(cat.id)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "7px 12px",
                                            borderRadius: 999,
                                            fontSize: 13,
                                            fontWeight: selected ? 600 : 400,
                                            border: `1.5px solid ${selected ? cat.color : "var(--color-border)"}`,
                                            background: selected ? `${cat.color}18` : "transparent",
                                            color: selected ? cat.color : "var(--color-text)",
                                            cursor: "pointer",
                                            transition: "background .12s, border-color .12s",
                                        }}
                                    >
                                        <span aria-hidden="true">{cat.emoji}</span>
                                        {category_label(cat, locale)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </FormField>

                <FormField label={label_beneficiaries}>
                    <textarea
                        value={form.beneficiaries}
                        onChange={(e) => field("beneficiaries", e.target.value)}
                        placeholder={placeholder_beneficiaries}
                        maxLength={500}
                        rows={2}
                        className="input resize-y"
                    />
                </FormField>

                <div className="flex items-center justify-between pt-2">
                    <Link
                        href={`/providers/${provider_id}?from=settings` as any}
                        className="text-sm"
                        style={{ color: "var(--color-primary)" }}
                    >
                        {label_view_public}
                    </Link>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? label_saving : label_save}
                    </button>
                </div>
            </form>

        </div>
    );
}
