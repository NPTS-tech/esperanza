import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkin_url, generate_checkin_token } from "@/lib/checkin";
import { QrSheetClient } from "./qr_sheet_client";

type PageProps = { params: Promise<{ id: string }> };

// Provider-facing QR display/print sheet for an event they own. The signed
// check-in URL is built here (the token is HMAC'd server-side and never
// exposed to client code paths), then rendered as an inline SVG so it stays
// crisp on screen and in print.
export default async function CheckInQrPage({ params }: PageProps) {
    const session = await requireRole(["PROVIDER", "ADMIN"]);
    const t = await getTranslations("CheckIn");
    const { id } = await params;

    const event = await db.event.findUnique({
        where: { id },
        select: {
            id: true,
            title_en: true,
            title_es: true,
            location_name: true,
            start_time: true,
            end_time: true,
            status: true,
            provider_id: true,
        },
    });

    const is_own = event?.provider_id === session.user.id;
    if (!event || (!is_own && session.user.role !== "ADMIN")) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("not_found")}
                </p>
            </div>
        );
    }

    const token = generate_checkin_token(event.id);
    const url = checkin_url(event.id, token);

    // Error correction level H: the code survives ~30% damage — folds, coffee,
    // low-ink printouts. margin keeps the quiet zone scanners need. 
    const svg = await QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
    });

    return (
        <QrSheetClient
            svg={svg}
            url={url}
            title={event.title_en}
            title_alt={event.title_es}
            location_name={event.location_name}
            start_time={event.start_time.toISOString()}
            end_time={event.end_time.toISOString()}
            is_approved={event.status === "APPROVED"}
        />
    );
}
