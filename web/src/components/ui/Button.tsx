import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] border-transparent",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
  ghost:
    "bg-transparent text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)]",
  destructive:
    "bg-[var(--color-danger)] text-white border-transparent hover:opacity-90",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-11 px-3 text-sm gap-1.5",
  md: "min-h-11 px-4 text-sm gap-2",
  lg: "min-h-11 px-6 text-base gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={[
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading && (
          <Loader2
            size={16}
            className="animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
