import Link from "next/link";

const RESOURCES = [
    {
        title: "Walking Trails",
        description: "Discover the walking and biking trails around the Esperanza neighborhood.",
        icon: "🥾",
        items: [
            "Esperanza Creek Trail — 0.5 mile loop",
            "Community Garden Path — 0.3 mile",
            "Park Connector Trail — 1.2 miles to Five Mile Creek",
        ],
    },
    {
        title: "Parks & Recreation",
        description: "Public parks, playgrounds, and open spaces in the area.",
        icon: "🏞️",
        items: [
            "Esperanza Park — Pavilion, playground, and picnic area",
            "Community Garden — Open plots available for residents",
            "Basketball Court — Open daily, lights until 10 PM",
        ],
    },
    {
        title: "Bus Schedules",
        description: "DART bus routes serving the Esperanza neighborhood.",
        icon: "🚌",
        items: [
            "Route 466 — Ledbetter Station ↔ Esperanza (every 30 min)",
            "Route 444 — Downtown Dallas ↔ Esperanza (every 45 min)",
            "For real-time schedules, visit the DART trip planner",
        ],
    },
    {
        title: "Community Directory",
        description: "Important contacts and nearby facilities.",
        icon: "📞",
        items: [
            "Esperanza Community Center — (214) 555-0100",
            "Dallas County Social Services — (214) 555-0200",
            "Non-emergency Police — (214) 555-0300",
            "DART Customer Service — (214) 979-1111",
        ],
    },
];

export default function ResourcesPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Helpful information about your neighborhood
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {RESOURCES.map((resource) => (
                    <div key={resource.title} className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{resource.icon}</span>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{resource.title}</h2>
                                <p className="text-sm text-slate-500">{resource.description}</p>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {resource.items.map((item, i) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-slate-300 mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-8 card p-6 bg-blue-50 border-blue-200">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">🚌 DART Trip Planner</h2>
                <p className="text-sm text-blue-700 mb-4">
                    Plan your transit trip to any event or service location using DART&apos;s trip planner.
                </p>
                <a
                    href="https://www.dart.org/trip/trip-planner/trip-planner-map"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary no-underline text-sm"
                >
                    Open DART Trip Planner →
                </a>
            </div>
        </div>
    );
}
