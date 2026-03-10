import { Service } from "@/lib/mock_data";

interface ServiceCardProps {
    service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
    return (
        <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
                <span className={`badge badge-${service.category.toLowerCase()}`}>
                    {service.category}
                </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {service.name_en}
            </h3>

            <p className="text-sm text-slate-500 mb-4">
                {service.description_en}
            </p>

            <div className="flex flex-col gap-1.5 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{service.location}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{service.hours}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{service.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span className="text-slate-500">Eligibility: {service.eligibility}</span>
                </div>
            </div>
        </div>
    );
}
