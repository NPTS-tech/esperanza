import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    output: "standalone",
    // Keep the libsql native driver external so standalone output tracing ships
    // its prebuilt binary instead of trying to bundle it.
    serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                    { key: "Pragma", value: "no-cache" },
                    { key: "Expires", value: "0" },
                ],
            },
        ];
    },
};

export default withNextIntl(nextConfig);
