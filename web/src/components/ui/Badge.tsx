import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral:
    "bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)]",
  success:
    "bg-[color-mix(in_srgb,var(--color-success)_15%,white)] text-[var(--color-success)] " +
    "border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_15%,white)] text-[var(--color-warning)] " +
    "border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  danger:
    "bg-[color-mix(in_srgb,var(--color-danger)_15%,white)] text-[var(--color-danger)] " +
    "border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]",
  info:
    "bg-[color-mix(in_srgb,var(--color-info)_15%,white)] text-[var(--color-info)] " +
    "border border-[color-mix(in_srgb,var(--color-info)_30%,transparent)]",
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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
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
