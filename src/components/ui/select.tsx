import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: string;
};

export function Select({ className, error, children, ...props }: SelectProps) {
    return (
        <select
            className={cn(
                "select",
                error && "border-[var(--color-danger)]",
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}
