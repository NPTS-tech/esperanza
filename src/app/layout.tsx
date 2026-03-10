import type { Metadata } from "next";
import AuthSessionProvider from "@/components/session_provider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
    title: "Esperanza",
    description: "Community services portal for the Esperanza neighborhood",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <body>
                <AuthSessionProvider>
                    {children}
                </AuthSessionProvider>
            </body>
        </html>
    );
}
