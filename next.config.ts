import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    output: "standalone",
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
