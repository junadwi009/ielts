import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "hero" | "stat";
}

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default:
    "bg-[var(--color-surface)] " +
    "border border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] " +
    "shadow-[var(--shadow-e2)]",
  interactive:
    "bg-[var(--color-surface)] " +
    "border border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] " +
    "shadow-[var(--shadow-e2)] cursor-pointer " +
    "transition-[transform,box-shadow] " +
    "hover:-translate-y-0.5 hover:shadow-[var(--shadow-e3)]",
  hero:
    "bg-[var(--color-primary-600)] text-white border-transparent " +
    "shadow-[var(--shadow-e3)]",
  stat:
    "bg-[var(--color-surface-2)] " +
    "border border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] " +
    "shadow-[var(--shadow-e1)]",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-[var(--radius-xl)] p-5",
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
