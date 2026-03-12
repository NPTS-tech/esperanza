"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("Auth");
    const activeLocale = useLocale();

    const [email, set_email] = useState("");
    const [password, set_password] = useState("");
    const [error, set_error] = useState("");
    const [loading, set_loading] = useState(false);

    function toggle_lang() {
        const next_lang = activeLocale === "en" ? "es" : "en";
        // routing.ts handles the path change transparently
        router.replace(pathname, { locale: next_lang });
    }

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_error("");
        set_loading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        set_loading(false);

        if (result?.error) {
            set_error(t("invalid_credentials"));
            return;
        }

        window.location.href = "/";
    }

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

            <div className="text-center mb-6">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("welcome_back")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("sign_in_subtitle")}
                </p>
            </div>

            <div className="card p-6">
                <form onSubmit={handle_submit} className="space-y-4">
                    {error && (
                        <div className="text-sm p-3 rounded-lg" style={{ background: "#fef2f2", color: "var(--color-danger)" }}>
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("email")}</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => set_email(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1" style={{ color: "var(--color-text)" }}>{t("password")}</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => set_password(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? t("signing_in") : t("sign_in")}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {t("no_account")}{" "}
                        <Link href="/auth/register" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                            {t("register")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
