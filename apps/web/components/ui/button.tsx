import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-700",
  secondary:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 focus-visible:outline-blue-700",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-base font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
