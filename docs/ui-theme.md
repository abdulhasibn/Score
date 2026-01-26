# UI Theme Contract

## 1. Design Philosophy

The application theme embodies a **modern, minimalistic, subtle, and elite** aesthetic suitable for a professional SaaS product. This translates to:

- **Modern**: Clean lines, ample whitespace, contemporary typography, subtle depth through soft shadows
- **Minimalistic**: Essential elements only, no decorative flourishes, purposeful use of color and space
- **Subtle**: Low-contrast color palette, gentle transitions, restrained visual hierarchy
- **Elite/Premium**: High-quality typography, precise spacing, refined interactions, medical-grade precision
- **Calm**: Neutral tones, muted accents, no aggressive colors, predictable and trustworthy appearance

The visual language prioritizes **clarity, trust, and professionalism** over visual excitement. Every design decision serves usability and reduces cognitive load.

---

## 2. Color System

### Semantic Color Tokens

All components MUST use semantic color tokens. Raw hex codes or Tailwind color literals (e.g., `bg-blue-500`) are forbidden in component code.

#### Primary Colors

- **Primary**: Neutral slate tones (slate-600 to slate-700) for primary actions and key UI elements
  - Purpose: Main CTAs, active states, important links
  - Tone: Cool, professional, trustworthy
  - Usage: Buttons, links, selected states, focus rings

- **Secondary**: Muted gray tones (slate-400 to slate-500) for secondary actions
  - Purpose: Secondary buttons, less prominent actions
  - Tone: Subtle, non-intrusive
  - Usage: Ghost buttons, secondary CTAs, supporting elements

#### Background & Surface Colors

- **Background**: Pure white (#ffffff) for main content areas
  - Purpose: Primary content surface
  - Alternative: Very light gray (slate-50) for subtle differentiation

- **Foreground**: Dark slate (slate-900) for primary text
  - Purpose: Body text, headings, primary content
  - Tone: High contrast for readability, but not harsh black

- **Muted**: Light slate (slate-100 to slate-200) for subtle backgrounds
  - Purpose: Input backgrounds, disabled states, subtle sections
  - Tone: Barely perceptible, maintains hierarchy

#### Border & Divider Colors

- **Border**: Very light slate (slate-200) for borders and dividers
  - Purpose: Input borders, card borders, separators
  - Tone: Subtle, does not compete with content

#### Semantic Colors

- **Destructive**: Muted red (red-600 to red-700, not bright red-500)
  - Purpose: Delete actions, errors, warnings
  - Tone: Professional, not alarming
  - Usage: Destructive buttons, error states, validation errors

- **Success**: Muted green (green-600 to green-700)
  - Purpose: Success states, confirmations
  - Tone: Calm, reassuring

- **Warning**: Muted amber (amber-600 to amber-700)
  - Purpose: Warnings, cautions
  - Tone: Noticeable but not jarring

### Color Tone Philosophy

- **Base**: Neutral slate palette (cool, professional)
- **Accents**: Muted, desaturated versions of semantic colors
- **Contrast**: Sufficient for accessibility (WCAG AA minimum), but not harsh
- **Saturation**: Low to medium saturation only; avoid vibrant, saturated colors

### Implementation Rule

Components MUST reference CSS variables or Tailwind semantic classes (e.g., `bg-primary`, `text-foreground`, `border-border`). Direct color values are forbidden.

---

## 3. Typography

### Font Family

- **Primary**: System font stack for optimal performance and native feel
  - Stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - Rationale: Fast loading, familiar, professional, no external dependencies

### Typography Hierarchy

#### Headings

- **H1**: 2.25rem (36px) / font-weight: 600 / line-height: 1.2
  - Usage: Page titles, major section headers
  - Tone: Authoritative but not heavy

- **H2**: 1.875rem (30px) / font-weight: 600 / line-height: 1.3
  - Usage: Section headers, card titles

- **H3**: 1.5rem (24px) / font-weight: 600 / line-height: 1.4
  - Usage: Subsection headers

- **H4**: 1.25rem (20px) / font-weight: 500 / line-height: 1.4
  - Usage: Minor headers, form section labels

#### Body Text

- **Base**: 1rem (16px) / font-weight: 400 / line-height: 1.6
  - Usage: Primary body text, paragraphs
  - Rationale: Comfortable reading, professional standard

- **Small**: 0.875rem (14px) / font-weight: 400 / line-height: 1.5
  - Usage: Helper text, captions, form hints

### Font Weight Philosophy

- **Regular (400)**: Default for body text, comfortable reading
- **Medium (500)**: Subtle emphasis, labels, secondary headings
- **Semibold (600)**: Headings, important labels, emphasis
- **Bold (700)**: Avoid unless absolutely necessary for strong emphasis

### Line Height Philosophy

- **Tight (1.2-1.3)**: Headings only, for compact hierarchy
- **Normal (1.4-1.5)**: Short text, labels, buttons
- **Relaxed (1.6)**: Body text, paragraphs, for comfortable reading

---

## 4. Spacing & Layout

### Base Spacing Scale

Use Tailwind's default spacing scale (0.25rem increments):

- **xs**: 0.25rem (4px) - Minimal gaps, tight layouts
- **sm**: 0.5rem (8px) - Small gaps, icon spacing
- **base**: 1rem (16px) - Default spacing, comfortable gaps
- **lg**: 1.5rem (24px) - Section spacing, card padding
- **xl**: 2rem (32px) - Major section spacing
- **2xl**: 3rem (48px) - Page-level spacing

### Component-Specific Spacing Rules

#### Buttons

- **Padding**: `px-4 py-2` (horizontal: 1rem, vertical: 0.5rem) for standard buttons
- **Icon spacing**: `gap-2` (0.5rem) between icon and text
- **Min height**: 2.5rem (40px) for comfortable touch targets

#### Inputs

- **Padding**: `px-3 py-2` (horizontal: 0.75rem, vertical: 0.5rem)
- **Min height**: 2.5rem (40px) for consistency with buttons
- **Label spacing**: `mb-2` (0.5rem) between label and input

#### Cards

- **Padding**: `p-6` (1.5rem) for standard cards
- **Gap between cards**: `gap-4` (1rem) or `gap-6` (1.5rem) depending on density
- **Header padding**: `px-6 py-4` if card has distinct header section

#### Forms

- **Field spacing**: `space-y-4` (1rem) between form fields
- **Section spacing**: `space-y-6` (1.5rem) between form sections
- **Error message spacing**: `mt-1.5` (0.375rem) below input

#### Tables

- **Cell padding**: `px-4 py-3` (horizontal: 1rem, vertical: 0.75rem)
- **Row spacing**: Minimal, rely on borders/separators for clarity
- **Header padding**: `px-4 py-3` with font-weight: 500

### Border Radius Philosophy

- **Sharp (0px)**: Avoid; too harsh for modern aesthetic
- **Subtle (0.25rem / 4px)**: Default for inputs, buttons, cards
- **Moderate (0.375rem / 6px)**: For larger cards, containers
- **Rounded (0.5rem / 8px)**: Maximum; avoid anything more rounded

Rationale: Subtle rounding maintains modern, professional feel without being playful or overly soft.

### Responsive Layout & Sizing Strategy (Web)

#### Core Principles

- **Layout spacing** (margin, padding, gap) uses **fixed design tokens** from the Tailwind spacing scale
- **Responsive changes** happen via **breakpoints** (sm, md, lg, xl), not continuous scaling
- **Widths and heights** are content-driven or breakpoint-based (e.g., `w-full md:w-1/2`)
- **Borders and border-radius** are **fixed** and never scale with viewport size
- **CSS `clamp()`** is **RESERVED** for:
  - Typography (headings only, as approved)
  - Rare cases of max-width on large containers (e.g., `max-w-7xl` with clamp for very large screens)
- **JavaScript-based layout or typography scaling** is **forbidden**

#### Strategy Summary

| Property               | Strategy                           | Allowed Techniques                                                                       |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **Margin/Padding/Gap** | Fixed tokens                       | Tailwind spacing scale (rem values), breakpoint variants (`p-4 md:p-6`)                  |
| **Width**              | Content-driven or breakpoint-based | `w-full`, `max-w-*`, breakpoint widths (`md:w-1/2`), container queries (future)          |
| **Height**             | Content-driven or fixed            | `h-auto`, `min-h-*`, fixed heights for specific components, avoid viewport-based heights |
| **Border Width**       | Fixed                              | `border` (1px), `border-2` (2px) - never scales                                          |
| **Border Radius**      | Fixed                              | `rounded`, `rounded-md`, `rounded-lg` - never scales                                     |
| **Font Size**          | Fixed or clamp (headings only)     | Fixed rem values for body, clamp() for headings only                                     |
| **Line Height**        | Fixed ratio                        | Unitless values (1.2, 1.4, 1.6) - never scales                                           |

#### Responsive Breakpoints

Use Tailwind's default breakpoints:

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

Responsive changes should be **discrete** (step changes at breakpoints), not fluid/continuous.

#### Forbidden Techniques

- ❌ Viewport-based units (vw, vh) for spacing, padding, margins, or borders
- ❌ `clamp()` for layout properties (margin, padding, gap, width, height, border-radius)
- ❌ JavaScript-based responsive scaling or dynamic font-size calculations
- ❌ CSS calc() for viewport-dependent spacing
- ❌ Percentage-based widths that create fluid scaling (use breakpoint-based widths instead)

#### Allowed Techniques

- ✅ Fixed rem/px values from Tailwind spacing scale
- ✅ Breakpoint variants (`p-4 md:p-6 lg:p-8`)
- ✅ Container queries (when supported) for component-level responsiveness
- ✅ `clamp()` for typography (headings) only
- ✅ `max-w-*` utilities for content width constraints
- ✅ Flexbox and Grid with fixed gap values

---

## 5. Component Usage Rules

### Button Variants

#### Primary Button

- **Usage**: Main actions, form submissions, primary CTAs
- **Visual**: Solid background (primary color), white/light text
- **When to use**: Sign in, submit, create, save

#### Secondary Button

- **Usage**: Secondary actions, alternative options
- **Visual**: Outlined or ghost style, subtle border
- **When to use**: Cancel, back, alternative actions

#### Ghost Button

- **Usage**: Tertiary actions, less important actions
- **Visual**: No background, text only, hover state shows subtle background
- **When to use**: Clear, skip, less prominent actions

#### Destructive Button

- **Usage**: Delete, remove, destructive actions
- **Visual**: Muted red background or outline
- **When to use**: Delete account, remove item, permanent actions

**Rule**: Only one primary button per view/section. Multiple primary buttons create confusion.

### Form Layout Rules

#### Label Placement

- **Position**: Above input (not inline, not floating)
- **Spacing**: `mb-2` (0.5rem) between label and input
- **Style**: Font-weight: 500, text-sm or text-base

#### Input Grouping

- **Related fields**: Group with `space-y-4` (1rem vertical spacing)
- **Sections**: Separate with `space-y-6` (1.5rem) or subtle separator
- **Alignment**: Left-align labels and inputs (no center alignment)

#### Error States

- **Display**: Below input, `mt-1.5` spacing
- **Color**: Destructive color (muted red)
- **Text size**: `text-sm` (0.875rem)
- **Icon**: Optional, subtle error icon if space allows

#### Success States

- **Display**: Subtle, not intrusive
- **Color**: Success color (muted green)
- **Avoid**: Overly celebratory animations or large success messages

### Table Density & Readability

#### Density

- **Default**: Medium density (comfortable padding, not cramped)
- **Cell padding**: `px-4 py-3` minimum
- **Row height**: Minimum 3rem (48px) for comfortable scanning

#### Readability

- **Alternating rows**: Subtle background (slate-50) for even rows (optional)
- **Borders**: Horizontal borders only (between rows), not vertical
- **Header**: Distinct but subtle (font-weight: 500, slightly darker background)
- **Alignment**: Left-align text, right-align numbers

#### Scrolling

- **Horizontal scroll**: Allowed for wide tables, with clear indication
- **Sticky headers**: Recommended for long tables

---

## 6. Non-goals (Explicit)

The following are intentionally NOT defined in this contract and will be addressed later:

- **Dark mode**: Color tokens and implementation strategy deferred
- **Animations & transitions**: Timing, easing, and animation patterns not yet defined
- **Brand illustrations**: Logo, illustrations, and brand-specific graphics deferred
- **Marketing-specific styling**: Landing pages, marketing sections, promotional content styling deferred
- **Mobile-specific adaptations**: Responsive breakpoint strategies beyond Tailwind defaults not yet defined
- **Accessibility enhancements**: Beyond WCAG AA minimums, advanced a11y patterns deferred
- **Loading states**: Skeleton screens, loading indicators, and spinner styles deferred
- **Empty states**: Illustrations, messaging, and CTAs for empty states deferred
- **Toast/notification styling**: Toast component styling and positioning deferred
- **Modal/dialog styling**: Dialog component styling and overlay behavior deferred

---

## 7. Implementation Guidelines

### CSS Variables

All semantic colors MUST be defined as CSS variables in `app/globals.css` and referenced via Tailwind's theme system. Components reference these variables, not hardcoded values.

### Component Composition

- Use shadcn/ui components as base primitives
- Compose complex components from primitives
- Maintain consistent spacing and styling through composition
- Avoid inline styles; use Tailwind utility classes

### Layout & Spacing Constraints

- Layout and spacing must not use `clamp()` or viewport-based scaling; use fixed design tokens and breakpoint-based responsive changes only.

### Consistency Checklist

Before adding new UI components, verify:

- [ ] Uses semantic color tokens (no raw colors)
- [ ] Follows spacing scale (Tailwind defaults)
- [ ] Typography matches hierarchy rules
- [ ] Border radius is subtle (4-8px max)
- [ ] Padding follows component-specific rules
- [ ] Visual weight matches importance (primary vs secondary)

---

## 8. Design Principles Summary

1. **Subtlety over boldness**: Every visual element should feel intentional but not loud
2. **Consistency over variety**: Reuse patterns, don't invent new styles per component
3. **Clarity over decoration**: Visual elements must serve function
4. **Professional over playful**: Maintain serious, trustworthy aesthetic
5. **Minimal over maximal**: Less is more; remove unnecessary elements

This contract is binding for all future UI development. Deviations require explicit approval and documentation of rationale.
