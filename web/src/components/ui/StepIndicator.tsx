import React from "react";

export interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  current,
}) => {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress steps">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <li key={i} className="flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold",
                done
                  ? "bg-[var(--color-primary-600)] text-white"
                  : active
                  ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] outline outline-2 outline-[var(--color-primary-600)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs ${
                active
                  ? "font-semibold text-[var(--color-text)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className="w-4 h-px bg-[var(--color-border)]" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
};
