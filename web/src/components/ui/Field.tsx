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
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--color-text-2)]"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={descId}
          aria-invalid={error ? true : undefined}
          className={[
            "min-h-[44px] px-3.5 rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
            "text-[var(--color-text)] text-sm",
            "transition-[border-color,box-shadow]",
            "placeholder:text-[var(--color-muted)]",
            error
              ? "border-[var(--color-danger)] focus-visible:outline-[var(--color-danger)]"
              : "border-[var(--color-border)] " +
                "hover:border-[var(--color-primary-600)] " +
                "focus-visible:outline-[var(--color-primary-600)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
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
