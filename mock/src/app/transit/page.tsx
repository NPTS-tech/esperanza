export default function TransitPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Transit & Navigation</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Plan your trip to events and services using DART
                </p>
            </div>

            {/* DART Trip Planner embed placeholder */}
            <div className="card overflow-hidden mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 text-center">
                    <div className="text-5xl mb-4">🚌</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">DART Trip Planner</h2>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        The DART trip planner iframe will be embedded here in Phase 2.
                        For now, use the link below to plan your trip.
                    </p>
                    <a
                        href="https://www.dart.org/trip/trip-planner/trip-planner-map"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary no-underline"
                    >
                        Open DART Trip Planner →
                    </a>
                </div>
            </div>

            {/* route info */}
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Nearby DART Routes</h2>
            <div className="space-y-3">
                {[
                    {
                        route: "466",
                        name: "Ledbetter Station ↔ Esperanza",
                        frequency: "Every 30 minutes",
                        hours: "5:30 AM – 10:30 PM",
                    },
                    {
                        route: "444",
                        name: "Downtown Dallas ↔ Esperanza",
                        frequency: "Every 45 minutes",
                        hours: "6:00 AM – 9:00 PM",
                    },
                ].map((bus) => (
                    <div key={bus.route} className="card p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                            {bus.route}
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">{bus.name}</p>
                            <p className="text-sm text-slate-500">{bus.frequency} · {bus.hours}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* reduced fare info */}
            <div className="mt-8 card p-6 bg-emerald-50 border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-2">💳 Reduced Fare Programs</h3>
                <p className="text-sm text-emerald-700 mb-2">
                    Seniors (65+), students, and individuals with disabilities may qualify for reduced DART fares.
                    Visit the Community Center front desk for help applying.
                </p>
                <p className="text-xs text-emerald-600">
                    DART Customer Service: (214) 979-1111
                </p>
            </div>
        </div>
    );
}
