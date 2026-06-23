# Telegram-Inspired Design System

> A complete design reference for building apps with a Telegram-like aesthetic.
> Covers color tokens, typography, spacing, border radius, elevation, and all key components — for both Light and Dark mode.

---

## 1. Brand Identity

| Property | Value |
|---|---|
| Primary Blue | `#2AABEE` |
| Gradient (app icon) | `#37AEE2` → `#1E96C8` |
| White | `#FFFFFF` |
| Font (Android) | Roboto |
| Font (iOS) | SF Pro |
| Font (Web fallback) | -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif |

---

## 2. Color Tokens

### 2.1 Primitive Palette

These are the raw hex values. Never use these directly in components — use semantic tokens instead.

| Name | Hex | Usage |
|---|---|---|
| blue-400 | `#2AABEE` | Primary accent |
| blue-300 | `#5BBEF5` | Lighter accent (icons, tints) |
| blue-500 | `#1A8DC7` | Pressed/active state |
| teal-400 | `#4DB6AC` | Online indicator |
| green-400 | `#4CAF50` | Sent/delivered tick |
| red-400 | `#E53935` | Missed call, destructive |
| gold-400 | `#FAD155` | Star / Favorite badge |
| gray-50 | `#F1F1F4` | Secondary background |
| gray-100 | `#E7E7E7` | Dividers |
| gray-300 | `#AAAAAA` | Inactive icons |
| gray-500 | `#707579` | Secondary text |
| gray-900 | `#1C1C1E` | Primary text (light mode) |
| dark-900 | `#17212B` | App background (dark mode) |
| dark-800 | `#232E3C` | Surface (dark mode) |
| dark-700 | `#2B5278` | Elevated surface / outgoing bubble (dark mode) |
| dark-600 | `#182533` | Incoming bubble (dark mode) |
| dark-500 | `#0F1923` | Divider (dark mode) |
| dark-400 | `#708499` | Secondary text (dark mode) |

---

### 2.2 Semantic Tokens — Light Mode

```
--color-bg-primary:         #FFFFFF      /* Main app background */
--color-bg-secondary:       #F1F1F4      /* Section backgrounds, search bar fill */
--color-bg-elevated:        #FFFFFF      /* Cards, modals, sheets */

--color-text-primary:       #000000      /* Names, headings */
--color-text-secondary:     #707579      /* Timestamps, subtitles, preview text */
--color-text-tertiary:      #AAAAAA      /* Placeholder, disabled */
--color-text-link:          #2AABEE      /* Inline links */
--color-text-accent:        #2AABEE      /* Active tab label */

--color-accent:             #2AABEE      /* Buttons, active states, badges */
--color-accent-pressed:     #1A8DC7      /* Pressed button */
--color-accent-subtle:      #E8F4FE      /* Selected filter chip background */

--color-divider:            #E7E7E7      /* List separators */

--color-icon-active:        #2AABEE      /* Bottom nav active icon */
--color-icon-inactive:      #AAAAAA      /* Bottom nav inactive icon */

--color-badge-bg:           #2AABEE      /* Unread count badge */
--color-badge-text:         #FFFFFF

--color-missed-call:        #E53935      /* Missed call arrow */
--color-outgoing-call:      #2AABEE      /* Outgoing call arrow */

--color-online:             #4DB6AC      /* Online dot */
--color-star:               #FAD155      /* Favorite star */

--color-avatar-placeholder: #5BADF0      /* Default avatar background (blue) */
```

---

### 2.3 Semantic Tokens — Dark Mode

```
--color-bg-primary:         #17212B      /* Main app background */
--color-bg-secondary:       #232E3C      /* Surface, cards */
--color-bg-elevated:        #2B5278      /* Elevated elements, outgoing bubbles */

--color-text-primary:       #FFFFFF      /* Names, headings */
--color-text-secondary:     #708499      /* Timestamps, subtitles */
--color-text-tertiary:      #4A5568      /* Disabled, placeholder */
--color-text-link:          #5BBEF5      /* Links (lighter blue for contrast) */
--color-text-accent:        #2AABEE      /* Active tab label */

--color-accent:             #2AABEE      /* Same accent across modes */
--color-accent-pressed:     #1A8DC7
--color-accent-subtle:      #1E2E3D      /* Selected filter chip on dark */

--color-divider:            #0F1923      /* Darker separator */

--color-icon-active:        #2AABEE
--color-icon-inactive:      #708499

--color-badge-bg:           #2AABEE
--color-badge-text:         #FFFFFF

--color-bubble-incoming:    #182533      /* Received message background */
--color-bubble-outgoing:    #2B5278      /* Sent message background */

--color-missed-call:        #E57373      /* Slightly desaturated red for dark */
--color-outgoing-call:      #5BBEF5

--color-online:             #5AC8FA
--color-star:               #FAD155

--color-avatar-placeholder: #4A6F8A      /* Muted avatar placeholder on dark */
```

---

## 3. Typography

### 3.1 Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-headline` | 17sp / 17px | 500 (Medium) | 22px | Screen title in nav bar |
| `text-title` | 16sp / 16px | 500 (Medium) | 20px | Contact/chat name in list |
| `text-body` | 15sp / 15px | 400 (Regular) | 20px | Message preview, body copy |
| `text-caption` | 13sp / 13px | 400 (Regular) | 16px | Timestamp, metadata |
| `text-label` | 12sp / 12px | 500 (Medium) | 16px | Bottom nav label, badge |
| `text-filter` | 14sp / 14px | 500 (Medium) | 18px | Filter chip / tab label |
| `text-section` | 13sp / 13px | 500 (Medium) | 16px | Section header (uppercase) |

### 3.2 Rules

- Letter spacing for section headers: `+0.5px` and `UPPERCASE`
- Names in list: always `text-title`, always **one line**, ellipsis overflow
- Message preview: always `text-body`, 1 line, `color-text-secondary`, ellipsis
- Timestamps: always `text-caption`, `color-text-secondary`, right-aligned
- Do not mix weights within the same list row beyond title + caption

---

## 4. Spacing System

Base unit: **4dp / 4px**

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Micro gaps (icon to label) |
| `space-2` | 8px | Between badge and edge |
| `space-3` | 12px | Avatar to text group |
| `space-4` | 16px | Screen horizontal padding |
| `space-5` | 20px | Section vertical gap |
| `space-6` | 24px | Between major sections |
| `space-8` | 32px | Large structural separation |

### 4.1 List Item Anatomy

```
┌────────────────────────────────────────────────────────────┐
│  16px  [Avatar 54px]  12px  [Name + Preview]  [Timestamp]  16px │
│         ↑                                                   │
│       Top padding: 8px — Bottom padding: 8px               │
│       Total item height: ~72–76px                          │
└────────────────────────────────────────────────────────────┘
```

- Divider left inset: `16 + 54 + 12 = 82px` (starts after avatar)
- Avatar vertical centering: `margin-top: auto; margin-bottom: auto`

---

## 5. Border Radius

| Token | Value | Used On |
|---|---|---|
| `radius-none` | 0px | Dividers, full-bleed images |
| `radius-sm` | 4px | Small badges (single digit) |
| `radius-md` | 8px | Message bubbles (non-corner) |
| `radius-lg` | 12px | Modals, sheets, inline media |
| `radius-xl` | 16px | Action sheets, bottom sheets |
| `radius-pill` | 999px | Filter chips, search bar, bottom nav pill, multi-digit badges |
| `radius-circle` | 50% | Avatars, story rings, online dot, circular buttons |

### Specific Component Radii

| Component | Radius |
|---|---|
| Avatar | 50% (circle) |
| Story ring | 50% (circle with 2.5px gradient border) |
| Online indicator dot | 50% |
| Search bar | 999px (pill) |
| Filter chip (selected/unselected) | 999px (pill) |
| Bottom navigation pill background | 999px (pill) |
| Badge (1 digit) | 50% — size: 20×20px |
| Badge (2+ digits) | 999px — min-width: 20px, height: 20px, padding: 0 5px |
| Chat message bubble | 18px, with 4px on the corner near the tail |
| Bottom sheet / Modal | 16px top corners, 0 bottom corners |
| Card / Panel | 12px |
| Button (primary) | 999px (pill) |

---

## 6. Elevation & Shadows

Telegram uses **flat design** — no heavy shadows. Elevation is expressed through **color layering**, not blur/shadow.

### Light Mode — Elevation Layers

| Level | Background | Usage |
|---|---|---|
| L0 — Base | `#F1F1F4` | Page background, behind lists |
| L1 — Surface | `#FFFFFF` | Lists, cards, chat rows |
| L2 — Overlay | `#FFFFFF` + `0.5px border #E7E7E7` | Bottom sheets, dialogs |
| L3 — Float | `#FFFFFF` + subtle `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` | Context menus, tooltips |

### Dark Mode — Elevation Layers

| Level | Background | Usage |
|---|---|---|
| L0 — Base | `#17212B` | Page background |
| L1 — Surface | `#232E3C` | Lists, sidebar, panels |
| L2 — Elevated | `#2B5278` | Outgoing bubbles, selected row |
| L3 — Float | `#2B5278` + subtle border | Context menus, action sheets |

> **Rule:** In dark mode, **lighter surface = closer to the user** (follows Material Design elevation model). Never add drop-shadows on top of dark surfaces — use a lighter background color instead.

---

## 7. Iconography

- Style: **Outline** (2px stroke), rounded line caps
- Size: `24dp` for navigation and actions; `20dp` for inline; `16dp` for badges/status
- Color (active): `--color-accent` (`#2AABEE`)
- Color (inactive): `--color-icon-inactive` (`#AAAAAA` light / `#708499` dark)
- Icon library reference: Tabler Icons (closest match to Telegram style)

### Common Icons

| Icon | Tabler Name | Usage |
|---|---|---|
| Chats | `ti-message-2` | Bottom nav |
| Contacts | `ti-user` | Bottom nav |
| Calls | `ti-phone` | Bottom nav |
| Profile | `ti-user-circle` | Bottom nav |
| Search | `ti-search` | Search bar |
| More (⋮) | `ti-dots-vertical` | Top bar |
| Outgoing call | `ti-arrow-up-right` | Call log |
| Incoming call | `ti-arrow-down-left` | Call log |
| Missed call | `ti-arrow-down-left` (red) | Call log |
| Muted | `ti-bell-off` | Muted chat |
| Pinned | `ti-pin` | Pinned indicator |
| Star / Favorite | `ti-star-filled` (gold) | Starred contact |
| Double check | `ti-checks` | Delivered/read |
| Online dot | Circle `8dp` | Presence indicator |

---

## 8. Components

### 8.1 Avatar

```
Size: 54 × 54dp
Shape: circle (border-radius: 50%)
Fallback: 1–2 initials, centered
Fallback bg: --color-avatar-placeholder (#5BADF0 light / #4A6F8A dark)
Fallback text: #FFFFFF, 20sp, weight 500
```

**Story Ring (active story):**
```
Ring width: 2.5px
Ring gap (between ring and avatar): 2px white gap
Ring color (light): linear-gradient(45deg, #2AABEE, #29B6F6)
Ring color (dark): same gradient
```

**Online Indicator:**
```
Size: 12 × 12dp
Position: bottom-right of avatar (offset: -1dp)
Background: --color-online (#4DB6AC light / #5AC8FA dark)
Border: 2px solid --color-bg-primary (to "cut out" from avatar)
```

---

### 8.2 List Item (Chat / Call Row)

```
Height: 72–76dp
Padding: 8dp top/bottom, 16dp left/right
Layout: horizontal flex, align-center
```

**Anatomy (left to right):**
```
[Avatar 54dp] → gap 12dp → [Text Column flex:1] → gap 8dp → [Meta Column]
```

**Text Column:**
```
Row 1: Name (text-title, text-primary) + optional badge icon (star, mute)
Row 2: Preview text (text-body, text-secondary), 1 line, ellipsis
```

**Meta Column (right-aligned):**
```
Row 1: Timestamp (text-caption, text-secondary)
Row 2: Unread badge OR delivery icon (double check / muted icon)
```

**Divider:**
```
Height: 0.5px
Color: --color-divider
Left inset: 82px (avatar width + left padding + gap)
Right: 0
```

---

### 8.3 Filter Chips / Tabs

```
Height: 34dp
Padding: 0 16dp
Border-radius: 999px (pill)
Font: text-filter (14sp, weight 500)
```

**States:**

| State | Background | Text color | Border |
|---|---|---|---|
| Default | transparent | `--color-text-secondary` | none |
| Selected (light) | `#E8F4FE` | `#2AABEE` | none |
| Selected (dark) | `#1E2E3D` | `#2AABEE` | none |
| Hover | `--color-bg-secondary` | `--color-text-primary` | none |

**Scrollable:** Filter tabs scroll horizontally. No visible scrollbar. Left/right fade mask of 24dp on edges.

---

### 8.4 Search Bar

```
Height: 40dp
Border-radius: 999px (pill)
Background: --color-bg-secondary
Padding: 0 16dp
Icon: ti-search, 18dp, color: --color-text-tertiary, left 12dp
Font: text-body (15sp), color: --color-text-tertiary (placeholder)
```

**Focus state:**
```
No visible border change
Keyboard slides up / cancel button appears on the right
Cursor: --color-accent
```

---

### 8.5 Bottom Navigation Bar

```
Height: 56dp + bottom safe area inset
Background: --color-bg-elevated
Top border: 0.5px solid --color-divider
```

**Active Tab Pill:**
```
Width: auto (wraps icon + optional label)
Min-width: 64dp
Height: 32dp
Border-radius: 999px (pill)
Background: --color-accent-subtle (#E8F4FE light / #1E2E3D dark)
```

**Tab Item:**
```
Icon: 24dp
Label: text-label (12sp, 500)
Gap (icon to label): 4dp
Active color: --color-accent (#2AABEE)
Inactive color: --color-icon-inactive
Unread badge: positioned top-right of icon
```

---

### 8.6 Unread Badge

```
Min-size: 20 × 20dp
Border-radius: 999px (pill if > 1 digit, else 50%)
Background: --color-badge-bg (#2AABEE)
Text: text-label (12sp, 500), #FFFFFF
Padding: 0 5dp (when 2+ digits)
```

**Muted chat badge:**
```
Background: --color-text-tertiary (#AAAAAA light / #708499 dark)
Same shape and size
```

---

### 8.7 Message Bubble

```
Max-width: 75% of screen width
Border-radius: 18dp (all corners), 4dp on the "tail" corner
Padding: 8dp 12dp
Font: text-body (15sp)
```

| Property | Incoming | Outgoing |
|---|---|---|
| Background (light) | `#FFFFFF` | `#DCFCE7` (greenish) or `#E8F4FE` |
| Background (dark) | `#182533` | `#2B5278` |
| Text color | `--color-text-primary` | `--color-text-primary` |
| Timestamp color | `--color-text-secondary` | `--color-text-secondary` |
| Alignment | left | right |
| Tail | bottom-left | bottom-right |

---

### 8.8 Story Ring Gradient (Active Story)

```css
/* Telegram-style animated story ring */
background: conic-gradient(
  from 0deg,
  #2AABEE 0%,
  #29B6F6 40%,
  #26C6DA 70%,
  #2AABEE 100%
);
border-radius: 50%;
padding: 2.5px;          /* This creates the ring width */
```

**Unseen story:** full gradient ring  
**Seen story:** `--color-divider` solid ring  
**Live story:** gradient ring + `LIVE` pill badge at bottom of avatar

---

### 8.9 Section / Folder Tab (e.g., "WORK")

```
Text: custom bold font style, uppercase, blue (#2AABEE)
Unread dot: 18dp circle, --color-accent, white text
Separator from other tabs: invisible — relies on scroll position
```

---

## 9. Motion & Animation

| Action | Duration | Easing |
|---|---|---|
| Tab switch | 200ms | `ease-out` |
| Bottom sheet open | 350ms | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Bottom sheet dismiss | 280ms | `cubic-bezier(0.5, 0, 0.75, 0)` |
| Row appear (new message) | 200ms | `ease-in-out` |
| Badge count update | 150ms | `ease` |
| Story ring tap | 100ms scale to 0.95 | `ease-out` |
| Theme toggle (light↔dark) | 300ms | `ease-in-out` on bg + text colors |

**Principle:** Motion should feel responsive, never sluggish. Prefer shorter durations (150–350ms). No bouncing or spring effects — clean, linear-ease curves only.

---

## 10. Accessibility

- Minimum contrast ratio: **4.5:1** for body text (WCAG AA)
- Primary text on white: `#000000` → ratio ~21:1 ✅
- Secondary text on white: `#707579` → ratio ~4.7:1 ✅
- White text on accent blue (`#2AABEE`): ratio ~3.1:1 — use for large text/icons only
- All interactive elements: minimum touch target **48 × 48dp**
- Focus indicator: `2px solid #2AABEE` outline with `2px offset`
- Do not rely on color alone — pair status icons with text labels

---

## 11. CSS Variables (Ready to Use)

```css
:root {
  /* Accent */
  --tg-accent:              #2AABEE;
  --tg-accent-pressed:      #1A8DC7;
  --tg-accent-subtle:       #E8F4FE;

  /* Backgrounds */
  --tg-bg:                  #FFFFFF;
  --tg-bg-secondary:        #F1F1F4;
  --tg-bg-elevated:         #FFFFFF;

  /* Text */
  --tg-text-primary:        #000000;
  --tg-text-secondary:      #707579;
  --tg-text-tertiary:       #AAAAAA;

  /* Borders */
  --tg-divider:             #E7E7E7;

  /* Status */
  --tg-online:              #4DB6AC;
  --tg-star:                #FAD155;
  --tg-missed:              #E53935;
  --tg-muted:               #AAAAAA;

  /* Badge */
  --tg-badge-bg:            #2AABEE;
  --tg-badge-text:          #FFFFFF;

  /* Typography */
  --tg-font:                -apple-system, BlinkMacSystemFont, "Roboto", "Segoe UI", sans-serif;
  --tg-font-size-headline:  17px;
  --tg-font-size-title:     16px;
  --tg-font-size-body:      15px;
  --tg-font-size-caption:   13px;
  --tg-font-size-label:     12px;

  /* Radius */
  --tg-radius-pill:         999px;
  --tg-radius-circle:       50%;
  --tg-radius-bubble:       18px;
  --tg-radius-card:         12px;

  /* Spacing */
  --tg-space-screen-h:      16px;
  --tg-avatar-size:         54px;
  --tg-list-height:         72px;
  --tg-bottom-nav-height:   56px;
  --tg-search-height:       40px;
  --tg-chip-height:         34px;
}

[data-theme="dark"] {
  --tg-accent:              #2AABEE;
  --tg-accent-subtle:       #1E2E3D;

  --tg-bg:                  #17212B;
  --tg-bg-secondary:        #232E3C;
  --tg-bg-elevated:         #2B5278;

  --tg-text-primary:        #FFFFFF;
  --tg-text-secondary:      #708499;
  --tg-text-tertiary:       #4A5568;

  --tg-divider:             #0F1923;

  --tg-online:              #5AC8FA;
  --tg-missed:              #E57373;
  --tg-muted:               #708499;
}
```

---

## 12. Do's and Don'ts

### ✅ Do

- Use `#2AABEE` as the one and only accent color across the whole app
- Keep avatar shapes always circular
- Use pill-shaped filter chips and search bars
- Keep list item height consistent at 72–76dp
- Left-inset dividers to align with text (not the avatar)
- Use `text-secondary` for timestamps and preview text
- Animate theme transitions (don't hard-cut)
- Use the lighter surface color for elevated elements in dark mode

### ❌ Don't

- Don't use multiple accent colors (no green buttons, orange badges)
- Don't add heavy drop shadows — express elevation through surface color
- Don't change border radius for avatars (always circle)
- Don't use font weights above 500 (no bold/700)
- Don't use colored backgrounds on the outermost screen container
- Don't rely on color alone for status (pair icon + color)
- Don't truncate contact names with more than 1 line of ellipsis
- Don't place the divider flush to the left screen edge (always inset)
