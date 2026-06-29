import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs text-[var(--color-muted)]">{label}</span>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary-600)] transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
