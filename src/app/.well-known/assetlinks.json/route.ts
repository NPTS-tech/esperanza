// Android App Links statement list
// Once production signing certificate SHA-256 is generated in #20, add it here.
export async function GET() {
    const certFingerprints = (
        process.env.ANDROID_SHA256_CERT_FINGERPRINTS ||
        "14:6D:E9:7F:0F:52:EA:CB:5B:40:99:B2:44:44:2A:B2:D6:14:4E:57:3E:C5:5D:F3:AE:19:47:B2:67:84:E0:41"
    )
        .split(",")
        .map((fp) => fp.trim())
        .filter(Boolean);

    const assetlinks = [
        {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
                namespace: "android_app",
                package_name: "tech.npts.esperanza",
                sha256_cert_fingerprints: certFingerprints,
            },
        },
    ];

    return new Response(JSON.stringify(assetlinks, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
