"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { sign_out_action } from "@/app/actions/sign_out_action";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { InstallButton } from "@/components/pwa/install-button";
import {
    EMPTY_DALLAS_COUNTY_DEMOGRAPHICS,
    get_default_primary_language_for_locale,
    type DallasCountyDemographicsInput,
} from "@/lib/dallas_county_profile";
import {
    DALLAS_COUNTY_AGE_BAND_OPTIONS,
    DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS,
    DALLAS_COUNTY_COUNTY_OPTIONS,
    DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS,
    DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS,
    DALLAS_COUNTY_ETHNICITY_OPTIONS,
    DALLAS_COUNTY_GENDER_OPTIONS,
    DALLAS_COUNTY_MARITAL_STATUS_OPTIONS,
    DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS,
    DALLAS_COUNTY_RACE_OPTIONS,
} from "@/lib/dallas_county_profile_options";

type Locale = "en" | "es";

type ProfileResponse = {
    id: string;
    username: string | null;
    email: string;
    role: string;
    language_pref: Locale;
    share_with_providers: boolean;
    consented_at: string | null;
    demographics: DallasCountyDemographicsInput;
    rsvps: {
        id: string;
        created_at: string;
        event: {
            id: string;
            title_en: string;
            title_es: string;
            start_time: string;
            status: string;
            location_name: string;
            location_address: string | null;
        };
    }[];
};

type ProfileFormState = {
    username: string;
    language_pref: Locale;
    share_with_providers: boolean;
    demographics: DallasCountyDemographicsInput;
};

type SelectOption = {
    value: string;
    label: string;
};

const DEFAULT_PROFILE_FORM = (locale: string): ProfileFormState => ({
    username: "",
    language_pref: locale === "es" ? "es" : "en",
    share_with_providers: true,
    demographics: {
        ...EMPTY_DALLAS_COUNTY_DEMOGRAPHICS,
        primary_language: get_default_primary_language_for_locale(locale),
    },
});

const EMPTY_FIELD_VALUE = "—";

function format_readonly_value(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") {
        return EMPTY_FIELD_VALUE;
    }

    return String(value);
}

function ReadOnlyFieldValue({ value }: { value: string | number | null | undefined }) {
    const display_value = format_readonly_value(value);

    return (
        <div
            className="input flex min-h-[42px] items-center"
            aria-readonly="true"
            style={{
                background: "var(--color-surface-hover)",
                color: display_value === EMPTY_FIELD_VALUE ? "var(--color-text-secondary)" : "var(--color-text)",
                cursor: "default",
                boxShadow: "none",
                userSelect: "text",
            }}
        >
            {display_value}
        </div>
    );
}

type ProfileSelectFieldProps = {
    editing: boolean;
    label: string;
    value: string;
    options: SelectOption[];
    placeholder: string;
    onChange: (value: string) => void;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
};

function ProfileSelectField({
    editing,
    label,
    value,
    options,
    placeholder,
    onChange,
    hint,
    required,
    disabled,
}: ProfileSelectFieldProps) {
    const selected_label = options.find((option) => option.value === value)?.label ?? value;

    return (
        <FormField label={label} hint={hint} required={editing && required}>
            {editing ? (
                <select
                    className="select"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    disabled={disabled}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : (
                <ReadOnlyFieldValue value={selected_label} />
            )}
        </FormField>
    );
}

type ProfileNumberFieldProps = {
    editing: boolean;
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
};

function ProfileNumberField({ editing, label, value, onChange, disabled }: ProfileNumberFieldProps) {
    return (
        <FormField label={label}>
            {editing ? (
                <Input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => onChange(Number.parseInt(e.target.value || "0", 10) || 0)}
                    disabled={disabled}
                />
            ) : (
                <ReadOnlyFieldValue value={value} />
            )}
        </FormField>
    );
}

function build_profile_form_state(data: ProfileResponse): ProfileFormState {
    return {
        username: data.username ?? "",
        language_pref: data.language_pref,
        share_with_providers: data.share_with_providers,
        demographics: {
            ...EMPTY_DALLAS_COUNTY_DEMOGRAPHICS,
            ...data.demographics,
        },
    };
}

export function ProfileClient() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const auth_t = useTranslations("Auth");
    const nav_t = useTranslations("Nav");
    const t = useTranslations("Profile");
    const { toasts, show_toast, dismiss } = useToast();

    const [profile, set_profile] = useState<ProfileResponse | null>(null);
    const [form, set_form] = useState<ProfileFormState>(DEFAULT_PROFILE_FORM(locale));
    const [loading_profile, set_loading_profile] = useState(true);
    const [load_error, set_load_error] = useState("");
    const [saving_profile, set_saving_profile] = useState(false);
    const [saving_sharing, set_saving_sharing] = useState(false);
    const [is_editing, set_is_editing] = useState(false);
    const [password_modal_open, set_password_modal_open] = useState(false);
    const [saving_password, set_saving_password] = useState(false);
    const [pw_form, set_pw_form] = useState({ current: "", new_pw: "", confirm: "" });

    const apply_profile_data = useCallback((data: ProfileResponse) => {
        set_profile(data);
        set_form(build_profile_form_state(data));
        set_is_editing(false);
    }, []);

    function cancel_editing() {
        if (!profile) return;
        set_form(build_profile_form_state(profile));
        set_is_editing(false);
    }

    const fetch_profile = useCallback(async () => {
        set_loading_profile(true);
        set_load_error("");

        try {
            const res = await fetch("/api/users/me", {
                cache: "no-store",
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t("profile_load_error"));
            }

            apply_profile_data(data);
        } catch (error) {
            set_load_error(
                error instanceof Error ? error.message : t("profile_load_error"),
            );
        } finally {
            set_loading_profile(false);
        }
    }, [apply_profile_data, t]);

    useEffect(() => {
        void fetch_profile();
    }, [fetch_profile]);

    function set_demographic<K extends keyof DallasCountyDemographicsInput>(
        key: K,
        value: DallasCountyDemographicsInput[K],
    ) {
        set_form((current) => ({
            ...current,
            demographics: {
                ...current.demographics,
                [key]: value,
            },
        }));
    }

    async function handle_save_profile(e: React.FormEvent) {
        e.preventDefault();
        set_saving_profile(true);

        try {
            const previous_language = profile?.language_pref ?? form.language_pref;
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username.trim(),
                    language_pref: form.language_pref,
                    share_with_providers: form.share_with_providers,
                    demographics: form.demographics,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                show_toast(data.error || t("profile_update_error"), "error");
                return;
            }

            apply_profile_data(data);
            show_toast(t("profile_updated"), "success");

            if (form.language_pref !== previous_language) {
                const max_age = 365 * 24 * 60 * 60;
                document.cookie = `NEXT_LOCALE=${form.language_pref}; path=/; max-age=${max_age}; SameSite=Lax`;
                router.replace(pathname, { locale: form.language_pref });
            }
        } catch {
            show_toast(t("profile_update_error"), "error");
        } finally {
            set_saving_profile(false);
        }
    }

    async function handle_change_password(e: React.FormEvent) {
        e.preventDefault();
        if (pw_form.new_pw !== pw_form.confirm) return;

        set_saving_password(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: pw_form.current,
                    new_password: pw_form.new_pw,
                }),
            });

            if (res.ok) {
                show_toast(t("password_updated"), "success");
                set_password_modal_open(false);
                set_pw_form({ current: "", new_pw: "", confirm: "" });
            } else {
                show_toast(t("password_error"), "error");
            }
        } catch {
            show_toast(t("password_error"), "error");
        } finally {
            set_saving_password(false);
        }
    }

    async function handle_sign_out() {
        const login_url = `/${locale}/auth/login`;
        const redirect = () => window.location.replace(login_url);
        const timeout = window.setTimeout(redirect, 3000);
        try {
            await sign_out_action();
        } catch {
            // still redirect so UI never stays stuck
        } finally {
            window.clearTimeout(timeout);
            redirect();
        }
    }

    async function handle_toggle_share_with_providers(next_value: boolean) {
        const previous_value = form.share_with_providers;

        set_form((current) => ({
            ...current,
            share_with_providers: next_value,
        }));
        set_profile((current) =>
            current
                ? {
                    ...current,
                    share_with_providers: next_value,
                }
                : current,
        );
        set_saving_sharing(true);

        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    share_with_providers: next_value,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || t("profile_update_error"));
            }

            const persisted_value = Boolean(data.share_with_providers);
            set_form((current) => ({
                ...current,
                share_with_providers: persisted_value,
            }));
            set_profile((current) =>
                current
                    ? {
                        ...current,
                        share_with_providers: persisted_value,
                    }
                    : current,
            );
            show_toast(t("profile_updated"), "success");
        } catch {
            set_form((current) => ({
                ...current,
                share_with_providers: previous_value,
            }));
            set_profile((current) =>
                current
                    ? {
                        ...current,
                        share_with_providers: previous_value,
                    }
                    : current,
            );
            show_toast(t("profile_update_error"), "error");
        } finally {
            set_saving_sharing(false);
        }
    }

    const initials = (
        profile?.username?.[0] ??
        profile?.email?.[0] ??
        "?"
    ).toUpperCase();
    const form_disabled = !is_editing || saving_profile;
    const select_placeholder = auth_t("select_placeholder");
    const optional_placeholder = auth_t("optional_placeholder");
    const language_options: SelectOption[] = [
        { value: "en", label: t("lang_english") },
        { value: "es", label: t("lang_spanish") },
    ];
    if (loading_profile) {
        return (
            <div className="card p-6">
                <ToastContainer toasts={toasts} dismiss={dismiss} />
                <p style={{ color: "var(--color-text-secondary)" }}>
                    {t("loading_profile")}
                </p>
            </div>
        );
    }

    if (load_error || !profile) {
        return (
            <div className="space-y-4">
                <ToastContainer toasts={toasts} dismiss={dismiss} />
                <div className="card p-6 space-y-4">
                    <p style={{ color: "var(--color-danger)" }}>
                        {load_error || t("profile_load_error")}
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void fetch_profile()}
                    >
                        {t("retry")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-6">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            <div className="card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                            style={{ background: "var(--color-primary)" }}
                        >
                            {initials}
                        </div>
                        <div>
                            <p className="font-semibold text-lg" style={{ color: "var(--color-text)" }}>
                                {profile.username || profile.email}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                {profile.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {is_editing ? (
                            <button
                                type="button"
                                onClick={cancel_editing}
                                className="btn btn-secondary"
                                disabled={saving_profile}
                            >
                                {t("cancel_editing")}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => set_is_editing(true)}
                                className="btn btn-primary"
                            >
                                {t("edit_profile")}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => set_password_modal_open(true)}
                            className="btn btn-secondary"
                            disabled={saving_profile}
                        >
                            {t("change_password")}
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handle_save_profile} className="space-y-4">
                <div className="card p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                            {t("account_section")}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            {t("account_section_help")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            label={auth_t("username")}
                            hint={t("username_hint")}
                            required={is_editing}
                        >
                            {is_editing ? (
                                <Input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) =>
                                        set_form((current) => ({
                                            ...current,
                                            username: e.target.value,
                                        }))
                                    }
                                    required
                                    disabled={form_disabled}
                                />
                            ) : (
                                <ReadOnlyFieldValue value={form.username} />
                            )}
                        </FormField>

                        <FormField label={t("email")} hint={t("email_readonly")}>
                            <ReadOnlyFieldValue value={profile.email} />
                        </FormField>

                        <ProfileSelectField
                            editing={is_editing}
                            label={t("language_pref")}
                            value={form.language_pref}
                            options={language_options}
                            placeholder={select_placeholder}
                            onChange={(value) =>
                                set_form((current) => ({
                                    ...current,
                                    language_pref: value as Locale,
                                }))
                            }
                            required
                            disabled={form_disabled}
                        />
                    </div>
                </div>

                <div className="card p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                            {t("demographics_section")}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            {t("demographics_section_help")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("race")}
                            value={form.demographics.race}
                            options={DALLAS_COUNTY_RACE_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={select_placeholder}
                            onChange={(value) => set_demographic("race", value)}
                            required
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("gender")}
                            value={form.demographics.gender}
                            options={DALLAS_COUNTY_GENDER_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={select_placeholder}
                            onChange={(value) => set_demographic("gender", value)}
                            required
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("ethnicity")}
                            value={form.demographics.ethnicity ?? ""}
                            options={DALLAS_COUNTY_ETHNICITY_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={optional_placeholder}
                            onChange={(value) => set_demographic("ethnicity", value)}
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("age_band")}
                            value={form.demographics.age_band}
                            options={DALLAS_COUNTY_AGE_BAND_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={select_placeholder}
                            onChange={(value) => set_demographic("age_band", value)}
                            required
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("marital_status")}
                            value={form.demographics.marital_status ?? ""}
                            options={DALLAS_COUNTY_MARITAL_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={optional_placeholder}
                            onChange={(value) => set_demographic("marital_status", value)}
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("county")}
                            value={form.demographics.county_of_residence}
                            options={DALLAS_COUNTY_COUNTY_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={select_placeholder}
                            onChange={(value) => set_demographic("county_of_residence", value)}
                            required
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("employment_status")}
                            value={form.demographics.employment_status ?? ""}
                            options={DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={optional_placeholder}
                            onChange={(value) => set_demographic("employment_status", value)}
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("annual_income_bracket")}
                            value={form.demographics.annual_income_bracket ?? ""}
                            options={DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={optional_placeholder}
                            onChange={(value) => set_demographic("annual_income_bracket", value)}
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("education")}
                            value={form.demographics.education_level ?? ""}
                            options={DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={optional_placeholder}
                            onChange={(value) => set_demographic("education_level", value)}
                            disabled={form_disabled}
                        />

                        <ProfileSelectField
                            editing={is_editing}
                            label={auth_t("primary_language")}
                            value={form.demographics.primary_language}
                            options={DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS.map((option) => ({ value: option, label: option }))}
                            placeholder={select_placeholder}
                            onChange={(value) => set_demographic("primary_language", value)}
                            required
                            disabled={form_disabled}
                        />
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>
                            {auth_t("children_heading")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ProfileNumberField
                                editing={is_editing}
                                label={auth_t("children_under_5_count")}
                                value={form.demographics.children_under_5_count}
                                onChange={(value) => set_demographic("children_under_5_count", value)}
                                disabled={form_disabled}
                            />

                            <ProfileNumberField
                                editing={is_editing}
                                label={auth_t("children_5_to_18_count")}
                                value={form.demographics.children_5_to_18_count}
                                onChange={(value) => set_demographic("children_5_to_18_count", value)}
                                disabled={form_disabled}
                            />

                            <ProfileNumberField
                                editing={is_editing}
                                label={auth_t("children_over_18_count")}
                                value={form.demographics.children_over_18_count}
                                onChange={(value) => set_demographic("children_over_18_count", value)}
                                disabled={form_disabled}
                            />
                        </div>
                    </div>
                </div>

                <div className="card p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                            {t("privacy_section")}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            {t("privacy_section_help")}
                        </p>
                    </div>

                    <label className="flex items-start gap-3 text-sm" style={{ color: "var(--color-text)" }}>
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={form.share_with_providers}
                            onChange={(e) => {
                                void handle_toggle_share_with_providers(e.target.checked);
                            }}
                            disabled={saving_profile || saving_sharing}
                        />
                        <span>
                            <span className="font-medium">{auth_t("share_with_providers")}</span>
                            <span className="block text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                {t("sharing_help")}
                            </span>
                            <span className="block text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                {form.share_with_providers ? t("sharing_enabled") : t("sharing_disabled")}
                            </span>
                        </span>
                    </label>
                </div>

                {is_editing && (
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={cancel_editing}
                            disabled={saving_profile}
                        >
                            {t("cancel_editing")}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving_profile}
                        >
                            {saving_profile ? t("saving_profile") : t("save_profile")}
                        </button>
                    </div>
                )}

                <InstallButton />

                <div className="card p-4 md:hidden">
                    <button
                        type="button"
                        onClick={() => void handle_sign_out()}
                        className="w-full px-4 py-2 rounded-lg text-sm font-medium"
                        style={{
                            color: "#ef4444",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface)",
                        }}
                    >
                        {nav_t("sign_out")}
                    </button>
                </div>
            </form>

            <Modal
                open={password_modal_open}
                onClose={() => set_password_modal_open(false)}
                title={t("change_password")}
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => set_password_modal_open(false)}
                            className="btn btn-secondary"
                            disabled={saving_password}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            form="pw-form"
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving_password}
                        >
                            {saving_password ? "…" : t("save")}
                        </button>
                    </>
                }
            >
                <form
                    id="pw-form"
                    onSubmit={handle_change_password}
                    className="space-y-4"
                >
                    <FormField label={t("current_password")} required>
                        <Input
                            type="password"
                            value={pw_form.current}
                            onChange={(e) => set_pw_form((current) => ({ ...current, current: e.target.value }))}
                            required
                            autoComplete="current-password"
                        />
                    </FormField>
                    <FormField
                        label={t("new_password")}
                        required
                        hint={auth_t("password_hint")}
                    >
                        <Input
                            type="password"
                            value={pw_form.new_pw}
                            onChange={(e) => set_pw_form((current) => ({ ...current, new_pw: e.target.value }))}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </FormField>
                    <FormField
                        label={t("confirm_new_password")}
                        required
                        error={
                            pw_form.confirm && pw_form.confirm !== pw_form.new_pw
                                ? auth_t("passwords_mismatch")
                                : undefined
                        }
                    >
                        <Input
                            type="password"
                            value={pw_form.confirm}
                            onChange={(e) => set_pw_form((current) => ({ ...current, confirm: e.target.value }))}
                            required
                            autoComplete="new-password"
                        />
                    </FormField>
                </form>
            </Modal>
        </div>
    );
}
