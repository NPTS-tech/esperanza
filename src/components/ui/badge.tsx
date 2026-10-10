import { cn } from "@/lib/utils";

export type BadgeVariant =
    | "health"
    | "employment"
    | "education"
    | "recreation"
    | "transit"
    | "senior"
    | "financial"
    | "children"
    | "housing"
    | "other"
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
    financial: "badge-financial",
    children: "badge-children",
    housing: "badge-housing",
    other: "badge-other",
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

export function get_category_badge_variant(category: { slug: string }): BadgeVariant {
    switch (category.slug) {
        case "health":
        case "employment":
        case "education":
        case "recreation":
        case "transit":
        case "financial":
        case "children":
        case "housing":
            return category.slug;
        case "senior_services":
            return "senior";
        default:
            return "other";
    }
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
