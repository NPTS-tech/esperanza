import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProviderDashboard } from "./provider_dashboard";

export default async function ProviderPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
        redirect("/");
    }

    const t_provider = await getTranslations("Provider");
    const t_dashboard = await getTranslations("Dashboard");

    const provider_id = session.user.id ?? "";
    const provider_email = session.user.email ?? "";

    return (
        <div className="max-w-6xl mx-auto px-4 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Briefcase size={48} style={{ color: "var(--color-secondary)" }} />
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                            {t_provider("title")}
                        </h1>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {t_provider("subtitle")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {t_dashboard("signed_in_as")}{" "}
                        <span className="font-medium" style={{ color: "var(--color-text)" }}>
                            {session.user.email}
                        </span>
                    </p>
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/auth/login" });
                        }}
                    >
                        <button type="submit" className="btn btn-secondary">
                            {t_dashboard("sign_out")}
                        </button>
                    </form>
                </div>
            </div>

            <ProviderDashboard
                title={t_provider("title")}
                subtitle={t_provider("subtitle")}
                submit_event={t_provider("submit_event")}
                my_events={t_provider("my_events")}
                title_en={t_provider("title_en")}
                title_es={t_provider("title_es")}
                description_en={t_provider("description_en")}
                description_es={t_provider("description_es")}
                location_name={t_provider("location_name")}
                latitude={t_provider("latitude")}
                longitude={t_provider("longitude")}
                start_time={t_provider("start_time")}
                end_time={t_provider("end_time")}
                category={t_provider("category")}
                category_placeholder={t_provider("category_placeholder")}
                image_url={t_provider("image_url")}
                submit={t_provider("submit")}
                my_total_events={t_provider("my_total_events")}
                approved_events={t_provider("approved_events")}
                pending_events={t_provider("pending_events")}
                total_rsvps={t_provider("total_rsvps")}
                rsvp_count={t_provider("rsvp_count")}
                reapproval_warning={t_provider("reapproval_warning")}
                event_submitted={t_provider("event_submitted")}
                no_events={t_provider("no_events")}
                table_title={t_provider("table_title")}
                date={t_provider("date")}
                status={t_provider("status")}
                provider_id={provider_id}
                provider_email={provider_email}
            />
        </div>
    );
}
