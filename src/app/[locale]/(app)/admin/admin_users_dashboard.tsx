"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useLocale } from "next-intl";

export type AdminUsersDashboardProps = {
  title: string;
  subtitle: string;
  user_management: string;
  total_users: string;
  email: string;
  role: string;
  created: string;
  actions: string;
  loading_users: string;
  error_loading_users: string;
  retry: string;
  role_update_success: string;
  role_update_error: string;
  delete_user: string;
  delete_user_confirm: string;
  delete_user_success: string;
  delete_user_error: string;
  search_users: string;
  filter_all_roles: string;
  role_user: string;
  role_provider: string;
  role_admin: string;
  deleting: string;
};

type ApiUser = {
  id: string;
  email: string;
  role: "USER" | "PROVIDER" | "ADMIN";
  language_pref: string;
  consented_at: string | null;
  created_at: string;
  demographics: {
    race: string | null;
    gender: string | null;
    age: number | null;
    county: string | null;
  } | null;
  _count: {
    rsvps: number;
  };
};

function format_date(iso_string: string, locale: string): string {
  const d = new Date(iso_string);
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminUsersDashboard(props: AdminUsersDashboardProps) {
  const locale = useLocale();
  const [users, set_users] = useState<ApiUser[]>([]);
  const [users_loading, set_users_loading] = useState(true);
  const [users_error, set_users_error] = useState<string | null>(null);
  const [users_total, set_users_total] = useState(0);
  const [user_search, set_user_search] = useState("");
  const [user_role_filter, set_user_role_filter] = useState<string>("");
  const [role_action_loading_id, set_role_action_loading_id] = useState<
    string | null
  >(null);
  const [delete_user_loading_id, set_delete_user_loading_id] = useState<
    string | null
  >(null);
  const [action_message, set_action_message] = useState<string | null>(null);

  const fetch_users = useCallback(async () => {
    set_users_loading(true);
    set_users_error(null);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      if (user_role_filter) params.set("role", user_role_filter);
      if (user_search.trim()) params.set("search", user_search.trim());
      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      set_users(data.users);
      set_users_total(data.pagination.total);
    } catch {
      set_users_error(props.error_loading_users);
    } finally {
      set_users_loading(false);
    }
  }, [props.error_loading_users, user_role_filter, user_search]);

  useEffect(() => {
    fetch_users();
  }, [fetch_users]);

  async function handle_role_change(user_id: string, new_role: string) {
    set_role_action_loading_id(user_id);
    set_action_message(null);
    try {
      const response = await fetch(`/api/users/${user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: new_role }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }
      await fetch_users();
      set_action_message(props.role_update_success);
    } catch {
      set_action_message(props.role_update_error);
    } finally {
      set_role_action_loading_id(null);
    }
  }

  async function handle_delete_user(user_id: string) {
    const confirmed = window.confirm(props.delete_user_confirm);
    if (!confirmed) return;
    set_delete_user_loading_id(user_id);
    set_action_message(null);
    try {
      const response = await fetch(`/api/users/${user_id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }
      await fetch_users();
      set_action_message(props.delete_user_success);
    } catch {
      set_action_message(props.delete_user_error);
    } finally {
      set_delete_user_loading_id(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {action_message && (
        <div
          className="card p-3 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {action_message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Users size={20} style={{ color: "var(--color-primary)" }} />
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {props.total_users}
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {users_total}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {props.user_management}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder={props.search_users}
            value={user_search}
            onChange={(e) => set_user_search(e.target.value)}
            className="input flex-1"
          />
          <Select
            value={user_role_filter}
            onChange={(e) => set_user_role_filter(e.target.value)}
            className="select"
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="">{props.filter_all_roles}</option>
            <option value="USER">{props.role_user}</option>
            <option value="PROVIDER">{props.role_provider}</option>
            <option value="ADMIN">{props.role_admin}</option>
          </Select>
        </div>
        {users_loading && (
          <div
            className="text-sm py-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {props.loading_users}
          </div>
        )}
        {users_error && (
          <div className="flex items-center justify-between gap-3 py-4">
            <p
              className="text-sm"
              style={{ color: "var(--color-danger)" }}
            >
              {users_error}
            </p>
            <Button onClick={fetch_users} variant="outline" size="sm">
              {props.retry}
            </Button>
          </div>
        )}
        {!users_loading && !users_error && (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-120"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.email}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.role}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.created}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    RSVPs
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Age / County
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-4 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text)" }}
                    >
                      {u.email}
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        value={u.role}
                        onChange={(e) =>
                          handle_role_change(u.id, e.target.value)
                        }
                        disabled={role_action_loading_id === u.id}
                        className="select text-sm"
                        style={{ width: "auto", minWidth: 100 }}
                      >
                        <option value="USER">{props.role_user}</option>
                        <option value="PROVIDER">{props.role_provider}</option>
                        <option value="ADMIN">{props.role_admin}</option>
                      </Select>
                    </td>
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {format_date(u.created_at, locale)}
                    </td>
                    <td
                      className="px-4 py-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {u._count.rsvps}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {u.demographics &&
                      (u.demographics.age != null ||
                        u.demographics.county)
                        ? [
                            u.demographics.age != null
                              ? `Age ${u.demographics.age}`
                              : "",
                            u.demographics.county ?? "",
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handle_delete_user(u.id)}
                        disabled={delete_user_loading_id === u.id}
                        className="btn btn-danger text-sm"
                      >
                        {delete_user_loading_id === u.id
                          ? props.deleting
                          : props.delete_user}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
