import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getTranslations, getLocale } from "next-intl/server";
import { ClientAppShell as AppShell } from "@/components/layout/client-app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const [session, locale] = await Promise.all([getSession(), getLocale()]);
    if (!session) {
        redirect({ href: "/auth/login", locale });
        return null;
    }

    const t = await getTranslations("Nav");

    return (
        <AppShell
            role={session.user.role}
            email={session.user.email ?? ""}
            locale={locale}
            app_name={t("app_name")}
            sign_out_label={t("sign_out")}
            language_toggle_label={t("language_toggle")}
            nav_home={t("home")}
            nav_events={t("events")}
            nav_map={t("map")}
            nav_profile={t("profile")}
            nav_my_events={t("my_events")}
            nav_submit_event={t("submit_event")}
            nav_users={t("users")}
            nav_analytics={t("analytics")}
        >
            {children}
        </AppShell>
    );
}
