import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  success: "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
  warning: "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
  danger: "bg-[color-mix(in_srgb,var(--color-danger)_15%,transparent)] text-[var(--color-danger)]",
  info: "bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] text-[var(--color-info)]",
};

export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  className = "",
  children,
  ...rest
}) => {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
};
