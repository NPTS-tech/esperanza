import { requireRole } from "@/lib/auth";
import { BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminAnalyticsDashboard } from "../admin_analytics_dashboard";

export default async function AdminAnalyticsPage() {
    const session = await requireRole(["ADMIN"]);

    const t_admin = await getTranslations("Admin");
    const t_dashboard = await getTranslations("Dashboard");

    return (
        <div className="max-w-6xl mx-auto px-4 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <BarChart3 size={48} style={{ color: "var(--color-primary)" }} />
                    <div>
                        <h1
                            className="text-2xl font-bold"
                            style={{ color: "var(--color-text)" }}
                        >
                            {t_admin("analytics_title")}
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            {t_admin("analytics_subtitle")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {t_dashboard("signed_in_as")}{" "}
                        <span
                            className="font-medium"
                            style={{ color: "var(--color-text)" }}
                        >
                            {session.user.email}
                        </span>
                    </p>
                </div>
            </div>

            <AdminAnalyticsDashboard
                total_events={t_admin("total_events")}
                pending_approvals={t_admin("pending_approvals")}
                total_rsvps={t_admin("total_rsvps")}
                loading_events={t_admin("loading_events")}
                error_loading_events={t_admin("error_loading_events")}
                retry={t_admin("retry")}
            />
        </div>
    );
}
