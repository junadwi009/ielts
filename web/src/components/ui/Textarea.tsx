import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  wordCount?: number;
  targetWords?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, wordCount, targetWords, id, className = "", ...rest }, ref) => {
    const fieldId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const descId = error ? `${fieldId}-error` : undefined;
    const isOver = wordCount !== undefined && targetWords !== undefined && wordCount > targetWords;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          aria-describedby={descId}
          aria-invalid={error ? true : undefined}
          className={[
            "px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
            "text-[var(--color-text)] text-sm min-h-[120px] resize-y",
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
        {wordCount !== undefined && (
          <p
            className={`text-xs ${isOver ? "text-[var(--color-warning)]" : "text-[var(--color-muted)]"}`}
          >
            {wordCount}
            {targetWords !== undefined ? `/${targetWords}` : ""} words
            {isOver && " (over target)"}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
