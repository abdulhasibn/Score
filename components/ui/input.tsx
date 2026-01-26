import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input Primitive
 *
 * Enforces theme contract rules from docs/ui-theme.md:
 * - Padding: px-3 py-2 (Section 4.2.2)
 * - Min height: 2.5rem (40px) (Section 4.2.2)
 * - Border radius: subtle (4-8px max) (Section 4.3)
 * - Border color: --border (Section 2.2.4)
 * - Background: transparent (inherits from parent)
 * - Focus ring: --ring (Section 2.2.5)
 *
 * Uses CSS variables from app/globals.css via Tailwind arbitrary values.
 * Error states should be handled via variant prop (future enhancement).
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[2.5rem] w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
