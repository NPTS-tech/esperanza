import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { ReservationsClient } from "./reservations_client";

export default async function ReservationsPage() {
    const [session, locale, t] = await Promise.all([
        getSession(),
        getLocale(),
        getTranslations("Profile"),
    ]);

    if (!session?.user) {
        redirect({ href: "/auth/login", locale });
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("rsvp_history")}
                </h1>
            </div>
            <ReservationsClient />
        </div>
    );
}
