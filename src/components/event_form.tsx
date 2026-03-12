"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { EVENT_CATEGORIES } from "@/lib/validators/event";
import type { EventData } from "@/components/event_card";

interface EventFormProps {
  mode: "create" | "edit";
  initial_data?: EventData;
  on_submit: (
    data: Record<string, unknown>,
  ) => Promise<{ id?: string; error?: string }>;
  on_delete?: () => Promise<void>;
}

// convert a Date/ISO string to `datetime-local` input value (YYYY-MM-DDTHH:mm)
function to_datetime_local(value: string | Date | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  // offset to local time
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function EventForm({
  mode,
  initial_data,
  on_submit,
  on_delete,
}: EventFormProps) {
  const t = useTranslations("Events");
  const router = useRouter();

  const [form, set_form] = useState({
    title_en: initial_data?.title_en ?? "",
    title_es: initial_data?.title_es ?? "",
    description_en: initial_data?.description_en ?? "",
    description_es: initial_data?.description_es ?? "",
    location_name: initial_data?.location_name ?? "",
    latitude: initial_data?.latitude?.toString() ?? "",
    longitude: initial_data?.longitude?.toString() ?? "",
    start_time: to_datetime_local(initial_data?.start_time),
    end_time: to_datetime_local(initial_data?.end_time),
    category: initial_data?.category ?? "",
    image_url: initial_data?.image_url ?? "",
  });

  const [loading, set_loading] = useState(false);
  const [deleting, set_deleting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [field_errors, set_field_errors] = useState<Record<string, string[]>>(
    {},
  );

  function handle_change(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    set_form((prev) => ({ ...prev, [name]: value }));
    // clear field-level error on change
    if (field_errors[name]) {
      set_field_errors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handle_submit(e: React.FormEvent) {
    e.preventDefault();
    set_loading(true);
    set_error(null);
    set_field_errors({});

    // build payload
    const payload: Record<string, unknown> = {
      title_en: form.title_en,
      title_es: form.title_es,
      description_en: form.description_en,
      description_es: form.description_es,
      location_name: form.location_name,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      category: form.category,
    };

    if (form.image_url.trim()) {
      payload.image_url = form.image_url.trim();
    }

    try {
      const result = await on_submit(payload);
      if (result.error) {
        set_error(result.error);
      } else if (result.id) {
        router.push(`/events/${result.id}`);
      }
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_loading(false);
    }
  }

  async function handle_delete() {
    if (!on_delete) return;
    if (!window.confirm(t("delete_confirm"))) return;

    set_deleting(true);
    try {
      await on_delete();
      router.push("/events");
    } catch {
      set_error(t("error_loading"));
      set_deleting(false);
    }
  }

  const submit_label =
    mode === "create"
      ? loading
        ? t("creating")
        : t("create_event")
      : loading
        ? t("saving")
        : t("save_changes");

  return (
    <form onSubmit={handle_submit} className="space-y-5">
      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {/* Titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_title_en")} *
          </label>
          <input
            type="text"
            name="title_en"
            value={form.title_en}
            onChange={handle_change}
            required
            maxLength={200}
            className="input"
          />
          {field_errors.title_en && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.title_en[0]}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_title_es")} *
          </label>
          <input
            type="text"
            name="title_es"
            value={form.title_es}
            onChange={handle_change}
            required
            maxLength={200}
            className="input"
          />
          {field_errors.title_es && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.title_es[0]}
            </p>
          )}
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_description_en")} *
          </label>
          <textarea
            name="description_en"
            value={form.description_en}
            onChange={handle_change}
            required
            maxLength={5000}
            rows={4}
            className="input"
            style={{ resize: "vertical" }}
          />
          {field_errors.description_en && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.description_en[0]}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_description_es")} *
          </label>
          <textarea
            name="description_es"
            value={form.description_es}
            onChange={handle_change}
            required
            maxLength={5000}
            rows={4}
            className="input"
            style={{ resize: "vertical" }}
          />
          {field_errors.description_es && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.description_es[0]}
            </p>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          {t("form_location_name")} *
        </label>
        <input
          type="text"
          name="location_name"
          value={form.location_name}
          onChange={handle_change}
          required
          maxLength={300}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_latitude")} *
          </label>
          <input
            type="number"
            name="latitude"
            value={form.latitude}
            onChange={handle_change}
            required
            step="any"
            min="-90"
            max="90"
            className="input"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_longitude")} *
          </label>
          <input
            type="number"
            name="longitude"
            value={form.longitude}
            onChange={handle_change}
            required
            step="any"
            min="-180"
            max="180"
            className="input"
          />
        </div>
      </div>

      {/* Date/Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_start_time")} *
          </label>
          <input
            type="datetime-local"
            name="start_time"
            value={form.start_time}
            onChange={handle_change}
            required
            className="input"
          />
          {field_errors.start_time && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.start_time[0]}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {t("form_end_time")} *
          </label>
          <input
            type="datetime-local"
            name="end_time"
            value={form.end_time}
            onChange={handle_change}
            required
            className="input"
          />
          {field_errors.end_time && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {field_errors.end_time[0]}
            </p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          {t("form_category")} *
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handle_change}
          required
          className="select"
        >
          <option value="" disabled>
            {t("form_category")}
          </option>
          {EVENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`cat_${cat.toLowerCase().replace(/\s+/g, "_")}` as any)}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          {t("form_image_url")}
        </label>
        <input
          type="url"
          name="image_url"
          value={form.image_url}
          onChange={handle_change}
          className="input"
          placeholder="https://..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {submit_label}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          {t("cancel")}
        </button>
        {mode === "edit" && on_delete && (
          <button
            type="button"
            onClick={handle_delete}
            disabled={deleting}
            className="btn btn-danger ml-auto"
          >
            {deleting ? t("deleting") : t("delete_event")}
          </button>
        )}
      </div>
    </form>
  );
}
