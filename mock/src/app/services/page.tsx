"use client";

import ServiceCard from "@/components/service_card";
import { mock_services } from "@/lib/mock_data";
import { useState } from "react";

export default function ServicesPage() {
    const categories = Array.from(new Set(mock_services.map((s) => s.category)));
    const [filter, set_filter] = useState("All");

    const filtered = filter === "All"
        ? mock_services
        : mock_services.filter((s) => s.category === filter);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Services</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Resources and programs available to Esperanza residents
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => set_filter("All")}
                    className={`badge cursor-pointer ${filter === "All" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => set_filter(cat)}
                        className={`badge cursor-pointer ${filter === cat ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </div>
    );
}
