"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useLocale } from "next-intl";
import { format_date_parts } from "@/lib/utils";

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
  create_user: string;
  create_user_title: string;
  username_label: string;
  email_label: string;
  password_label: string;
  role_label: string;
  language_label: string;
  create: string;
  creating: string;
  cancel: string;
  create_user_success: string;
  create_user_error: string;
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

  const [create_modal_open, set_create_modal_open] = useState(false);
  const [create_username, set_create_username] = useState("");
  const [create_email, set_create_email] = useState("");
  const [create_password, set_create_password] = useState("");
  const [create_role, set_create_role] = useState<"USER" | "PROVIDER">(
    "PROVIDER",
  );
  const [create_language, set_create_language] = useState<"en" | "es">("en");
  const [creating, set_creating] = useState(false);
  const [create_error, set_create_error] = useState<string | null>(null);

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

  function reset_create_form() {
    set_create_username("");
    set_create_email("");
    set_create_password("");
    set_create_role("PROVIDER");
    set_create_language("en");
    set_create_error(null);
  }

  async function handle_create_user() {
    set_creating(true);
    set_create_error(null);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: create_username.trim(),
          email: create_email.trim(),
          password: create_password,
          role: create_role,
          language_pref: create_language,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        const details = data.details
          ? Object.values(data.details as Record<string, string[]>)
              .flat()
              .join(" ")
          : "";
        throw new Error(
          [data.error, details].filter(Boolean).join(": ") ||
            "Failed to create user",
        );
      }
      set_create_modal_open(false);
      reset_create_form();
      await fetch_users();
      set_action_message(props.create_user_success);
    } catch (e) {
      set_create_error(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : props.create_user_error,
      );
    } finally {
      set_creating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {action_message && (
        <div
          className="card p-3 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {action_message}
        </div>
      )}

      <Modal
        open={create_modal_open}
        onClose={() => {
          set_create_modal_open(false);
          reset_create_form();
        }}
        title={props.create_user_title}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handle_create_user();
          }}
        >
          <div>
            <label
              htmlFor="create-user-username"
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.username_label}
            </label>
            <Input
              id="create-user-username"
              type="text"
              value={create_username}
              onChange={(e) => set_create_username(e.target.value)}
              maxLength={50}
              required
              className="input"
            />
          </div>
          <div>
            <label
              htmlFor="create-user-email"
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.email_label}
            </label>
            <Input
              id="create-user-email"
              type="email"
              value={create_email}
              onChange={(e) => set_create_email(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label
              htmlFor="create-user-password"
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.password_label}
            </label>
            <Input
              id="create-user-password"
              type="text"
              value={create_password}
              onChange={(e) => set_create_password(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="off"
              required
              className="input"
            />
          </div>
          <div>
            <label
              htmlFor="create-user-role"
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.role_label}
            </label>
            <Select
              id="create-user-role"
              value={create_role}
              onChange={(e) =>
                set_create_role(e.target.value as "USER" | "PROVIDER")
              }
              className="select"
            >
              <option value="PROVIDER">{props.role_provider}</option>
              <option value="USER">{props.role_user}</option>
            </Select>
          </div>
          <div>
            <label
              htmlFor="create-user-language"
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.language_label}
            </label>
            <Select
              id="create-user-language"
              value={create_language}
              onChange={(e) => set_create_language(e.target.value as "en" | "es")}
              className="select"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </Select>
          </div>
          {create_error && (
            <p
              className="text-sm"
              style={{ color: "var(--color-danger)" }}
            >
              {create_error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                set_create_modal_open(false);
                reset_create_form();
              }}
            >
              {props.cancel}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? props.creating : props.create}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
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
          <Button onClick={() => set_create_modal_open(true)}>
            <UserPlus size={16} aria-hidden="true" />
            {props.create_user}
          </Button>
        </div>
      </div>

      <div className="card p-4 md:p-6 pb-0 md:pb-0 overflow-hidden">
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
                    className="text-left text-xs font-semibold px-3 py-2 sticky left-0 z-[1] bg-[var(--color-surface)]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.email}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.role}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.created}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    RSVPs
                  </th>
                  <th
                    className="hidden @3xl:table-cell text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Age / County
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
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
                      className="px-3 py-2 text-sm sticky left-0 z-[1] bg-[var(--color-surface)] max-w-[240px] truncate"
                      style={{ color: "var(--color-text)" }}
                    >
                      {u.email}
                    </td>
                    <td className="px-3 py-2">
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
                      className="px-3 py-2 text-sm whitespace-nowrap"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {format_date_parts(u.created_at, locale).date}
                    </td>
                    <td
                      className="px-3 py-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {u._count.rsvps}
                    </td>
                    <td
                      className="hidden @3xl:table-cell px-3 py-2 text-xs whitespace-nowrap"
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
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handle_delete_user(u.id)}
                        disabled={delete_user_loading_id === u.id}
                        className="btn btn-danger text-sm whitespace-nowrap"
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
