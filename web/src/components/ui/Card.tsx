import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "hero" | "stat";
}

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm",
  interactive:
    "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-transform",
  hero: "bg-[var(--color-primary-600)] text-white border-transparent shadow-md",
  stat: "bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-[var(--radius-lg)] p-4",
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
