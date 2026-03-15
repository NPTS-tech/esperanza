"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { UploadCloud, Clock3 } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { EVENT_CATEGORIES } from "@/lib/validators/event";
import type { EventData } from "@/components/event_card";
import type { LocationValue } from "@/components/location_picker";

// mapbox-gl and @mapbox/search-js-react access browser globals at import time;
// use dynamic import with ssr:false to keep Next.js SSR happy.
const LocationPicker = dynamic(
  () => import("@/components/location_picker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-lg animate-pulse"
        style={{ height: "300px", background: "var(--color-border)" }}
      />
    ),
  },
);

interface EventFormProps {
  mode: "create" | "edit";
  initial_data?: EventData;
  on_submit: (
    data: Record<string, unknown>,
  ) => Promise<{ id?: string; error?: string }>;
  on_delete?: () => Promise<void>;
  on_submit_redirect?: string;
  on_delete_redirect?: string;
}

function to_date_input(value: string | Date | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function to_time_input(value: string | Date | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(11, 16);
}

function to_minutes(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

function from_minutes(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, total));
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mm = String(clamped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function add_minutes_to_time(time: string, minutes: number): string {
  return from_minutes(to_minutes(time) + minutes);
}

function round_up_to_next_quarter(date: Date): string {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.ceil(total / 15) * 15;
  return from_minutes(rounded);
}

function get_default_start_time(date: Date): string {
  const rounded = round_up_to_next_quarter(date);
  if (to_minutes(rounded) >= 23 * 60 + 45) {
    return "22:45";
  }
  return rounded;
}

function combine_date_and_time_to_iso(date_str: string, time_str: string): string {
  return new Date(`${date_str}T${time_str}:00`).toISOString();
}

function to_12h_label(time: string): string {
  const [hh_raw, mm] = time.split(":").map(Number);
  const am_pm = hh_raw >= 12 ? "PM" : "AM";
  const hh_12 = hh_raw % 12 === 0 ? 12 : hh_raw % 12;
  return `${hh_12}:${String(mm).padStart(2, "0")} ${am_pm}`;
}

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const total = i * 15;
  return from_minutes(total);
});

export default function EventForm({
  mode,
  initial_data,
  on_submit,
  on_delete,
  on_submit_redirect,
  on_delete_redirect,
}: EventFormProps) {
  const t = useTranslations("Events");
  const router = useRouter();
  const pathname = usePathname();
  const image_input_id = "event-image-upload";

  const is_admin_edit_context =
    mode === "edit" && pathname.includes("/admin/events/");

  const default_date = to_date_input(new Date());
  const default_start_time = get_default_start_time(new Date());
  const default_end_time = add_minutes_to_time(default_start_time, 60);

  const [form, set_form] = useState<{
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location_name: string;
    location_address: string;
    latitude: number | null;
    longitude: number | null;
    event_date: string;
    start_time: string;
    end_time: string;
    category: string;
    image_url: string;
  }>({
    title_en: initial_data?.title_en ?? "",
    title_es: initial_data?.title_es ?? "",
    description_en: initial_data?.description_en ?? "",
    description_es: initial_data?.description_es ?? "",
    location_name: initial_data?.location_name ?? "",
    location_address: initial_data?.location_address ?? "",
    latitude: initial_data?.latitude ?? null,
    longitude: initial_data?.longitude ?? null,
    event_date: to_date_input(initial_data?.start_time) || default_date,
    start_time: to_time_input(initial_data?.start_time) || default_start_time,
    end_time: to_time_input(initial_data?.end_time) || default_end_time,
    category: initial_data?.category ?? "",
    image_url: initial_data?.image_url ?? "",
  });

  const [loading, set_loading] = useState(false);
  const [deleting, set_deleting] = useState(false);
  const [uploading_image, set_uploading_image] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [field_errors, set_field_errors] = useState<Record<string, string[]>>(
    {},
  );
  const end_time_options = TIME_OPTIONS.filter(
    (time) => to_minutes(time) > to_minutes(form.start_time),
  );

  async function handle_image_file_change(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    set_uploading_image(true);
    set_error(null);

    const form_data = new FormData();
    form_data.append("file", file);

    try {
      const res = await fetch("/api/uploads/event-image", {
        method: "POST",
        body: form_data,
      });

      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : {};
      } catch {
        data = { error: raw?.startsWith("<!DOCTYPE") ? "Upload endpoint returned HTML (likely a server/config error)." : "Image upload failed" };
      }

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Image upload failed");
      }

      set_form((prev) => ({ ...prev, image_url: data.url! }));
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      set_uploading_image(false);
      // reset input so selecting the same file again re-triggers change
      e.target.value = "";
    }
  }

  function handle_change(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;

    if (name === "event_date") {
      set_form((prev) => ({ ...prev, event_date: value }));
      if (field_errors.event_date) {
        set_field_errors((prev) => {
          const next = { ...prev };
          delete next.event_date;
          return next;
        });
      }
      return;
    }

    if (name === "start_time") {
      set_form((prev) => {
        const next = { ...prev, start_time: value };
        const next_valid_end = TIME_OPTIONS.find(
          (time) => to_minutes(time) > to_minutes(value),
        );

        if (!prev.end_time || to_minutes(prev.end_time) <= to_minutes(value)) {
          next.end_time = next_valid_end ?? "";
        }

        return next;
      });

      if (field_errors.start_time || field_errors.end_time) {
        set_field_errors((prev) => {
          const next = { ...prev };
          delete next.start_time;
          delete next.end_time;
          return next;
        });
      }
      return;
    }

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

    if (!form.location_address.trim()) {
      set_field_errors({
        location_address: [t("location_address_required")],
      });
      set_loading(false);
      return;
    }

    // Require a pin to have been placed
    if (form.latitude === null || form.longitude === null) {
      set_field_errors({ location_address: [t("location_required")] });
      set_loading(false);
      return;
    }

    if (to_minutes(form.end_time) <= to_minutes(form.start_time)) {
      set_field_errors({ end_time: [t("end_time_after_start_error")] });
      set_loading(false);
      return;
    }

    const start_iso = combine_date_and_time_to_iso(form.event_date, form.start_time);
    const end_iso = combine_date_and_time_to_iso(form.event_date, form.end_time);

    // build payload
    const payload: Record<string, unknown> = {
      title_en: form.title_en,
      title_es: form.title_es,
      description_en: form.description_en,
      description_es: form.description_es,
      location_name: form.location_name,
      location_address: form.location_address,
      latitude: form.latitude,
      longitude: form.longitude,
      start_time: start_iso,
      end_time: end_iso,
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
        if (on_submit_redirect) {
          router.push(on_submit_redirect);
        } else if (is_admin_edit_context) {
          router.push("/admin");
        } else {
          router.push(`/events/${result.id}`);
        }
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
      if (on_delete_redirect) {
        router.push(on_delete_redirect);
      } else if (is_admin_edit_context) {
        router.push("/admin");
      } else {
        router.push("/events");
      }
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

      {/* Location — address autocomplete + draggable pin map */}
      <div className="space-y-3">
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
            maxLength={200}
            className="input"
            placeholder={t("form_location_name_placeholder")}
          />
        </div>

        <LocationPicker
          label={t("form_location_address")}
          drag_hint={t("location_drag_hint")}
          value={{
            location_name: form.location_name,
            location_address: form.location_address,
            latitude: form.latitude,
            longitude: form.longitude,
          }}
          onChange={
            ({ location_name, location_address, latitude, longitude }: LocationValue) =>
              set_form((prev) => ({
                ...prev,
                location_name,
                location_address: location_address ?? prev.location_address,
                latitude,
                longitude,
              }))
          }
        />
        {field_errors.location_address && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-danger)" }}
          >
            {field_errors.location_address[0]}
          </p>
        )}
      </div>

      {/* Date/Time */}
      <div className="space-y-2">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            {t("time_section_label")} *
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("time_section_hint")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text)" }}
            >
              {t("date")} *
            </label>
            <input
              type="date"
              name="event_date"
              value={form.event_date}
              onChange={handle_change}
              required
              className="input"
            />
            {field_errors.event_date && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                {field_errors.event_date[0]}
              </p>
            )}
          </div>
          <div>
            <label
              className="text-sm font-medium mb-1 flex items-center gap-1.5"
              style={{ color: "var(--color-text)" }}
            >
              <Clock3 size={14} style={{ color: "var(--color-primary)" }} />
              {t("form_start_time")} *
            </label>
            <select
              name="start_time"
              value={form.start_time}
              onChange={handle_change}
              required
              className="select"
              style={{
                borderWidth: 1.5,
                fontWeight: 600,
                background: "var(--color-surface)",
              }}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {to_12h_label(time)}
                </option>
              ))}
            </select>
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
              className="text-sm font-medium mb-1 flex items-center gap-1.5"
              style={{ color: "var(--color-text)" }}
            >
              <Clock3 size={14} style={{ color: "var(--color-primary)" }} />
              {t("form_end_time")} *
            </label>
            <select
              name="end_time"
              value={form.end_time}
              onChange={handle_change}
              required
              className="select"
              style={{
                borderWidth: 1.5,
                fontWeight: 600,
                background: "var(--color-surface)",
              }}
            >
              {end_time_options.map((time) => (
                <option key={time} value={time}>
                  {to_12h_label(time)}
                </option>
              ))}
            </select>
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

      {/* Event image upload */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          {t("form_image_url")}
        </label>

        <div className="space-y-2">
          <input
            id={image_input_id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handle_image_file_change}
            className="sr-only"
            disabled={uploading_image}
          />

          <label
            htmlFor={image_input_id}
            className="w-full rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer"
            style={{
              border: "1px dashed var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0 w-full">
              <span
                className="btn btn-secondary flex items-center gap-2"
                style={{ whiteSpace: "nowrap" }}
              >
                <UploadCloud size={14} />
                {uploading_image ? "Uploading" : "Choose file"}
              </span>

              <div className="min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  {uploading_image ? "Uploading image..." : "Upload event image"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  PNG, JPG, WEBP • Max 5MB • Landscape (16:9) recommended
                </p>
              </div>
            </div>
          </label>

          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Square and portrait images are accepted and will be center-cropped to fit a horizontal frame.
          </p>

          {form.image_url && (
            <div className="space-y-2">
              <div
                className="w-full max-w-sm rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--color-border)", aspectRatio: "16 / 9" }}
              >
                <img
                  src={form.image_url}
                  alt="Uploaded event"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
              <div className="flex gap-2">
                <a
                  href={form.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View image
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() =>
                    set_form((prev) => ({ ...prev, image_url: "" }))
                  }
                >
                  Remove image
                </button>
              </div>
            </div>
          )}
        </div>
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
