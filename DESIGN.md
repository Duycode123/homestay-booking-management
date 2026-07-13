---
name: Homestay Booking
description: Design system for Homestay Booking Management — đặt phòng homestay trực tuyến
colors:
  surface: "#F5F2EC"
  surface-dim: "#E8E4DC"
  surface-bright: "#FFFFFF"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#FAF8F4"
  surface-container: "#F0EDE6"
  surface-container-high: "#E8E4DC"
  surface-container-highest: "#D6D0C4"
  on-surface: "#1A1C1E"
  on-surface-variant: "#5C5348"
  inverse-surface: "#042A16"
  inverse-on-surface: "#E8F5EC"
  outline: "#C9C2B6"
  outline-variant: "#E8E4DC"
  surface-tint: "#FF7518"
  primary: "#FF7518"
  on-primary: "#FFFFFF"
  primary-container: "#FFE8D6"
  on-primary-container: "#6B3200"
  inverse-primary: "#FFB07A"
  secondary: "#042A16"
  on-secondary: "#FFFFFF"
  secondary-container: "#0A4D27"
  on-secondary-container: "#A8D4B8"
  tertiary: "#B45309"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#FEF3C7"
  on-tertiary-container: "#78350F"
  error: "#C62828"
  on-error: "#FFFFFF"
  error-container: "#FFEBEE"
  on-error-container: "#8B1A1A"
  primary-fixed: "#FFD4A8"
  primary-fixed-dim: "#FFB07A"
  on-primary-fixed: "#2E1500"
  on-primary-fixed-variant: "#6B3200"
  secondary-fixed: "#A8D4B8"
  secondary-fixed-dim: "#6BA882"
  on-secondary-fixed: "#001A0D"
  on-secondary-fixed-variant: "#042A16"
  background: "#F5F2EC"
  on-background: "#1A1C1E"
  surface-variant: "#F0EDE6"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: "700"
    lineHeight: 52px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 12px
    height: 48px
  button-primary-hover:
    backgroundColor: "#E6640F"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 12px
    height: 48px
  button-secondary-hover:
    backgroundColor: "{colors.surface-container-low}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  card-room:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  card-room-hover:
    backgroundColor: "{colors.surface-container-low}"
  card-stat:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 10px
  sidebar-banner:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  nav-sidebar:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    padding: "{spacing.md}"
  nav-item-active:
    backgroundColor: rgba(255, 117, 24, 0.12)
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 10px
  list-item:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  list-item-hover:
    backgroundColor: "{colors.surface-container-low}"
  badge-status:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-success:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-vip:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
---

## Brand & Style

Homestay Booking phục vụ nhạc sĩ, khách lưu trú và người thuê phòng homestay. Cảm giác cần đạt: **studio cao cấp, ấm áp, có năng lượng** — không lạnh như SaaS generic, không quá tối như festival app.

Phong cách: **Warm Studio Premium**. Nền linen ấm (`#F5F2EC`) gợi phòng thu acoustic; cam `#FF7518` là tia năng lượng sáng tạo; xanh rừng đậm là không gian cách âm chuyên nghiệp; vàng amber cho gói VIP và ưu đãi.

## Colors

- **Primary (Studio Orange #FF7518):** CTA duy nhất mỗi màn — "Đặt phòng", "Xác nhận", "Đăng nhập". Không dùng cho paragraph.
- **Secondary (Deep Forest #042A16 → #0A4D27):** Banner auth, sidebar dashboard. Gradient `secondary` → `secondary-container`.
- **Tertiary (Amber Gold #B45309):** Phòng VIP, giá cao cấp, badge ưu đãi — không tranh spotlight với cam.
- **Neutral (Warm Linen #F5F2EC):** Nền toàn app; mềm hơn xám lạnh, dễ nhìn lâu.
- **On-surface (#1A1C1E):** Ink đậm cho tiêu đề — contrast cao trên nền ấm.
- **Surface layers:** Card trắng (`surface-container-lowest`) nổi trên nền linen; viền `outline-variant` hoặc shadow ấm.

## Typography

Chiến lược dual-font (theo mẫu GitHub `totality-festival`):

- **Space Grotesk** — tiêu đề, số liệu, label, nav. Geometric, hơi tech, hợp studio/modern music.
- **Inter** — body, mô tả phòng, helper text. Dễ đọc, trung tính.

Quy tắc:
- Hero / tên phòng: `display` hoặc `headline-lg`
- Dashboard stat number: `headline-md` + Space Grotesk
- Form label: `label-sm` uppercase, letter-spacing rộng
- Tối đa 2 font-weight trên một card

## Layout & Spacing

Mobile-first. Grid 4 cột (mobile) → 12 cột (desktop, max 1280px).

| Vùng | Quy tắc |
|------|---------|
| Auth | Split 50/50; form max 440px; banner ẩn dưới `md` |
| Dashboard | Sidebar cố định 260px (desktop); content `max-w-6xl` |
| Danh sách phòng | Grid `1 → 2 → 3` cột; gap `gutter` (20px) |
| Section gap | `lg` (40px) giữa block; `md` (24px) trong card |

Whitespace là luxury — mỗi card phòng cần ảnh + title + meta + CTA, không nhồi text.

## Elevation & Depth

Depth qua **tonal layers** + **warm ambient shadow** (không glassmorphism).

| Level | Dùng cho | Style |
|-------|----------|-------|
| 0 | Page background | `background` linen, không shadow |
| 1 | Card, form | Trắng + `0 4px 24px rgba(26,28,30,0.06)` |
| 2 | Modal, popover | `0 12px 48px rgba(26,28,30,0.12)` |
| Hover | Card phòng | Shadow spread +4px; không đổi màu nền mạnh |

Button primary: `active:scale-[0.98]`, transition 150ms.

## Shapes

**Soft Studio** — bo góc vừa, chuyên nghiệp.

- Button / input: `rounded-lg` (1rem)
- Card / modal: `rounded-xl` (1.25rem)
- Badge: `rounded-full`
- Logo icon box: `rounded-xl`, nền `primary`
- Ảnh phòng trong card: `rounded-lg`, aspect 16/10

## Components

### Buttons

| Variant | Khi nào | Style |
|---------|---------|-------|
| Primary | 1 CTA chính / màn | Cam đặc, chữ trắng, `rounded-lg`, h-12 |
| Secondary | Hủy, quay lại | Viền `outline`, nền transparent |
| Ghost | Link trong card | Chữ `primary`, không viền |

### Cards

- **card:** Container chung — trắng, `rounded-xl`, border `outline-variant`, padding 24px.
- **card-room:** Card phòng homestay — ảnh trên, badge trạng thái góc phải, giá màu `on-surface`, CTA primary full-width mobile.
- **card-stat:** Dashboard — số `headline-md`, label `label-sm` màu `on-surface-variant`.

### Inputs

- Nền trắng, border `outline`, `rounded-lg`
- Focus: border `primary` + ring 1px `primary` ở 30%
- Label: `label-sm` uppercase
- Error: `error-container` nền, chữ `error`

### Navigation

- **nav-sidebar:** Nền `inverse-surface`, chữ `inverse-on-surface`
- Item active: nền cam 12% opacity, chữ `primary`, stripe trái 3px cam
- Logo + "Homestay Booking" ở đầu sidebar

### Badges

| Badge | Màu | Dùng cho |
|-------|-----|----------|
| badge-status | Cam nhạt | Chờ duyệt, sắp hết hạn |
| badge-success | Xanh | Đã xác nhận, còn trống |
| badge-vip | Vàng amber | Phòng VIP, gói premium |

## Do's and Don'ts

- **Do** dùng Space Grotesk cho headline và label; Inter cho body.
- **Do** giữ nền linen ấm — không chuyển sang `#F8F9FA` lạnh.
- **Do** một nút cam primary duy nhất mỗi viewport.
- **Do** sync token giữa `DESIGN.md` và `globals.css`.
- **Don't** dùng xanh dương (đã bỏ) — tertiary là amber.
- **Don't** hardcode hex trong component.
- **Don't** inline `style={{}}` khi có Tailwind token.
- **Don't** trộn bo góc `sm` và `xl` trên cùng card.
