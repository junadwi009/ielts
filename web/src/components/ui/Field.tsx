import React from "react";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: string;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, help, id, className = "", ...rest }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const descId = error
      ? `${fieldId}-error`
      : help
      ? `${fieldId}-help`
      : undefined;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={descId}
          aria-invalid={error ? true : undefined}
          className={[
            "min-h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
            "text-[var(--color-text)] text-sm",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]",
            error ? "border-[var(--color-danger)]" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        {!error && help && (
          <p id={`${fieldId}-help`} className="text-xs text-[var(--color-muted)]">
            {help}
          </p>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";
