"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, Printer, QrCode } from "lucide-react";
import { Link } from "@/i18n/routing";
import { format_date_parts } from "@/lib/utils";

type QrSheetClientProps = {
    svg: string;
    url: string;
    title: string;
    title_alt: string;
    location_name: string;
    start_time: string;
    end_time: string;
    is_approved: boolean;
};

export function QrSheetClient(props: QrSheetClientProps) {
    const t = useTranslations("CheckIn");
    const locale = useLocale();

    const title = locale === "es" ? props.title_alt : props.title;
    const title_alt = locale === "es" ? props.title : props.title_alt;
    const start = format_date_parts(props.start_time, locale);
    const end = format_date_parts(props.end_time, locale);

    return (
        <div className="max-w-2xl mx-auto py-6">
            {/* Screen-only chrome */}
            <div className="print-hide">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <Link
                        href={`/events`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium no-underline"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <ArrowLeft size={15} />
                        {locale === "es" ? "Volver" : "Back"}
                    </Link>
                    <button type="button" onClick={() => window.print()} className="btn btn-primary">
                        <Printer size={15} />
                        {t("print")}
                    </button>
                </div>

                <div
                    className="flex items-start gap-3 p-3 mb-5 rounded-lg text-sm"
                    style={{ backgroundColor: "rgba(59,130,246,0.12)", borderLeft: "4px solid var(--color-primary)" }}
                >
                    <QrCode size={16} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ color: "var(--color-text)" }}>{t("qr_hint")}</p>
                </div>

                {!props.is_approved && (
                    <div
                        className="flex items-start gap-3 p-3 mb-5 rounded-lg text-sm"
                        style={{ backgroundColor: "rgba(212,168,83,0.15)", borderLeft: "4px solid var(--color-warning)" }}
                    >
                        <AlertTriangle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                        <p style={{ color: "var(--color-text)" }}>{t("not_approved_warning")}</p>
                    </div>
                )}
            </div>

            {/* Printable sheet */}
            <div
                id="checkin-sheet"
                className="card card-no-hover p-4 sm:p-8 text-center"
                style={{ background: "#ffffff" }}
            >
                <p
                    className="text-sm sm:text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "#555555" }}
                >
                    {t("scan_to_check_in")}
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "#111111" }}>
                    {title}
                </h1>
                {title_alt && title_alt !== title && (
                    <p className="text-base sm:text-sm italic mt-1" style={{ color: "#555555" }}>
                        {title_alt}
                    </p>
                )}

                <p className="text-base sm:text-sm mt-2" style={{ color: "#333333" }}>
                    {start.date} · {start.time} – {end.time}
                </p>
                <p className="text-base sm:text-sm" style={{ color: "#333333" }}>
                    {props.location_name}
                </p>

                {/* Inline SVG stays crisp at any size; the code scales to fill
                    the viewport on phones/tablets so it scans from across the
                    room. Error correction H handles folds, low ink and scuffs
                    on paper. */}
                <div
                    id="checkin-qr"
                    className="mx-auto mt-5 sm:mt-6"
                    style={{ width: "100%", maxWidth: 560, padding: 16, background: "#ffffff", border: "1px solid #dddddd", borderRadius: 12 }}
                    dangerouslySetInnerHTML={{ __html: props.svg }}
                />
                <style>{`
                    #checkin-qr svg { width: 100%; height: auto; display: block; }
                    @media print {
                        html, body { height: auto !important; overflow: visible !important; background: #ffffff !important; }
                        body * { visibility: hidden; }
                        #checkin-sheet, #checkin-sheet * { visibility: visible; }
                        #checkin-sheet {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            border: none !important;
                            box-shadow: none !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        #checkin-qr { width: 3.2in !important; }
                        .print-hide { display: none !important; }
                    }
                `}</style>

                <p className="text-xs mt-4 break-all" style={{ color: "#555555" }}>
                    {t("or_visit")} {props.url}
                </p>
            </div>
        </div>
    );
}
