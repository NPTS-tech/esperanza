"use client";

import { useState } from "react";
import { Badge, get_role_badge_variant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ToastContainer, useToast } from "@/components/ui/toast";

type ProfileClientProps = {
    email: string;
    role: string;
    language_pref: string;
    label_email: string;
    label_role: string;
    label_language: string;
    label_lang_en: string;
    label_lang_es: string;
    label_change_password: string;
    label_current_password: string;
    label_new_password: string;
    label_confirm_password: string;
    label_save: string;
    label_cancel: string;
    msg_password_updated: string;
    msg_password_error: string;
};

export function ProfileClient({
    email,
    role,
    language_pref,
    label_email,
    label_role,
    label_language,
    label_lang_en,
    label_lang_es,
    label_change_password,
    label_current_password,
    label_new_password,
    label_confirm_password,
    label_save,
    label_cancel,
    msg_password_updated,
    msg_password_error,
}: ProfileClientProps) {
    const [modal_open, set_modal_open] = useState(false);
    const [pw_form, set_pw_form] = useState({ current: "", new_pw: "", confirm: "" });
    const [loading, set_loading] = useState(false);
    const { toasts, show_toast, dismiss } = useToast();

    const initials = email ? email[0].toUpperCase() : "?";

    async function handle_change_password(e: React.FormEvent) {
        e.preventDefault();
        if (pw_form.new_pw !== pw_form.confirm) return;
        set_loading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: pw_form.current,
                    new_password: pw_form.new_pw,
                }),
            });
            if (res.ok) {
                show_toast(msg_password_updated, "success");
                set_modal_open(false);
                set_pw_form({ current: "", new_pw: "", confirm: "" });
            } else {
                show_toast(msg_password_error, "error");
            }
        } catch {
            show_toast(msg_password_error, "error");
        } finally {
            set_loading(false);
        }
    }

    return (
        <div className="space-y-4">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Profile card */}
            <div className="card p-6">
                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                        style={{ background: "var(--color-primary)" }}
                    >
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold text-lg" style={{ color: "var(--color-text)" }}>
                            {email}
                        </p>
                        <Badge variant={get_role_badge_variant(role)} className="mt-1">
                            {role}
                        </Badge>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>
                            {label_email}
                        </p>
                        <p style={{ color: "var(--color-text)" }}>{email}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>
                            {label_role}
                        </p>
                        <p style={{ color: "var(--color-text)" }}>{role}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>
                            {label_language}
                        </p>
                        <p style={{ color: "var(--color-text)" }}>
                            {language_pref === "es" ? label_lang_es : label_lang_en}
                        </p>
                    </div>
                </div>

                {/* Change password button */}
                <button
                    onClick={() => set_modal_open(true)}
                    className="btn btn-secondary mt-6"
                >
                    {label_change_password}
                </button>
            </div>

            {/* Change password modal */}
            <Modal
                open={modal_open}
                onClose={() => set_modal_open(false)}
                title={label_change_password}
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => set_modal_open(false)}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            {label_cancel}
                        </button>
                        <button
                            form="pw-form"
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "…" : label_save}
                        </button>
                    </>
                }
            >
                <form
                    id="pw-form"
                    onSubmit={handle_change_password}
                    className="space-y-4"
                >
                    <FormField label={label_current_password} required>
                        <Input
                            type="password"
                            value={pw_form.current}
                            onChange={(e) => set_pw_form((p) => ({ ...p, current: e.target.value }))}
                            required
                            autoComplete="current-password"
                        />
                    </FormField>
                    <FormField label={label_new_password} required hint="At least 8 characters">
                        <Input
                            type="password"
                            value={pw_form.new_pw}
                            onChange={(e) => set_pw_form((p) => ({ ...p, new_pw: e.target.value }))}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </FormField>
                    <FormField
                        label={label_confirm_password}
                        required
                        error={
                            pw_form.confirm && pw_form.confirm !== pw_form.new_pw
                                ? "Passwords do not match"
                                : undefined
                        }
                    >
                        <Input
                            type="password"
                            value={pw_form.confirm}
                            onChange={(e) => set_pw_form((p) => ({ ...p, confirm: e.target.value }))}
                            required
                            autoComplete="new-password"
                        />
                    </FormField>
                </form>
            </Modal>
        </div>
    );
}
