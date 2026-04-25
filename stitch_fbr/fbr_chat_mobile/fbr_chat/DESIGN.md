---
name: FBR CHAT
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#404849'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#707979'
  outline-variant: '#bfc8c9'
  surface-tint: '#2a676c'
  primary: '#003336'
  on-primary: '#ffffff'
  primary-container: '#004b50'
  on-primary-container: '#7fbabf'
  inverse-primary: '#96d1d6'
  secondary: '#006970'
  on-secondary: '#ffffff'
  secondary-container: '#8aeff9'
  on-secondary-container: '#006e75'
  tertiary: '#2d2d2e'
  on-tertiary: '#ffffff'
  tertiary-container: '#434344'
  on-tertiary-container: '#b2afb0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1edf2'
  primary-fixed-dim: '#96d1d6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#074f54'
  secondary-fixed: '#8df2fc'
  secondary-fixed-dim: '#6fd6df'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e5e2e3'
  tertiary-fixed-dim: '#c8c6c7'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474647'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 42px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.03em
  mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 12px
  sidebar-width: 280px
---

## Brand & Style
The design system is engineered for high-stakes corporate communication where speed and precision are paramount. It evokes a **mission-critical atmosphere**, stripping away decorative noise to focus on **silent elegance** and **brutal clarity**. 

The style is a synthesis of **Corporate Modernism** and **Technical Minimalism**. It draws inspiration from aerospace operations rooms and high-performance software like Linear. The aesthetic is mature and high-fidelity, favoring density and rhythm over expansive whitespace. By minimizing the use of cards and container borders, the system relies on typographic hierarchy and structural alignment to guide the eye, creating an interface that feels like a professional instrument rather than a consumer toy.

## Colors
The palette is restrained, utilizing temperature shifts to define functional zones. 
- **Foundations:** Use `#F9F8F6` (slightly warm) for primary content areas to reduce eye strain. Use `#F2F4F7` (cold grey) for sidebars, utilities, and inactive panels to create a subtle tectonic shift between the "work" and the "tools."
- **Typography:** Text is anchored by `#1A1A1B` (Deep Charcoal), ensuring maximum contrast and a "printed" feel.
- **Accents:** Petroleum Blue (`#004B50`) is the primary action color, used for high-importance states and primary buttons. Technical Cyan (`#008B94`) acts as a secondary accent for data visualization, online indicators, and subtle highlights.

## Typography
This design system employs an editorial-technical pairing. 
- **Headlines:** Newsreader (Serif) is used for high-level titles and empty states to provide an authoritative, "premium publication" feel.
- **UI & Content:** Inter (Sans-serif) handles all functional UI, messaging, and data display. 
- **Rhythm:** Line heights are kept tight for UI labels to maintain density, while message bodies use a generous `1.6` multiplier to ensure legibility in long threads. Small labels use uppercase with tracking for a technical, "instrumental" aesthetic.

## Layout & Spacing
The layout follows a **dense fluid model** with a rigid 4px baseline grid. 
- **Structure:** Use a fixed-width sidebar for navigation (`280px`) and a fluid central column for messaging. 
- **Density:** High information density is required. Gutters are kept narrow (`12px`) to keep related data clusters tight. 
- **Alignment:** Elements should align to the baseline grid to create a "tabulated" feel. Horizontal rhythm is managed through consistent padding units (`16px` for standard containers, `8px` for internal components).

## Elevation & Depth
Depth is conveyed through **Tonal Layering** rather than traditional shadows. 
- **Tier 1 (Surface):** The base canvas (`#F9F8F6`).
- **Tier 2 (Inset):** Sidebars and toolbars use `#F2F4F7` to appear "underneath" or behind the primary content.
- **Outlines:** Use low-contrast, 1px borders (`#E5E5E3`) only when necessary to separate distinct functional areas. 
- **Overlays:** Modals and menus use a high-precision, razor-thin shadow (0px 4px 20px rgba(0,0,0,0.08)) with a solid white background to pop against the warm/cold neutrals.

## Shapes
The shape language is **disciplined and professional**. 
- **Standard Elements:** Buttons, input fields, and tags use a `0.25rem` (4px) radius. This provides just enough softness to feel modern without sacrificing the "serious" architectural feel.
- **Large Containers:** Modals or large panels use `0.5rem` (8px). 
- **Avatars:** Strictly circular to break the grid and make human elements easily identifiable within the technical layout.

## Components
- **Buttons:** Primary buttons use `#004B50` with white text. Secondary buttons use a ghost style with a `#1A1A1B` 1px border. No gradients; flat fills only.
- **Messaging:** Messages are not housed in bubbles. Use a "Slack-style" or "Linear-style" list where hover states reveal actions. This reduces visual clutter and maximizes vertical space.
- **Input Fields:** Minimalist design with a bottom-border only or a very subtle `4px` rounded stroke. Focus states use the Technical Cyan (`#008B94`).
- **Chips/Status:** Use a "pill" shape with small uppercase labels. Status indicators (Online/Away) use a small, solid circle next to the name.
- **Activity Feed:** A dense, vertical list of events with monospaced timestamps to emphasize the operational nature of the platform.