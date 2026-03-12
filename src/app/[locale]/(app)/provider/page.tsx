import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProviderDashboard } from "./provider_dashboard";

export default async function ProviderPage() {
    const session = await auth();
    if (!session) redirect("/auth/login");
    if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") redirect("/");

    const t = await getTranslations("Provider");

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("title")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("subtitle")}
                </p>
            </div>

            <ProviderDashboard
                title={t("title")}
                subtitle={t("subtitle")}
                submit_event={t("submit_event")}
                my_events={t("my_events")}
                title_en={t("title_en")}
                title_es={t("title_es")}
                description_en={t("description_en")}
                description_es={t("description_es")}
                location_name={t("location_name")}
                latitude={t("latitude")}
                longitude={t("longitude")}
                start_time={t("start_time")}
                end_time={t("end_time")}
                category={t("category")}
                category_placeholder={t("category_placeholder")}
                image_url={t("image_url")}
                submit={t("submit")}
                my_total_events={t("my_total_events")}
                approved_events={t("approved_events")}
                pending_events={t("pending_events")}
                total_rsvps={t("total_rsvps")}
                rsvp_count={t("rsvp_count")}
                reapproval_warning={t("reapproval_warning")}
                event_submitted={t("event_submitted")}
                no_events={t("no_events")}
                table_title={t("table_title")}
                date={t("date")}
                status={t("status")}
                provider_id={session.user.id ?? ""}
                provider_email={session.user.email ?? ""}
            />
        </div>
    );
}
