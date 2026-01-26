import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea Primitive
 *
 * Enforces theme contract rules from docs/ui-theme.md:
 * - Padding: px-3 py-2 (Section 4.2.2 - same as Input)
 * - Min height: 2.5rem (40px) (Section 4.2.2)
 * - Border radius: subtle (4-8px max) (Section 4.3)
 * - Border color: --border (Section 2.2.4)
 * - Focus ring: --ring (Section 2.2.5)
 *
 * Uses CSS variables from app/globals.css via Tailwind arbitrary values.
 * Resizable by default; consumers can disable via resize-none if needed.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[2.5rem] w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
