import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Esperanza — Community Portal",
  description: "Your neighborhood portal for events, services, and resources in the Esperanza community.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 mt-12 py-8 text-center text-sm text-slate-400">
          <p>© 2026 Esperanza Community Center · Dallas County</p>
          <p className="mt-1">Built by UTA ACM Create</p>
        </footer>
      </body>
    </html>
  );
}
