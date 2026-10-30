"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clear_categories_cache } from "@/lib/event_categories";
import { DEFAULT_EVENT_CATEGORY } from "@/lib/constants";

export type AdminCategoriesDashboardProps = {
  title: string;
  subtitle: string;
  total_categories: string;
  create_category: string;
  name_en_label: string;
  name_es_label: string;
  emoji_label: string;
  color_label: string;
  slug_label: string;
  slug_hint: string;
  creating: string;
  create: string;
  create_success: string;
  create_error: string;
  delete_category: string;
  delete_category_confirm: string;
  delete_category_success: string;
  delete_category_error: string;
  deleting: string;
  loading_categories: string;
  error_loading_categories: string;
  retry: string;
  events_count: string;
  default_category_hint: string;
  actions: string;
};

type ApiCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  color: string;
  emoji: string;
  _count: { events: number };
};

const DEFAULT_COLOR = "#6366f1";

// CSS hover tooltip; native `title` tooltips wait ~1s before appearing.
function HintTooltip(props: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info
        size={12}
        aria-label={props.text}
        style={{ color: "var(--color-text-secondary)", cursor: "help" }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 w-max max-w-56 -translate-x-1/2 rounded-md border px-2 py-1 text-xs opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          borderColor: "var(--color-border)",
        }}
      >
        {props.text}
      </span>
    </span>
  );
}

export function AdminCategoriesDashboard(props: AdminCategoriesDashboardProps) {
  const [categories, set_categories] = useState<ApiCategory[]>([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const [action_message, set_action_message] = useState<string | null>(null);

  const [name_en, set_name_en] = useState("");
  const [name_es, set_name_es] = useState("");
  const [emoji, set_emoji] = useState("");
  const [color, set_color] = useState(DEFAULT_COLOR);
  const [creating, set_creating] = useState(false);
  const [delete_loading_id, set_delete_loading_id] = useState<string | null>(
    null,
  );

  const fetch_categories = useCallback(async () => {
    set_loading(true);
    set_error(null);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = (await res.json()) as { categories: ApiCategory[] };
      set_categories(data.categories);
    } catch {
      set_error(props.error_loading_categories);
    } finally {
      set_loading(false);
    }
  }, [props.error_loading_categories]);

  useEffect(() => {
    fetch_categories();
  }, [fetch_categories]);

  function reset_form() {
    set_name_en("");
    set_name_es("");
    set_emoji("");
    set_color(DEFAULT_COLOR);
  }

  async function handle_create() {
    if (!name_en.trim() || !name_es.trim() || !emoji.trim()) return;
    set_creating(true);
    set_action_message(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_en: name_en.trim(),
          name_es: name_es.trim(),
          emoji: emoji.trim(),
          color,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }
      reset_form();
      await fetch_categories();
      clear_categories_cache();
      set_action_message(props.create_success);
    } catch {
      set_action_message(props.create_error);
    } finally {
      set_creating(false);
    }
  }

  async function handle_delete(category_id: string) {
    const confirmed = window.confirm(props.delete_category_confirm);
    if (!confirmed) return;
    set_delete_loading_id(category_id);
    set_action_message(null);
    try {
      const res = await fetch(`/api/categories/${category_id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }
      await fetch_categories();
      clear_categories_cache();
      set_action_message(props.delete_category_success);
    } catch {
      set_action_message(props.delete_category_error);
    } finally {
      set_delete_loading_id(null);
    }
  }

  const can_submit = name_en.trim() && name_es.trim() && emoji.trim();

  return (
    <div className="space-y-6">
      {action_message && (
        <div
          className="card p-3 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {action_message}
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Tags size={20} style={{ color: "var(--color-primary)" }} />
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.total_categories}
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {categories.length}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {props.create_category}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.emoji_label}
            </label>
            <Input
              type="text"
              value={emoji}
              onChange={(e) => set_emoji(e.target.value)}
              maxLength={8}
              className="input"
              placeholder="🎉"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.name_en_label}
            </label>
            <Input
              type="text"
              value={name_en}
              onChange={(e) => set_name_en(e.target.value)}
              maxLength={100}
              className="input"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.name_es_label}
            </label>
            <Input
              type="text"
              value={name_es}
              onChange={(e) => set_name_es(e.target.value)}
              maxLength={100}
              className="input"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.color_label}
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => set_color(e.target.value)}
              className="input h-[38px] w-full p-1 cursor-pointer"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handle_create} disabled={!can_submit || creating}>
            {creating ? props.creating : props.create}
          </Button>
          {name_en.trim() && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {props.slug_label}
              <HintTooltip text={props.slug_hint} />{" "}
              <code className="font-mono">
                {name_en
                  .toLowerCase()
                  .normalize("NFKD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_+|_+$/g, "")}
              </code>
            </span>
          )}
        </div>
      </div>

      <div className="card p-4 md:p-6 overflow-hidden">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {props.title}
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {props.subtitle}
        </p>
        {loading && (
          <div
            className="text-sm py-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {props.loading_categories}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
            <Button onClick={fetch_categories} variant="outline" size="sm">
              {props.retry}
            </Button>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-120"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.title}
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {props.slug_label}
                      <HintTooltip text={props.slug_hint} />
                    </span>
                  </th>
                  <th
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {props.events_count}
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
                {categories.map((c) => {
                  const is_default = c.slug === DEFAULT_EVENT_CATEGORY.slug;
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex size-8 items-center justify-center rounded-lg text-base"
                            style={{ backgroundColor: `${c.color}22` }}
                          >
                            {c.emoji}
                          </span>
                          <div className="flex flex-col">
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--color-text)" }}
                            >
                              {c.name_en}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {c.name_es}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-3 py-2 text-sm font-mono"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {c.slug}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {c._count.events}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handle_delete(c.id)}
                          disabled={delete_loading_id === c.id || is_default}
                          title={is_default ? props.default_category_hint : undefined}
                        >
                          {delete_loading_id === c.id
                            ? props.deleting
                            : props.delete_category}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
