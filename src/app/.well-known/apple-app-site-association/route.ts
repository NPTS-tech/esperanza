// Apple Universal Links site association file
// App ID format: <TeamID>.<BundleID>
// Team ID is set via APPLE_TEAM_ID env var, with NPTS placeholder fallback.
export async function GET() {
    const teamId = process.env.APPLE_TEAM_ID || "XXXXXXXXXX";
    const appIdentifier = `${teamId}.tech.npts.esperanza`;

    const aasa = {
        applinks: {
            apps: [],
            details: [
                {
                    appID: appIdentifier,
                    paths: ["*"],
                    components: [
                        {
                            "/": "/*",
                            comment: "Matches all URLs on the domain",
                        },
                    ],
                },
            ],
        },
        webcredentials: {
            apps: [appIdentifier],
        },
    };

    return new Response(JSON.stringify(aasa, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
