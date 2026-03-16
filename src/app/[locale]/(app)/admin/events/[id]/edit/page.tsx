"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import EventForm from "@/components/event_form";
import type { EventData } from "@/components/event_card";

export default function AdminEditEventPage() {
  const t = useTranslations("Events");
  const { data: session, status: session_status } = useSession();
  const router = useRouter();
  const params = useParams();
  const event_id = params.id as string;

  const [event, set_event] = useState<EventData | null>(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);

  const fetch_event = useCallback(async () => {
    set_loading(true);
    set_error(null);
    try {
      const res = await fetch(`/api/events/${event_id}`);
      if (res.status === 404) {
        set_error(t("error_not_found"));
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data: EventData = await res.json();
      set_event(data);
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_loading(false);
    }
  }, [event_id, t]);

  useEffect(() => {
    fetch_event();
  }, [fetch_event]);

  const is_admin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (session_status === "authenticated" && !is_admin) {
      router.push("/admin");
    }
  }, [session_status, is_admin, router]);

  async function handle_update(
    data: Record<string, unknown>,
  ): Promise<{ id?: string; error?: string; field_errors?: Record<string, string[]> }> {
    const res = await fetch(`/api/events/${event_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: json.error || t("error_loading"),
        field_errors: json.details as Record<string, string[]> | undefined,
      };
    }

    return { id: json.id as string | undefined };
  }

  async function handle_delete() {
    const res = await fetch(`/api/events/${event_id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Delete failed");
    }
    router.push("/admin");
  }

  if (loading || session_status === "loading") {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-8 text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p className="text-lg">{t("loading")}</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          {error || t("error_not_found")}
        </h2>
        <Link
          href="/admin"
          className="text-sm mt-2 inline-block"
          style={{ color: "var(--color-primary)" }}
        >
          ← Admin
        </Link>
      </div>
    );
  }

  if (!is_admin) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-8 text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p>{t("forbidden")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="text-sm mb-4 inline-block no-underline"
        style={{ color: "var(--color-primary)" }}
      >
        ← Admin
      </Link>

      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--color-text)" }}
      >
        {t("edit_event")}
      </h1>

      <div className="card p-6">
        <EventForm
          mode="edit"
          initial_data={event}
          on_submit={handle_update}
          on_delete={handle_delete}
          on_submit_redirect="/admin"
          on_delete_redirect="/admin"
        />
      </div>
    </div>
  );
}
