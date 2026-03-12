import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string;
};

export function Textarea({ className, error, ...props }: TextareaProps) {
    return (
        <textarea
            className={cn(
                "input min-h-[100px] resize-y",
                error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
                className
            )}
            {...props}
        />
    );
}
