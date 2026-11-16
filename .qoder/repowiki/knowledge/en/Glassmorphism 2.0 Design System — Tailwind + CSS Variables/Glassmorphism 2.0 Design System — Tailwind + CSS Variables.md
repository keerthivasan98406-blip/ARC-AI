---
kind: frontend_style
name: Glassmorphism 2.0 Design System — Tailwind + CSS Variables
category: frontend_style
scope:
    - '**'
source_files:
    - index.css
    - tailwind.config.js
    - postcss.config.js
    - public/sidebar-icons.css
    - package.json
---

# Frontend Style: Glassmorphism 2.0 Design System

## Approach

The Arc AI OS frontend uses a **hybrid styling approach** built on three layers:

1. **Tailwind CSS v3** (utility-first) as the primary layout and spacing system, configured via `tailwind.config.js`.
2. **A centralized CSS custom properties design token layer** in `index.css`, defining the "Glassmorphism 2.0" palette, glass effects, glow/shadow tokens, easing curves, and animation keyframes.
3. **Hand-written component-level CSS classes** (`.glass-*`, `.btn-radiant`, `.ai-prompt-border`, etc.) that compose Tailwind utilities with the shared tokens for reusable visual primitives.

Build tooling is Vite + PostCSS + Autoprefixer (`postcss.config.js`). No SCSS/Sass; plain CSS only.

## Key Files

- `index.css` (~1700 lines) — the design system root: `@tailwind base/components/utilities`, CSS variables under `:root`, glassmorphism utility classes, animations, responsive shell rules.
- `tailwind.config.js` — extends Tailwind's theme with the project's color palette (`bg-void`, `primary-blue`, `accent-purple`, `neon-*`), font families (`Outfit`, `Inter`, `Fira Code`), and sets `darkMode: 'class'`.
- `public/sidebar-icons.css` — dedicated icon system (stroke-based SVGs, 3 breakpoints, hover/active/disabled states).
- `postcss.config.js` — enables Tailwind + Autoprefixer.
- `package.json` — declares `tailwindcss ^3.4.17`, `autoprefixer`, `postcss`, `vite`, `@vitejs/plugin-react`; also pulls in `@fortawesome/fontawesome-free` as an additional icon source.

## Architecture and Conventions

### Design Tokens (CSS Custom Properties)
All colors, shadows, blurs, gradients, and easing curves live in `:root` of `index.css`:
- Backgrounds: `--bg-void`, `--bg-dark`, `--bg-midnight`, `--bg-slate`
- Accents: `--primary-blue`, `--accent-purple`, `--accent-cyan`, `--accent-pink`, `--accent-emerald`, `--accent-amber`, `--accent-rose`
- Neon glows: `--neon-blue`, `--neon-purple`, `--neon-pink`, `--neon-magenta` plus `*-glow` / `*-glow-strong` alpha variants
- Glass tokens: `--glass-bg-base/elevated/pill/input/overlay`, `--glass-blur-sm/md/lg/xl`, `--glass-saturate`, `--glass-border-subtle/default/strong/focus`, `--glass-shadow-*`, `--glass-inset-highlight/inset-depth`
- Easings: `--ease-smooth`, `--ease-bounce`, `--ease-decel`

These are mirrored into Tailwind's `theme.extend.colors` so they can be referenced as `bg-bg-void`, `text-primary-blue`, etc., inside JSX class strings.

### Glassmorphism Utility Classes
`index.css` defines a family of composable classes following a `.glass-*` naming scheme:
- `.glass-os` (app shell), `.glass-card` (elevated card), `.glass-pill` (chip), `.glass-nav` (navigation bar), `.glass-elevated` (panel), `.glass-input` / `.glass-textarea` / `.glass-select` (form controls), `.glass-button` (base button)
- Each applies `backdrop-filter: blur(...) saturate(...)` with matching border opacity and layered box-shadows using the tokenized shadow/glow variables.
- Hover/active states use subtle transforms (`translateY(-2px) scale(1.005)`) and intensified shadows.

### Special Visual Primitives
- `.ai-prompt-border` — animated conic-gradient rotating border around the main prompt input, with inner `.ai-prompt-inner` overlay.
- `.chat-input-glow` — shimmering silver gradient border with pulsing glow pseudo-element.
- `.btn-radiant` — gradient-animated primary action button.
- Press-state helpers: `.btn-press-scale`, `.btn-press-shadow`, `.btn-press-color`, `.btn-press-combo`, `.btn-ripple`.
- Text gradient helpers: `.text-gradient-radiant`, `.text-gradient-lavender`.
- Focus ring helpers: `.focus-ring-cyan`, `.focus-ring-lime`.

### Icon System
Two parallel systems coexist:
- **Sidebar icons** (`public/sidebar-icons.css`): stroke-based inline SVGs sized via `.icon-sm/md/lg/xl` with breakpoint-specific scaling at 640px and 1024px, plus `.icon-hover-scale`, `.icon-hover-rotate`, `.icon-hover-glow`, `.icon-active`, `.icon-disabled`.
- **Font Awesome** (`@fortawesome/fontawesome-free` dependency) available as a secondary icon source.

### Responsive Strategy
- Breakpoints used in CSS: `640px` (mobile/small tablet), `1024px` (tablet/desktop split), `1023px` (mobile nav/header toggles).
- Mobile-specific patterns:
  - `.mobile-bottom-nav` fixed bottom bar with `backdrop-filter: blur(24px) saturate(180%)`.
  - `.mobile-header-always-visible` forces header visibility below 1024px.
  - Touch targets: `min-height: 44px`, `min-width: 44px` for buttons/links below 1024px.
  - iOS zoom prevention: `font-size: 16px !important` on inputs below 1024px.
  - Safe-area support via `env(safe-area-inset-*)`.
  - Modal full-screen override: `.modal-mobile-full`, `.modal-mobile-sheet` below 640px.
- The app shell uses flexbox columns on desktop and switches to column layout at `max-width: 1024px`.

### Animations
Centralized `@keyframes` in `index.css`: `gradientShift`, `floatSlow`, `pulseGlow`, `rotateOrb`, `shimmer`, `streamReveal`, `streamDot`, `msgEnter`, `glowSweep`, `fadeInUp`, `fadeInScale`, `slideInRight`, `slideInDown`, `orbPulse`, `orbPulseCore`, `orbRotate`, `borderGlow`, `robotFloat`, `robotGlow`, `inputBorderFlow`, `inputGlowPulse`, `inputBorderSweep`, `borderFlow`.

Animations are gated by `@media (prefers-reduced-motion: reduce)` to disable them for accessibility.

### Typography
- Font families defined in Tailwind config: `sans: ['Outfit', 'Inter', 'system-ui']`, `display: ['Outfit', 'system-ui']`, `mono: ['Fira Code', 'Cascadia Code', 'Consolas']`.
- `index.css` includes `@font-face` declarations for Outfit, Inter, Fira Code with local fallbacks for offline use.

### Dark Mode
Configured as `darkMode: 'class'` in `tailwind.config.js`, meaning dark mode is toggled by adding/removing a `dark` class on a parent element rather than via media query.

## Conventions Observed

- All global styles live in `index.css`; components do not import their own CSS files.
- Color values are never hardcoded in components or utility classes — they reference CSS custom properties from `:root`.
- Glass panels consistently combine `backdrop-filter: blur()` + `saturate()` + semi-transparent background + thin white border + layered `box-shadow`.
- Interactive elements follow a consistent hover/active pattern: slight `translateY` lift on hover, scale-down on `:active`, with transition duration collapsing to `0.1s` on active.
- Animations use `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-smooth`) as the default easing.
- Reduced-motion preference is respected across all animated classes.
- Icons are preferred as inline SVGs with stroke-based styling (see sidebar-icon system); Font Awesome is available but the documented convention favors vector SVGs.
- Tailwind content scanning includes `./components/**/*.{tsx,ts}` and `./services/**/*.{tsx,ts}`, so utility classes written directly in those directories are purged correctly.