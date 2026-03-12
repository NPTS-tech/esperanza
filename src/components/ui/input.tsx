import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    error?: string;
};

export function Input({ className, error, ...props }: InputProps) {
    return (
        <input
            className={cn(
                "input",
                error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
                className
            )}
            {...props}
        />
    );
}
