---
name: Homestay Booking
description: Quiet-luxury design system for the homestay booking and operations platform
colors:
  background: "#F6F3ED"
  surface: "#FFFFFF"
  surface-muted: "#FBF9F5"
  surface-container: "#EFEAE1"
  surface-container-high: "#E5DED2"
  text: "#242A27"
  text-muted: "#6A6C66"
  outline: "#C9C1B4"
  outline-variant: "#E4DED3"
  primary: "#B28455"
  primary-hover: "#946A42"
  primary-container: "#EDE0CF"
  on-primary-container: "#5E4328"
  secondary: "#173A31"
  secondary-container: "#245545"
  on-secondary: "#FFFFFF"
  tertiary: "#8B6848"
  error: "#C62828"
  error-container: "#FFEBEE"
typography:
  editorial:
    fontFamily: Iowan Old Style, Baskerville, Palatino Linotype, Georgia, serif
    usage: Marketing headlines, room names, page statements, large KPI values
  display:
    fontFamily: Aptos Display, Segoe UI Variable Display, Segoe UI, sans-serif
    usage: Navigation, buttons, UI headings, labels
  body:
    fontFamily: Aptos, Segoe UI Variable Text, Segoe UI, sans-serif
    usage: Body copy, forms, tables, helper text
rounded:
  button: 12px
  card: 16px
  feature-card: 18px
  pill: 9999px
shadows:
  card: 0 10px 34px rgba(31, 43, 37, 0.065)
  elevated: 0 22px 64px rgba(22, 40, 33, 0.14)
---

# Homestay Booking Design System

## Brand direction

The product uses a **Boutique Nature Stay / Quiet Luxury** direction: calm, warm, local and operationally trustworthy. The interface should feel like a carefully run boutique homestay rather than a generic SaaS template.

- Warm ivory creates an inviting base.
- Deep forest green communicates calm and reliability.
- Champagne/bronze is a restrained accent, never a neon action color.
- Editorial serif headlines add hospitality character; the UI remains clean sans-serif.
- Photography must show real lodging contexts: bedrooms, bathrooms, common areas, gardens and local surroundings.

Do not use music, recording-room, instrument or rehearsal imagery and terminology. Do not present unverified ratings, guest counts, operating hours, contact details or testimonials as facts.

## Color rules

- `secondary` is the primary high-contrast action color for important buttons and dashboard navigation.
- `primary` is an accent for eyebrows, focus rings, status details and decorative rules.
- `background` is the default page canvas; `surface` is for cards, forms and data panels.
- Use semantic tokens instead of hard-coded hex values inside components.
- Text on white uses `text` or `secondary`; small bronze text must meet WCAG AA contrast.
- Gradients and glow are exceptional, not default. Prefer tonal layers, thin borders and whitespace.

## Typography

- Marketing `h1`/`h2`, room names and large KPI values: `font-editorial`.
- Navigation, controls, labels and product headings: `font-display`.
- Paragraphs, tables and forms: `font-sans`.
- Eyebrows use `.eyebrow`: 11–12px, uppercase, strong tracking.
- Keep body text at 14–18px with line-height between 1.55 and 1.8.
- Never use more than three visual type levels inside one card.

## Layout

- Public pages: max width 1400px, 20px mobile gutters, 32px desktop gutters.
- Marketing sections: 80–96px vertical spacing on desktop, 64–80px on mobile.
- Auth: single column below `lg`; editorial banner and form split from `lg` upward.
- Admin/staff: 272px desktop sidebar; compact mobile header plus a usable navigation surface.
- Customer content: max width 1152px with a plain page header and 16px cards.
- Prefer one page scroll. Nested scroll is reserved for true work surfaces such as long data panels.

## Shapes and elevation

- Inputs and standard buttons: 12px radius.
- Cards and modals: 16px radius.
- Marketing feature cards: up to 18px radius.
- Pills are reserved for statuses, compact filters and major marketing CTAs.
- Static cards do not lift on hover. Hover elevation is only for clearly interactive cards.
- Use a one-pixel neutral border plus the low ambient shadow; elevated shadow is for menus, dialogs and featured panels.

## Components

### Buttons

- Primary operational action: deep forest background, white text, 44–48px height.
- Marketing CTA: white-on-forest or forest-on-ivory; pill shape is allowed.
- Secondary: neutral border, transparent/white background.
- Destructive: semantic error color and an explicit confirmation step.
- Every disabled button must retain readable text and clearly explain unavailable state nearby.

### Cards

- Default: white surface, neutral border, 16px radius, 20–24px padding.
- Room cards: consistent image ratio, clear name, capacity, price unit, availability and two explicit actions.
- Dashboard metrics: compact label, prominent value and a short operational hint.
- Avoid decorative blobs, oversized radii and repeated glass effects.

### Forms

- Labels are sentence case and permanently visible.
- Inputs are at least 48px high with a visible border and four-pixel soft focus ring.
- Errors use `role="alert"`; success uses `role="status"`.
- Use correct `autocomplete`, input type and accessible names.
- Do not show controls for integrations that are not implemented.

### Navigation

- Public header: ivory translucent surface, minimal links and one clear room-discovery CTA.
- Admin/staff sidebar: deep forest with white active item and bronze accent.
- Mobile navigation must expose every primary route and logout without horizontal guessing.
- The brand mark links to the relevant homepage/dashboard; it never reloads the current page.

## Content and imagery

- Vietnamese copy should be concise, specific and hospitality-oriented.
- Keep the current hourly booking model explicit as “khung giờ lưu trú linh hoạt”; do not imply nightly pricing unless the business model changes.
- Technical implementation terms such as endpoint, webhook, mock, database and provider portal do not belong in customer-facing copy.
- Generated or stock imagery must have no text, logo or watermark and must match the actual lodging context.
- Alt text describes what is visibly present, not marketing claims.

## SEO and accessibility

- Public routes have unique title, description, canonical, Open Graph and Twitter metadata.
- Auth, customer account, admin and staff routes are `noindex`.
- Keep `robots.ts`, `sitemap.ts` and `manifest.ts` aligned with route changes.
- Use one semantic `h1` per page, meaningful heading order and server-rendered fallback room content.
- Public layouts provide a skip link to `#main-content`.
- All interactive controls have keyboard access, visible focus and sufficient contrast.
- Respect reduced-motion and accessibility preferences already defined in `globals.css`.

## Do / do not

- Do use whitespace, strong photography, restrained borders and concise copy.
- Do keep behavior stable while incrementally improving shared shells and primitives.
- Do verify public, auth, customer, staff and admin layouts at mobile and desktop widths.
- Do not invent social proof, addresses, phone numbers, support hours or social links.
- Do not use music-related branding or legacy room-studio language.
- Do not mix multiple radius, shadow and color systems in one bounded context.
