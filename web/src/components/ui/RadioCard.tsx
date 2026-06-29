import React from "react";

export interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const RadioCard: React.FC<RadioCardProps> = ({
  selected,
  onSelect,
  icon,
  title,
  description,
}) => {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      className={[
        "flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border cursor-pointer transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]",
        selected
          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] outline outline-2 outline-[var(--color-primary-600)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <span className="mt-0.5 text-[var(--color-primary-600)]" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {description && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{description}</p>
        )}
      </div>
      {/* Visual indicator (not color-only: uses checkmark symbol) */}
      <span
        className={[
          "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          selected
            ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]"
            : "border-[var(--color-border)]",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {selected && (
          <span className="text-white text-[8px] leading-none">✓</span>
        )}
      </span>
    </div>
  );
};
