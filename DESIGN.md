# Design

## Color

**Strategy**: Restrained. One accent at ≤10% surface coverage; tinted neutrals carry everything else.

**Accent: Amber-copper**
Not the SaaS default (indigo/purple). Not aggressive neon. Reads as warm mechanical precision — appropriate for an automotive tool without feeling automotive-themed. Used only at decision points.

| Token            | Light                      | Dark                       |
|------------------|----------------------------|----------------------------|
| accent-50        | `#fffbeb`                  | `#fffbeb`                  |
| accent-100       | `#fef3c7`                  | `#fef3c7`                  |
| accent-300       | `#fcd34d`                  | `#fcd34d`                  |
| accent-400       | `#fbbf24`                  | `#fbbf24`                  |
| accent-500       | `#f59e0b`                  | `#f59e0b`                  |
| accent-600       | `#d97706`                  | `#d97706`                  |
| accent-700       | `#b45309`                  | `#b45309`                  |

**Light mode (default)**

Warm whites with barely perceptible amber undertone. Not cream. Not cold blue-gray.

| Token        | Value        | Notes                                  |
|--------------|--------------|----------------------------------------|
| bg           | `#f5f4f0`    | Warm off-white, clearly lighter than sidebar |
| bg-sidebar   | `#edecea`    | Warmer sidebar, differentiated without a border |
| bg-shell     | `#faf9f7`    | Main content frame                     |
| card         | `#ffffff`    | Elevated surface, true white           |
| card-elev    | `#faf9f7`    | Nested surface                         |
| border       | `rgba(30,25,15,0.10)` | Warm-tinted border            |
| border-strong| `rgba(30,25,15,0.18)` | Stronger border               |
| text         | `#1a1714`    | Near-black, warm-tinted                |
| text-muted   | `#5c5650`    | Medium warm gray                       |
| text-dim     | `#8a8278`    | Dimmer                                 |
| text-faint   | `#b5aea6`    | Faintest                               |

**Dark mode**

Deep graphite with cool blue-gray undertone (macOS dark quality, not pitch black). Text is slightly warm-white, not pure white.

| Token        | Value        | Notes                                  |
|--------------|--------------|----------------------------------------|
| bg           | `#0d1117`    | Deep graphite, GitHub dark reference   |
| bg-sidebar   | `#090e13`    | Slightly darker to differentiate       |
| bg-shell     | `#111720`    | Shell frame                            |
| card         | `#161c27`    | Card surface                           |
| card-elev    | `#1c2333`    | Elevated card                          |
| border       | `rgba(255,255,255,0.07)` | Subtle                     |
| border-strong| `rgba(255,255,255,0.12)` | Strong                     |
| text         | `#f0ede8`    | Slightly warm white (not pure)         |
| text-muted   | `#8d95a6`    | Cool medium gray                       |
| text-dim     | `#5a6278`    | Dimmer                                 |
| text-faint   | `#3d4457`    | Faintest                               |

**Semantic colors**

| Token   | Light          | Dark           |
|---------|----------------|----------------|
| ok      | `#16a34a`      | `#34d399`      |
| warn    | `#d97706`      | `#fbbf24`      |
| danger  | `#dc2626`      | `#f87171`      |
| info    | `#2563eb`      | `#60a5fa`      |

## Typography

**Family**: Inter for UI, JetBrains Mono for numbers and code.

**Hierarchy rule**: scale + weight contrast (ratio ≥1.2 between adjacent steps). Never more than three size levels in one card.

| Step     | Size    | Weight | Tracking       | Use                    |
|----------|---------|--------|----------------|------------------------|
| eyebrow  | 10.5px  | 600    | +0.1em         | Section labels, badges |
| sm       | 12px    | 400–500| —              | Captions, timestamps   |
| base     | 13.5px  | 400    | —              | Body, table cells      |
| md       | 15px    | 500–600| —              | Subheadings, card titles|
| lg       | 18px    | 600    | -0.01em        | Section headings        |
| xl       | 22px    | 700    | -0.02em        | Page titles             |
| 2xl      | 28px    | 700    | -0.025em       | Dashboard headline      |

## Spacing

Base unit: 4px. Cards use varied padding for rhythm — not everything gets 22px.

- Tight: 4–8px (between icon and label, between stacked lines)
- Content: 12–16px (within a card section)
- Card: 20–24px (card padding)
- Section: 28–40px (between major page sections)

## Radius

- sm: 8px — badges, inline chips
- md: 12px — inputs, smaller cards
- lg: 16px — standard cards
- xl: 20–24px — panels, modals
- full: 999px — pills, avatars

## Elevation

Light mode: shadow-based, no gradient overlays on cards.
- Level 1 (card): `0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(30,25,15,0.10)`
- Level 2 (elevated): `0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(30,25,15,0.12)`
- Level 3 (modal): `0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(30,25,15,0.14)`

Dark mode: inset top-light line + ambient shadow.
- Level 1: `0 0 0 1px rgba(255,255,255,0.07), 0 1px 0 rgba(255,255,255,0.04) inset`
- Level 2: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)`

## Components

**Nav active state**: Background tint (accent-50 light / dark accent tint) + accent-colored text. No gradient background. No glow shadow. No side-stripe border.

**Primary button**: Solid accent-500 fill. No gradient. Hover: accent-600 + translateY(-1px). Active shadow only on hover, not at rest.

**Cards**: No `::before` shine overlay. Elevation through shadow only.

**Brand mark**: Solid accent-500. No gradient.

**KPI strip**: Replaces hero-metric template. Horizontal row of equal-weight statistics. Each stat: small uppercase label above, medium-weight value below. Separated by 1px dividers. No big centered hero number.

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` on all transitions
- Duration: 140ms micro, 240ms standard, 300ms macro
- No spring, bounce, or elastic
- `prefers-reduced-motion`: disable all non-essential motion
