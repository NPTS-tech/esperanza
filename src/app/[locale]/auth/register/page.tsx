"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import {
    RACE_OPTIONS,
    GENDER_OPTIONS,
    INCOME_BRACKETS,
    COUNTY_OPTIONS,
    EDUCATION_OPTIONS,
    INDUSTRY_OPTIONS,
} from "@/lib/constants";

export type Locale = "en" | "es";

export default function RegisterPage() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("Auth");
    const activeLocale = useLocale();

    const [step, set_step] = useState(1);
    const [error, set_error] = useState("");
    const [loading, set_loading] = useState(false);

    function toggle_lang() {
        const next_lang = activeLocale === "en" ? "es" : "en";
        // routing.ts handles the path change transparently
        router.replace(pathname, { locale: next_lang });
    }

    const [account, set_account] = useState({
        email: "",
        password: "",
        confirm_password: "",
        language_pref: "en",
    });

    const [demographics, set_demographics] = useState({
        race: "",
        gender: "",
        age: "",
        annual_personal_income: "",
        annual_household_income: "",
        county: "",
        has_children_under_18: false,
        has_children_under_5: false,
        educational_attainment: "",
        has_personal_vehicle: false,
        is_employed: false,
        industry_area: "",
    });

    const [consent, set_consent] = useState(false);

    // sync the account language pref with the UI language
    useEffect(() => {
        set_account((prev) => ({ ...prev, language_pref: activeLocale }));
    }, [activeLocale]);

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_error("");

        if (step === 1) {
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
                        email: account.email,
                        password: account.password,
                        confirm_password: account.confirm_password,
                        language_pref: account.language_pref,
                        consent,
                        ...demographics,
                        age: demographics.age ? parseInt(demographics.age) : null,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    set_error(data.error || t("registration_failed"));
                    set_loading(false);
                    return;
                }

                const sign_in_result = await signIn("credentials", {
                    email: account.email,
                    password: account.password,
                    redirect: false,
                });

                set_loading(false);

                if (sign_in_result?.error) {
                    set_error(t("signin_after_register_failed"));
                    return;
                }

                window.location.href = "/";
            } catch {
                set_error(t("generic_error"));
                set_loading(false);
            }
        }
    }

    const step_names = [t("step_account"), t("step_demographics"), t("step_consent")];

    return (
        <div className="max-w-lg mx-auto mt-8 px-4">
            {/* language toggle */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={toggle_lang}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors"
                    style={{
                        color: "var(--color-text-secondary)",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <Globe size={14} />
                    {activeLocale === "en" ? "Español" : "English"}
                </button>
            </div>

            <div className="text-center mb-8">
                <span className="text-5xl">🌿</span>
                <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
                    {t("create_account")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("join_community")}
                </p>
            </div>

            {/* progress bar */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className="flex-1 h-2 rounded-full transition-colors"
                        style={{ background: s <= step ? "var(--color-primary)" : "var(--color-border)" }}
                    />
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
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("email")}</label>
                                <input type="email" className="input" required placeholder="you@example.com"
                                    value={account.email} onChange={(e) => set_account({ ...account, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("password")}</label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.password} onChange={(e) => set_account({ ...account, password: e.target.value })} />
                                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{t("password_hint")}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("confirm_password")}</label>
                                <input type="password" className="input" required placeholder="••••••••"
                                    value={account.confirm_password} onChange={(e) => set_account({ ...account, confirm_password: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("preferred_language")}</label>
                                <select className="select"
                                    value={account.language_pref} onChange={(e) => {
                                        set_account({ ...account, language_pref: e.target.value });
                                        const new_lang = e.target.value as Locale;
                                        if (new_lang === "en" || new_lang === "es") {
                                            router.replace(pathname, { locale: new_lang });
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
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("race")}</label>
                                    <select className="select" value={demographics.race}
                                        onChange={(e) => set_demographics({ ...demographics, race: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {RACE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("gender")}</label>
                                    <select className="select" value={demographics.gender}
                                        onChange={(e) => set_demographics({ ...demographics, gender: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {GENDER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("age")}</label>
                                    <input type="number" className="input" placeholder={t("age")} min="0" max="120"
                                        value={demographics.age} onChange={(e) => set_demographics({ ...demographics, age: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("personal_income")}</label>
                                    <select className="select" value={demographics.annual_personal_income}
                                        onChange={(e) => set_demographics({ ...demographics, annual_personal_income: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("household_income")}</label>
                                    <select className="select" value={demographics.annual_household_income}
                                        onChange={(e) => set_demographics({ ...demographics, annual_household_income: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {INCOME_BRACKETS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("county")}</label>
                                    <select className="select" value={demographics.county}
                                        onChange={(e) => set_demographics({ ...demographics, county: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {COUNTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("education")}</label>
                                    <select className="select" value={demographics.educational_attainment}
                                        onChange={(e) => set_demographics({ ...demographics, educational_attainment: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {EDUCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("industry")}</label>
                                    <select className="select" value={demographics.industry_area}
                                        onChange={(e) => set_demographics({ ...demographics, industry_area: e.target.value })}>
                                        <option value="">{t("select_placeholder")}</option>
                                        {INDUSTRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                                    <input type="checkbox" checked={demographics.has_children_under_18}
                                        onChange={(e) => set_demographics({ ...demographics, has_children_under_18: e.target.checked })} />
                                    {t("children_under_18")}
                                </label>
                                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                                    <input type="checkbox" checked={demographics.has_children_under_5}
                                        onChange={(e) => set_demographics({ ...demographics, has_children_under_5: e.target.checked })} />
                                    {t("children_under_5")}
                                </label>
                                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                                    <input type="checkbox" checked={demographics.has_personal_vehicle}
                                        onChange={(e) => set_demographics({ ...demographics, has_personal_vehicle: e.target.checked })} />
                                    {t("personal_vehicle")}
                                </label>
                                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                                    <input type="checkbox" checked={demographics.is_employed}
                                        onChange={(e) => set_demographics({ ...demographics, is_employed: e.target.checked })} />
                                    {t("currently_employed")}
                                </label>
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
                                    checked={consent}
                                    onChange={(e) => set_consent(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>{t("consent_checkbox")}</span>
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
