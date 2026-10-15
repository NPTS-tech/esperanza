import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { ProfileClient } from "./profile_client";
import { SignOutButton } from "./sign_out_button";

export default async function ProfilePage() {
    const [session, locale, t, nav_t] = await Promise.all([
        getSession(),
        getLocale(),
        getTranslations("Profile"),
        getTranslations("Nav"),
    ]);

    if (!session?.user) {
        redirect({ href: "/auth/login", locale });
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
                <SignOutButton label={nav_t("sign_out")} />
            </div>
            <ProfileClient vapid_public_key={process.env.VAPID_PUBLIC_KEY ?? null} />
        </div>
    );
}
