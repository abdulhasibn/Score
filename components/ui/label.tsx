import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

/**
 * Label Primitive
 *
 * Enforces theme contract rules from docs/ui-theme.md:
 * - Font weight: 500 (Section 3.3)
 * - Text size: text-sm or text-base (Section 5.2.1)
 * - Spacing: mb-2 (0.5rem) between label and input (Section 4.2.2, 5.2.1)
 * - Position: Above input (Section 5.2.1)
 *
 * Uses CSS variables from app/globals.css via Tailwind arbitrary values.
 * Label spacing is handled by consumers via mb-2 utility.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-[hsl(var(--foreground))] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
