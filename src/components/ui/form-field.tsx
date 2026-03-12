type FormFieldProps = {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
};

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor={htmlFor}
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
            >
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                    {error}
                </p>
            )}
            {hint && !error && (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {hint}
                </p>
            )}
        </div>
    );
}
