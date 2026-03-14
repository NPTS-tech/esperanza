import { auth } from "@/lib/auth";
import { Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminEventsDashboard } from "./admin_events_dashboard";

export default async function AdminPage() {
    const session = (await auth())!;

  const t_admin = await getTranslations("Admin");
  const t_dashboard = await getTranslations("Dashboard");

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Shield size={48} style={{ color: "var(--color-primary)" }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {t_admin("title")}
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t_admin("subtitle")}
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

      <AdminEventsDashboard
        title={t_admin("title")}
        subtitle={t_admin("subtitle")}
        pending_events={t_admin("pending_events")}
        all_events={t_admin("all_events")}
        user_management={t_admin("user_management")}
        approve={t_admin("approve")}
        reject={t_admin("reject")}
        deactivate={t_admin("deactivate")}
        total_events={t_admin("total_events")}
        pending_approvals={t_admin("pending_approvals")}
        total_rsvps={t_admin("total_rsvps")}
        event_title={t_admin("event_title")}
        provider={t_admin("provider")}
        category={t_admin("category")}
        date={t_admin("date")}
        status={t_admin("status")}
        actions={t_admin("actions")}
        no_pending={t_admin("no_pending")}
        loading_events={t_admin("loading_events")}
        error_loading_events={t_admin("error_loading_events")}
        retry={t_admin("retry")}
        status_update_success={t_admin("status_update_success")}
        status_update_error={t_admin("status_update_error")}
        status_cancelled={t_admin("status_cancelled")}
        edit={t_admin("edit")}
        delete={t_admin("delete")}
        deleting={t_admin("deleting")}
        delete_confirm={t_admin("delete_confirm")}
        delete_success={t_admin("delete_success")}
        delete_error={t_admin("delete_error")}
      />
    </div>
  );
}
