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
};

export const metadata: Metadata = {
    title: "Esperanza",
    description: "Community services portal for the Esperanza neighborhood",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Esperanza",
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
