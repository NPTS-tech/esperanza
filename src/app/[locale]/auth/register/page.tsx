"use client";

import { Fragment, useEffect, useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
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
import { get_default_primary_language_for_locale } from "@/lib/dallas_county_profile";
import { register_schema } from "@/lib/validators/auth";

export type Locale = "en" | "es";

type RegisterAccount = {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    language_pref: Locale;
};

type RegisterDemographics = {
    race: string;
    gender: string;
    ethnicity: string;
    age_band: string;
    marital_status: string;
    children_under_5_count: number;
    children_5_to_18_count: number;
    children_over_18_count: number;
    county_of_residence: string;
    employment_status: string;
    annual_income_bracket: string;
    education_level: string;
    primary_language: string;
};

type RegisterDraft = {
    step: number;
    account: RegisterAccount;
    demographics: RegisterDemographics;
    share_with_providers: boolean;
    consent: boolean;
};

let register_draft: RegisterDraft | null = null;

function normalize_locale(locale: string): Locale {
    return locale === "es" ? "es" : "en";
}

function create_register_draft(locale: Locale): RegisterDraft {
    return {
        step: 1,
        account: {
            username: "",
            email: "",
            password: "",
            confirm_password: "",
            language_pref: locale,
        },
        demographics: {
            race: "",
            gender: "",
            ethnicity: "",
            age_band: "",
            marital_status: "",
            children_under_5_count: 0,
            children_5_to_18_count: 0,
            children_over_18_count: 0,
            county_of_residence: "",
            employment_status: "",
            annual_income_bracket: "",
            education_level: "",
            primary_language: get_default_primary_language_for_locale(locale),
        },
        share_with_providers: true,
        consent: false,
    };
}

function get_register_draft(locale: Locale): RegisterDraft {
    return register_draft ?? create_register_draft(locale);
}

function should_update_primary_language_for_locale_switch(demographics: RegisterDemographics, locale: Locale) {
    return (
        demographics.primary_language === "" ||
        demographics.primary_language === get_default_primary_language_for_locale(locale)
    );
}

function clear_register_draft() {
    register_draft = null;
}


function RequiredAsterisk() {
    return (
        <span className="text-red-500" aria-hidden="true">
            *
        </span>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("Auth");
    const activeLocale = normalize_locale(useLocale());
    const initial_draft = get_register_draft(activeLocale);

    const [step, set_step] = useState(initial_draft.step);
    const [error, set_error] = useState("");
    const [loading, set_loading] = useState(false);

    const [account, set_account] = useState<RegisterAccount>(initial_draft.account);
    const [demographics, set_demographics] = useState<RegisterDemographics>(initial_draft.demographics);
    const [share_with_providers, set_share_with_providers] = useState(initial_draft.share_with_providers);
    const [consent, set_consent] = useState(initial_draft.consent);

    function stash_register_draft(next_draft?: Partial<RegisterDraft>) {
        register_draft = {
            step,
            account,
            demographics,
            share_with_providers,
            consent,
            ...next_draft,
        };
    }

    function switch_locale(next_locale: Locale, next_language_pref: Locale = next_locale) {
        const next_account = {
            ...account,
            language_pref: next_language_pref,
        };
        const next_demographics = should_update_primary_language_for_locale_switch(demographics, activeLocale)
            ? {
                ...demographics,
                primary_language: get_default_primary_language_for_locale(next_locale),
            }
            : demographics;

        set_account(next_account);
        set_demographics(next_demographics);
        set_error("");
        stash_register_draft({
            account: next_account,
            demographics: next_demographics,
        });
        router.replace(pathname, { locale: next_locale });
    }

    function toggle_lang() {
        switch_locale(activeLocale === "en" ? "es" : "en");
    }

    useEffect(() => {
        register_draft = {
            step,
            account,
            demographics,
            share_with_providers,
            consent,
        };
    }, [step, account, demographics, share_with_providers, consent]);

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_error("");

        if (step === 1) {
            if (!account.username.trim()) {
                set_error(t("username_required"));
                return;
            }
            if (account.password !== account.confirm_password) {
                set_error(t("passwords_mismatch"));
                return;
            }
            if (account.password.length < 8) {
                set_error(t("password_too_short"));
                return;
            }
            set_step(2);
        } else if (step === 2) {
            if (
                !demographics.race ||
                !demographics.gender ||
                !demographics.age_band ||
                !demographics.county_of_residence || 
                !demographics.primary_language
            ) {
                set_error(t("demographics_required"));
                return;
            }
            set_step(3);
        } else {
            if (!consent) {
                set_error(t("consent_required"));
                return;
            }

            set_loading(true);

            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: account.username.trim(),
                        email: account.email,
                        password: account.password,
                        confirm_password: account.confirm_password,
                        language_pref: account.language_pref,
                        share_with_providers,
                        consent,
                        ...demographics,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    set_error(data.error || t("registration_failed"));
                    set_loading(false);
                    return;
                }

                const { error: sign_in_error } = await signIn.email({
                    email: account.email,
                    password: account.password,
                });

                set_loading(false);

                if (sign_in_error) {
                    set_error(t("signin_after_register_failed"));
                    return;
                }

                clear_register_draft();
                window.location.href = `/${activeLocale}`;
            } catch {
                set_error(t("generic_error"));
                set_loading(false);
            }
        }
    }

    const step_names = [t("step_account"), t("step_demographics"), t("step_consent")];

    return (
        <div>
            {/* Language toggle */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={toggle_lang}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{
                        color: "var(--color-text-secondary)",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <Globe size={13} />
                    {activeLocale === "en" ? "Español" : "English"}
                </button>
            </div>

            <div className="text-center mb-5">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("create_account")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("join_community")}
                </p>
            </div>

            {/* Step indicator with numbered circles */}
            <div className="flex items-center justify-center mb-6 mx-auto w-full max-w-xs">
                {[1, 2, 3].map((s, i) => (
                    <Fragment key={s}>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold leading-none transition-colors shrink-0"
                            style={{
                                background: s <= step ? "var(--color-primary)" : "var(--color-border)",
                                color: s <= step ? "white" : "var(--color-text-secondary)",
                            }}
                        >
                            {s}
                        </div>
                        {i < 2 && (
                            <div
                                className="h-0.5 flex-1 mx-1 transition-colors"
                                style={{ background: s < step ? "var(--color-primary)" : "var(--color-border)" }}
                            />
                        )}
                    </Fragment>
                ))}
            </div>
            <p className="text-xs text-center mb-4" style={{ color: "var(--color-text-secondary)" }}>
                {t("step_label")} {step} {t("of")} 3 — {step_names[step - 1]}
            </p>

            <div className="card p-6">
                <form onSubmit={handle_submit} className="space-y-4">
                    {error && (
                        <div className="text-sm p-3 rounded-lg" style={{ background: "#fef2f2", color: "var(--color-danger)" }}>
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>
                                    {t("username")} <RequiredAsterisk />
                                </label>
                                
                                <input type="text" className="input" required placeholder="neighbor_01"
                                    value={account.username} onChange={(e) => set_account({ ...account, username: e.target.value })} />
                                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{t("username_hint")}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>
                                    {t("email")} <RequiredAsterisk />
                                </label>
                                <input type="email" className="input" required placeholder="you@example.com"
                                    value={account.email} onChange={(e) => set_account({ ...account, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>
                                    {t("password")} <RequiredAsterisk />
                                </label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.password} onChange={(e) => set_account({ ...account, password: e.target.value })} />
                                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{t("password_hint")}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>
                                    {t("confirm_password")} <RequiredAsterisk />
                                </label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.confirm_password} onChange={(e) => set_account({ ...account, confirm_password: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>
                                    {t("preferred_language")} <RequiredAsterisk />
                                </label>
                                <select className="select"
                                    value={account.language_pref} onChange={(e) => {
                                        const new_lang = e.target.value as Locale;
                                        if (new_lang === "en" || new_lang === "es") {
                                            switch_locale(new_lang, new_lang);
                                        }
                                    }}>
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
                                {t("demographics_info")}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("race")} <RequiredAsterisk /> </label>
                                    <select className="select" value={demographics.race} required
                                        onChange={(e) => set_demographics({ ...demographics, race: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_RACE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("gender")} <RequiredAsterisk /> </label>
                                    <select className="select" value={demographics.gender} required
                                        onChange={(e) => set_demographics({ ...demographics, gender: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_GENDER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("ethnicity")}</label>
                                    <select className="select" value={demographics.ethnicity}
                                        onChange={(e) => set_demographics({ ...demographics, ethnicity: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_ETHNICITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("age_band")} <RequiredAsterisk /> </label>
                                    <select className="select" value={demographics.age_band} required
                                        onChange={(e) => set_demographics({ ...demographics, age_band: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_AGE_BAND_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("marital_status")}</label>
                                    <select className="select" value={demographics.marital_status}
                                        onChange={(e) => set_demographics({ ...demographics, marital_status: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_MARITAL_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("county")} <RequiredAsterisk /> </label>
                                    <select className="select" value={demographics.county_of_residence} required
                                        onChange={(e) => set_demographics({ ...demographics, county_of_residence: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_COUNTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("employment_status")}</label>
                                    <select className="select" value={demographics.employment_status}
                                        onChange={(e) => set_demographics({ ...demographics, employment_status: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("annual_income_bracket")}</label>
                                    <select className="select" value={demographics.annual_income_bracket} 
                                        onChange={(e) => set_demographics({ ...demographics, annual_income_bracket: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("education")}</label>
                                    <select className="select" value={demographics.education_level}
                                        onChange={(e) => set_demographics({ ...demographics, education_level: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("primary_language")} <RequiredAsterisk /> </label>
                                    <select className="select" value={demographics.primary_language} required
                                        onChange={(e) => set_demographics({ ...demographics, primary_language: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>
                                    {t("children_heading")}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("children_under_5_count")}</label>
                                        <input type="number" className="input" min="0"
                                            value={demographics.children_under_5_count}
                                            onChange={(e) => set_demographics({
                                                ...demographics,
                                                children_under_5_count: Number.parseInt(e.target.value || "0", 10) || 0,
                                            })} />
                                    </div>
                                    <div>
                                        <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("children_5_to_18_count")}</label>
                                        <input type="number" className="input" min="0"
                                            value={demographics.children_5_to_18_count}
                                            onChange={(e) => set_demographics({
                                                ...demographics,
                                                children_5_to_18_count: Number.parseInt(e.target.value || "0", 10) || 0,
                                            })} />
                                    </div>
                                    <div>
                                        <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("children_over_18_count")}</label>
                                        <input type="number" className="input" min="0"
                                            value={demographics.children_over_18_count}
                                            onChange={(e) => set_demographics({
                                                ...demographics,
                                                children_over_18_count: Number.parseInt(e.target.value || "0", 10) || 0,
                                            })} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div style={{ background: "var(--color-surface-hover)", borderRadius: "0.75rem", padding: "1rem" }} className="text-sm">
                                <h3 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>{t("consent_title")}</h3>
                                <p className="mb-3" style={{ color: "var(--color-text-secondary)" }}>
                                    {t("consent_intro")}
                                </p>
                                <ul className="space-y-1.5 list-disc list-inside" style={{ color: "var(--color-text-secondary)" }}>
                                    <li>{t("consent_1")}</li>
                                    <li>{t("consent_2")}</li>
                                    <li>{t("consent_3")}</li>
                                    <li>{t("consent_4")}</li>
                                    <li>{t("consent_5")}</li>
                                </ul>
                            </div>
                            <label className="flex items-start gap-3 text-sm pt-2" style={{ color: "var(--color-text)" }}>
                                <input
                                    type="checkbox"
                                    checked={share_with_providers}
                                    onChange={(e) => set_share_with_providers(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="font-medium">{t("share_with_providers")}</span>
                                    <span className="block text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                        {t("share_with_providers_help")}
                                    </span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 text-sm pt-2" style={{ color: "var(--color-text)" }}>
                                
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => set_consent(e.target.checked)}
                                    className="mt-1"
                                />
                                
                                <span>{t("consent_checkbox")}</span>
                                <RequiredAsterisk/>
                            </label>
                        </>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        {step > 1 && (
                            <button type="button" onClick={() => { set_step(step - 1); set_error(""); }} className="btn btn-secondary flex-1" disabled={loading}>
                                {t("back")}
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                            {loading ? t("creating_account") : step === 3 ? t("create_account_btn") : t("next")}
                        </button>
                    </div>
                </form>

                {step === 1 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {t("already_have_account")}{" "}
                            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                                {t("sign_in_link")}
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
