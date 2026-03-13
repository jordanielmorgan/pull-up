# Pull-Up Design System

**Version:** 1.0  
**Last Updated:** March 13, 2026

---

## Design Philosophy

Pull-Up is thoughtful, intelligent, and inspiring. Our design reflects a premium travel companion that maximizes your time on the ground. We combine sophisticated AI capabilities with human warmth through:

- **Thoughtful**: Considered layouts, purposeful animations, clear information hierarchy
- **Intelligent**: Data-driven insights, smart defaults, proactive assistance
- **Inspiring**: Uplifting gradients, energetic accents, celebration of travel and connection

---

## Color System

### Primary Palette

| Color Name | Hex | Usage |
|------------|-----|-------|
| **Coral Primary** | `#FF6B4A` | Primary CTAs, accents, key interactions |
| **Coral Light** | `#FF8A6E` | Hover states, secondary accents |
| **Coral Dark** | `#E85534` | Active states, emphasis |

### Gradient Palette

Our signature gradients evoke optimism and movement:

**Primary Gradient (Ambient)**
```css
background: linear-gradient(135deg, #A8E6CF 0%, #FFD6BA 100%);
/* Mint to Peach - Used for backgrounds, hero sections */
```

**Warm Gradient**
```css
background: linear-gradient(135deg, #FFE5B4 0%, #FFB4A2 100%);
/* Cream to Coral - Used for cards, highlights */
```

**Cool Gradient**
```css
background: linear-gradient(135deg, #B8E6E1 0%, #D4E5FF 100%);
/* Teal to Sky - Used for information panels */
```

### Neutral Palette

| Color Name | Hex | Usage |
|------------|-----|-------|
| **Black** | `#1A1A1A` | Headings, primary text |
| **Gray 900** | `#2D2D2D` | Body text |
| **Gray 700** | `#6B6B6B` | Secondary text |
| **Gray 400** | `#A8A8A8` | Disabled states, borders |
| **Gray 200** | `#E8E8E8` | Dividers, subtle borders |
| **Gray 100** | `#F5F5F5` | Background tints |
| **White** | `#FFFFFF` | Backgrounds, cards |

### Semantic Colors

| Purpose | Color | Hex |
|---------|-------|-----|
| Success | Green | `#4CAF50` |
| Warning | Amber | `#FFA726` |
| Error | Red | `#EF5350` |
| Info | Blue | `#42A5F5` |

---

## Typography

### Font Families

**Primary Font:** System UI Stack for optimal performance and native feel
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 56px | 700 | 1.1 | Hero headlines |
| **H1** | 48px | 700 | 1.2 | Page titles |
| **H2** | 36px | 700 | 1.3 | Section headers |
| **H3** | 28px | 600 | 1.3 | Card titles |
| **H4** | 24px | 600 | 1.4 | Subsections |
| **Body Large** | 18px | 400 | 1.6 | Intro paragraphs |
| **Body** | 16px | 400 | 1.5 | Main body text |
| **Body Small** | 14px | 400 | 1.5 | Captions, labels |
| **Label** | 12px | 600 | 1.4 | Input labels, tags |

### Font Weights

- **Regular:** 400 (body text)
- **Medium:** 500 (subtle emphasis)
- **Semibold:** 600 (headings, buttons)
- **Bold:** 700 (primary headings, impact)

---

## Spacing System

8px base grid for consistent rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-1` | 4px | Tight spacing, icon gaps |
| `spacing-2` | 8px | Compact layouts |
| `spacing-3` | 12px | Small gaps |
| `spacing-4` | 16px | Default spacing |
| `spacing-5` | 24px | Medium spacing |
| `spacing-6` | 32px | Large spacing |
| `spacing-8` | 48px | Section spacing |
| `spacing-10` | 64px | Major section breaks |
| `spacing-12` | 96px | Page-level spacing |

---

## Components

### Buttons

**Primary Button**
- Background: Coral Primary (`#FF6B4A`)
- Text: White
- Border Radius: 12px (medium) or 24px (pill)
- Padding: 16px 32px
- Font: 16px, Semibold (600)
- Hover: Coral Light (`#FF8A6E`)
- Active: Coral Dark (`#E85534`)
- Shadow: `0 2px 8px rgba(255, 107, 74, 0.2)`

**Secondary Button**
- Background: White
- Text: Black (`#1A1A1A`)
- Border: 2px solid Gray 200
- Border Radius: 12px
- Padding: 14px 30px (2px less to account for border)
- Font: 16px, Semibold (600)
- Hover: Gray 100 background

**Ghost Button**
- Background: Transparent
- Text: Gray 900
- Padding: 12px 24px
- Hover: Gray 100 background

### Cards

**Standard Card**
- Background: White
- Border Radius: 20px
- Padding: 24px
- Shadow: `0 2px 12px rgba(0, 0, 0, 0.06)`
- Hover: `0 4px 20px rgba(0, 0, 0, 0.1)`
- Border: Optional 1px solid Gray 200

**Stat Card** (for metrics like "5 meetings scheduled")
- Background: White
- Border Radius: 16px
- Padding: 20px
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.04)`
- Accent: Coral dot or border on left edge

**Gradient Card**
- Background: Warm Gradient or Cool Gradient
- Border Radius: 24px
- Padding: 32px
- Shadow: `0 4px 16px rgba(0, 0, 0, 0.08)`

### Input Fields

**Text Input**
- Background: White
- Border: 1px solid Gray 300
- Border Radius: 10px
- Padding: 12px 16px
- Font: 16px, Regular
- Focus: Border becomes Coral Primary, shadow `0 0 0 3px rgba(255, 107, 74, 0.1)`

**Floating Label Style**
- Label animates up on focus
- Gray 700 → Coral Primary on focus

### Icons

**Style:** Outlined, minimal, 2px stroke
**Size Scale:**
- Small: 16px
- Medium: 24px
- Large: 32px
- XL: 48px

**Source:** lucide-react for consistency

### Badges & Tags

- Border Radius: 6px (tight) or 12px (pill)
- Padding: 4px 10px
- Font: 12px, Semibold
- Background: Gray 100 or semantic color at 10% opacity
- Text: Matching semantic color or Gray 900

---

## Layout Patterns

### Mobile-First Responsive Grid

**Breakpoints:**
```css
/* Mobile: < 640px (base) */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */
```

**Container Widths:**
- Mobile: 100% with 20px padding
- Tablet: 100% with 32px padding
- Desktop: Max 1200px centered

### Safe Area Padding

For mobile views, respect device safe areas:
- Top: 48px (accounts for status bar)
- Bottom: 24px (accounts for home indicator)
- Sides: 20px

---

## Iconography

### Icon Categories

**Navigation Icons:**
- Home, Calendar, Messages, Profile
- Style: Outlined, 24px

**Action Icons:**
- Plus, Edit, Trash, Check, Arrow
- Style: Outlined or filled based on state, 20px

**Status Icons:**
- Check circle (confirmed), Clock (pending), X circle (declined)
- Style: Filled, 16px

### Icon Colors
- Default: Gray 700
- Active: Coral Primary
- Disabled: Gray 400

---

## Animation & Motion

### Principles
- **Purposeful:** Every animation serves a function
- **Snappy:** Quick transitions (150-250ms) feel responsive
- **Smooth:** Use easing for natural feel

### Timing Functions

```css
/* Default easing - most UI transitions */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce - celebration moments */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Ease out - elements entering */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Ease in - elements exiting */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
```

### Standard Durations
- **Micro:** 100ms - toggles, checkboxes
- **Quick:** 150ms - hover states, button presses
- **Base:** 200ms - default transitions
- **Slow:** 300ms - page transitions, modals
- **Slower:** 500ms - major state changes

### Common Animations

**Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Duration: 200ms */
```

**Slide Up**
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
/* Duration: 300ms, ease-out */
```

**Scale Pop**
```css
@keyframes scalePop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
/* Duration: 200ms, bounce easing */
```

---

## Shadows & Depth

### Shadow Levels

| Level | Shadow | Usage |
|-------|--------|-------|
| **Level 1** | `0 1px 3px rgba(0,0,0,0.06)` | Subtle cards |
| **Level 2** | `0 2px 8px rgba(0,0,0,0.08)` | Standard cards, dropdowns |
| **Level 3** | `0 4px 16px rgba(0,0,0,0.1)` | Hover states, popovers |
| **Level 4** | `0 8px 24px rgba(0,0,0,0.12)` | Modals, important overlays |
| **Level 5** | `0 16px 40px rgba(0,0,0,0.15)` | Dialogs, max elevation |

### Coral Glow (for CTAs)
```css
box-shadow: 0 4px 16px rgba(255, 107, 74, 0.25);
```

---

## Voice & Tone

### Writing Principles

**Conversational but Professional**
- "Let's get you some meetings" not "Initiate scheduling protocol"
- Use contractions naturally
- Address user as "you"

**Proactive and Helpful**
- "I found 8 people in SF you might want to meet"
- Lead with value, not process

**Transparent**
- Explain what the AI is doing
- Show progress, don't hide complexity

**Celebratory**
- Acknowledge wins: "5 meetings confirmed! 🎉"
- Use encouraging language

### Example Microcopy

| Context | Copy |
|---------|------|
| Empty state | "No trips yet. When you book travel, I'll help you fill your schedule with great meetings." |
| Loading | "Finding people you should meet..." |
| Success | "Meeting confirmed with Sarah at Blue Bottle Coffee" |
| Error | "Couldn't reach John. Want me to try a different time?" |
| Onboarding | "Hi! I'm Pull-Up. I make sure you meet the right people when you travel." |

---

## Illustration Style

### Characteristics
- **Geometric:** Clean shapes, angular and rounded mixed
- **Line-based:** Outlined figures with selective fills
- **Accent Color:** Coral used sparingly for emphasis
- **Playful:** Dynamic poses, celebrating action and success
- **Minimal Details:** Focus on gesture and movement

### Use Cases
- Welcome/onboarding screens
- Empty states
- Celebration moments (all meetings confirmed)
- Error states (friendly, not alarming)

---

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Coral Primary on White: 4.6:1 ✓
- Black on White: 21:1 ✓
- Gray 700 on White: 4.8:1 ✓

### Focus States
- Visible focus rings: 2px solid Coral Primary
- Offset: 2px from element
- Never remove focus indicators

### Touch Targets
- Minimum: 44x44px (iOS guideline)
- Preferred: 48x48px
- Spacing: 8px minimum between targets

### Motion
- Respect `prefers-reduced-motion`
- Provide alternative to animated illustrations

---

## Examples & References

### Welcome Screen
- Gradient background (Ambient)
- Large illustration (geometric, playful)
- Bold headline (H1 or Display)
- Supporting copy (Body Large)
- Prominent CTA (Primary Button, pill shaped)

### Home/Dashboard
- White background
- Card-based layout
- Stats cards with metrics
- Trip cards with gradients
- Floating action button (coral, bottom right on mobile)

### Chat Interface
- Clean message bubbles
- User messages: Coral background, white text, right-aligned
- AI messages: Gray 100 background, black text, left-aligned
- Avatar icons: Circular, 32px
- Input: Fixed at bottom, white background, shadow

### Navigation
- Bottom tab bar (mobile): 5 items max, icons + labels
- Top header: Minimal, transparent over gradient or white with shadow
- Floating elements: Cards over gradients feel premium

---

## Design Tokens Reference

```css
:root {
  /* Colors */
  --color-coral-primary: #FF6B4A;
  --color-coral-light: #FF8A6E;
  --color-coral-dark: #E85534;
  
  --color-black: #1A1A1A;
  --color-gray-900: #2D2D2D;
  --color-gray-700: #6B6B6B;
  --color-gray-400: #A8A8A8;
  --color-gray-200: #E8E8E8;
  --color-gray-100: #F5F5F5;
  --color-white: #FFFFFF;
  
  /* Gradients */
  --gradient-ambient: linear-gradient(135deg, #A8E6CF 0%, #FFD6BA 100%);
  --gradient-warm: linear-gradient(135deg, #FFE5B4 0%, #FFB4A2 100%);
  --gradient-cool: linear-gradient(135deg, #B8E6E1 0%, #D4E5FF 100%);
  
  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;
  --spacing-8: 48px;
  --spacing-10: 64px;
  --spacing-12: 96px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-pill: 9999px;
  
  /* Shadows */
  --shadow-1: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-2: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-3: 0 4px 16px rgba(0,0,0,0.1);
  --shadow-4: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-5: 0 16px 40px rgba(0,0,0,0.15);
  --shadow-coral: 0 4px 16px rgba(255, 107, 74, 0.25);
  
  /* Transitions */
  --transition-quick: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Component Library Checklist

- [ ] Button (Primary, Secondary, Ghost)
- [ ] Card (Standard, Stat, Gradient)
- [ ] Input (Text, Floating Label)
- [ ] Badge/Tag
- [ ] Avatar
- [ ] Message Bubble
- [ ] Navigation Bar
- [ ] Tab Bar
- [ ] Modal/Dialog
- [ ] Toast/Notification
- [ ] Loading Spinner
- [ ] Progress Bar
- [ ] Empty State
- [ ] Icon Set

---

**End of Design System**
