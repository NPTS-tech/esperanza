import { cn } from "@/lib/utils";

export type BadgeVariant =
    | "health"
    | "employment"
    | "education"
    | "recreation"
    | "transit"
    | "senior"
    | "childcare"
    | "community"
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "admin"
    | "provider"
    | "user";

type BadgeProps = {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
    health: "badge-health",
    employment: "badge-employment",
    education: "badge-education",
    recreation: "badge-recreation",
    transit: "badge-transit",
    senior: "badge-senior",
    childcare: "badge-childcare",
    community: "badge-community",
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-rejected",
    cancelled: "badge-rejected",
    admin: "badge-approved",
    provider: "badge-health",
    user: "badge-pending",
};

export function Badge({ variant, children, className }: BadgeProps) {
    return (
        <span className={cn("badge", VARIANT_CLASS[variant], className)}>
            {children}
        </span>
    );
}

export function get_category_badge_variant(category: string): BadgeVariant {
    const slug = category.toLowerCase().replace(/\s+/g, "-") as BadgeVariant;
    const known: BadgeVariant[] = [
        "health", "employment", "education", "recreation",
        "transit", "senior", "childcare", "community",
    ];
    return known.includes(slug) ? slug : "community";
}

export function get_status_badge_variant(status: string): BadgeVariant {
    const s = status.toLowerCase() as BadgeVariant;
    const known: BadgeVariant[] = ["pending", "approved", "rejected", "cancelled"];
    return known.includes(s) ? s : "pending";
}

export function get_role_badge_variant(role: string): BadgeVariant {
    if (role === "ADMIN") return "admin";
    if (role === "PROVIDER") return "provider";
    return "user";
}
