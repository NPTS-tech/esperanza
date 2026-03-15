"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";
import EventForm from "@/components/event_form";

export default function CreateEventPage() {
  const t = useTranslations("Events");
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = session?.user?.role;
  const can_create = role === "PROVIDER" || role === "ADMIN";

  // redirect unauthorized users once session is loaded
  useEffect(() => {
    if (status === "authenticated" && !can_create) {
      router.push("/events");
    }
  }, [status, can_create, router]);

  // wait for session before rendering
  if (status === "loading") {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-8 text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p className="text-lg">{t("loading")}</p>
      </div>
    );
  }

  if (!can_create) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-8 text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p>{t("forbidden")}</p>
      </div>
    );
  }

  async function handle_create(
    data: Record<string, unknown>,
  ): Promise<{ id?: string; error?: string }> {
    console.log("[CreateEventPage] Sending to API:", data);
    
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    console.log("[CreateEventPage] API response status:", res.status);
    
    const json = await res.json();
    console.log("[CreateEventPage] API response body:", json);

    if (!res.ok) {
      const errorMsg = json.error || json.details || t("error_loading");
      console.error("[CreateEventPage] API error:", errorMsg);
      return { error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) };
    }

    console.log("[CreateEventPage] Event created with ID:", json.id);
    return { id: json.id };
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--color-text)" }}
      >
        {t("create_event")}
      </h1>
      <div className="card p-6">
        <EventForm mode="create" on_submit={handle_create} />
      </div>
    </div>
  );
}
