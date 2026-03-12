type StatCardProps = {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconColor?: string;
};

export function StatCard({ label, value, icon, iconColor }: StatCardProps) {
    return (
        <div className="card p-4 md:p-5">
            <div className="flex items-center gap-3">
                <div style={{ color: iconColor ?? "var(--color-primary)" }}>
                    {icon}
                </div>
                <div>
                    <p
                        className="text-xs font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {label}
                    </p>
                    <p
                        className="text-xl font-bold"
                        style={{ color: "var(--color-text)" }}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
