import type { Metadata, Viewport } from "next";
import AuthSessionProvider from "@/components/session_provider";
import PWASetup from "@/components/pwa_setup";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
    themeColor: "#B7714A",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: "Esperanza",
    description: "Community services portal for the Esperanza neighborhood",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        // "black-translucent" lets the app render under the iOS status bar;
        // combined with safe-area-inset padding in CSS this gives a native feel.
        statusBarStyle: "black-translucent",
        title: "Esperanza",
        startupImage: [
            // 12 Pro Max / 13 Pro Max / 14 Plus / 15 Plus (430×932 pt @3x)
            {
                url: "/icons/icon-512.png",
                media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
            },
            // 12 / 13 / 14 / 15 (390×844 pt @3x)
            {
                url: "/icons/icon-512.png",
                media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
            },
            // SE 3rd gen / 8 (375×667 pt @2x)
            {
                url: "/icons/icon-512.png",
                media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
            },
        ],
    },
    other: {
        // Chromium-family PWA install banner — not covered by Next.js Metadata
        "mobile-web-app-capable": "yes",
    },
};

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} className={cn("font-sans", geist.variable)}>
            <body>
                <AuthSessionProvider>
                    <NextIntlClientProvider messages={messages}>
                        <PWASetup />
                        {children}
                    </NextIntlClientProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
