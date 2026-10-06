import { requireRole } from "@/lib/auth";
import { Users as UsersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminUsersDashboard } from "../admin_users_dashboard";

export default async function AdminUsersPage() {
    const session = await requireRole(["ADMIN"]);

  const t_admin = await getTranslations("Admin");
  const t_dashboard = await getTranslations("Dashboard");

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <UsersIcon size={48} style={{ color: "var(--color-primary)" }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {t_admin("user_management")}
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

      <AdminUsersDashboard
        title={t_admin("title")}
        subtitle={t_admin("subtitle")}
        user_management={t_admin("user_management")}
        total_users={t_admin("total_users")}
        email={t_admin("email")}
        role={t_admin("role")}
        created={t_admin("created")}
        actions={t_admin("actions")}
        loading_users={t_admin("loading_users")}
        error_loading_users={t_admin("error_loading_users")}
        retry={t_admin("retry")}
        role_update_success={t_admin("role_update_success")}
        role_update_error={t_admin("role_update_error")}
        delete_user={t_admin("delete_user")}
        delete_user_confirm={t_admin("delete_user_confirm")}
        delete_user_success={t_admin("delete_user_success")}
        delete_user_error={t_admin("delete_user_error")}
        search_users={t_admin("search_users")}
        filter_all_roles={t_admin("filter_all_roles")}
        role_user={t_admin("role_user")}
        role_provider={t_admin("role_provider")}
        role_admin={t_admin("role_admin")}
        deleting={t_admin("deleting")}
      />
    </div>
  );
}
