import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminDashboard } from "./admin_dashboard";

export default async function AdminPage() {
    const session = await auth();
    if (!session) redirect("/auth/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const t = await getTranslations("Admin");

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

            <AdminDashboard
                title={t("title")}
                subtitle={t("subtitle")}
                pending_events={t("pending_events")}
                all_events={t("all_events")}
                user_management={t("user_management")}
                approve={t("approve")}
                reject={t("reject")}
                deactivate={t("deactivate")}
                total_users={t("total_users")}
                total_events={t("total_events")}
                pending_approvals={t("pending_approvals")}
                total_rsvps={t("total_rsvps")}
                event_title={t("event_title")}
                provider={t("provider")}
                category={t("category")}
                date={t("date")}
                status={t("status")}
                actions={t("actions")}
                email={t("email")}
                role={t("role")}
                created={t("created")}
                no_pending={t("no_pending")}
                deactivated={t("deactivated")}
            />
        </div>
    );
}
