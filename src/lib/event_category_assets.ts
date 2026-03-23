/**
 * Single source of truth for event category display: color and emoji used in
 * map markers, event cards, and detail hero placeholders.
 */
export const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
    Health: { color: "#ef4444", emoji: "🏥" },
    Employment: { color: "#3b82f6", emoji: "💼" },
    Financial: { color: "#22c55e", emoji: "💰" },
    Recreation: { color: "#f97316", emoji: "⚽" },
    Transit: { color: "#8b5cf6", emoji: "🚌" },
    "Senior Services": { color: "#06b6d4", emoji: "🤝" },
    Education: { color: "#eab308", emoji: "📚" },
    Community: { color: "#6366f1", emoji: "🏘️" },
    Other: { color: "#6b7280", emoji: "📌" },
};

const DEFAULT = CATEGORY_CONFIG["Other"]!;

export function getCategoryPlaceholderStyle(category: string): { color: string; emoji: string } {
    return CATEGORY_CONFIG[category] ?? DEFAULT;
}
