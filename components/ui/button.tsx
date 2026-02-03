import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button Primitive
 *
 * Enforces theme contract rules from docs/ui-theme.md:
 * - Padding: px-4 py-2 (Section 4.2.1)
 * - Min height: 2.5rem (40px) (Section 4.2.1)
 * - Icon spacing: gap-2 (Section 4.2.1)
 * - Border radius: subtle (4-8px max) (Section 4.3)
 * - Variants: primary, secondary, destructive, success, ghost, outline, link (Section 5.1)
 *
 * Uses CSS variables from app/globals.css via Tailwind arbitrary values.
 * Primitives own all styling decisions; consumers choose variants only.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-h-[2.5rem]",
  {
    variants: {
      variant: {
        primary:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow hover:bg-[hsl(var(--primary))]/90 focus-visible:ring-[hsl(var(--ring))]",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--secondary))]/80 focus-visible:ring-[hsl(var(--ring))]",
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/90 focus-visible:ring-[hsl(var(--ring))]",
        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-sm hover:bg-[hsl(var(--success))]/90 focus-visible:ring-[hsl(var(--ring))]",
        outline:
          "border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--ring))]",
        ghost:
          "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--ring))]",
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline focus-visible:ring-[hsl(var(--ring))]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "px-4 py-2",
        lg: "h-10 px-8 rounded-md",
        icon: "h-9 w-9",
      },
      layout: {
        inline: "",
        block: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      layout: "inline",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, layout, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, layout }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
