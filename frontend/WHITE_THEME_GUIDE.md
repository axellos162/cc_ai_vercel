# White Theme Design Guide

## Core Principles

### 1. **Pure White Foundation**
```css
background: #FFFFFF;
```
- No off-whites, no cream tones
- Clean, gallery-like environment
- Products and content are the stars

### 2. **High-Contrast Typography**
```css
Primary text:   #000000 (pure black)
Secondary text: #666666 (medium gray)
Tertiary text:  #999999 (light gray)
```
- Maximum readability
- Clear information hierarchy
- Editorial sophistication

### 3. **Minimal Borders**
```css
Subtle:  #E8E8E8 (barely visible)
Default: #D4D4D4 (definition without heaviness)
Strong:  #A0A0A0 (clear separation)
```
- Thin lines (1px standard)
- No border radius (sharp, editorial)
- Used sparingly for definition

### 4. **Refined Accent**
```css
Accent:        #8B7355 (muted brown)
Accent Hover:  #6B5335 (darker brown)
```
- Subtle, sophisticated
- Doesn't compete with product imagery
- Warm without being loud

## Component Patterns

### Product Cards
```jsx
<Card style={{
  background: 'var(--color-bg-surface)',    // Pure white
  border: '1px solid transparent',           // No border until hover
  boxShadow: 'none'                          // Clean, flat
}}>

  // On hover
  background: 'var(--color-bg-elevated)'    // #FAFAFA (barely tinted)
  border: '1px solid var(--color-border-default)' // Subtle definition
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'  // Gentle lift
</Card>
```

### Input Fields
```jsx
<Input style={{
  background: 'var(--color-bg-elevated)',   // #FAFAFA
  border: '1px solid var(--color-border-default)',

  // On focus
  borderColor: 'var(--color-border-accent)', // Brown accent
  boxShadow: '0 0 0 1px rgba(139,115,85,0.2)' // Subtle glow
}} />
```

### Buttons
```jsx
// Primary
<Button style={{
  background: 'transparent',
  border: '1px solid var(--color-border-default)',
  color: 'var(--color-text-secondary)',

  // On hover
  borderColor: 'var(--color-text-accent)',
  color: 'var(--color-text-accent)',
  transform: 'translateY(-1px)'             // Subtle lift
}} />

// Minimal
<Button style={{
  background: 'none',
  border: 'none',
  color: 'var(--color-text-tertiary)',

  // On hover
  color: 'var(--color-text-primary)'
}} />
```

### Modal Overlays
```jsx
<Overlay style={{
  background: 'rgba(0,0,0,0.4)',            // Light backdrop
  backdropFilter: 'blur(12px)'              // Heavy blur for depth
}}>
  <Modal style={{
    background: 'var(--color-bg-base)',     // Pure white
    border: '1px solid var(--color-border-default)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)' // Subtle shadow
  }} />
</Overlay>
```

## Shadows

### Light Theme Shadow System
```css
/* Subtle - cards, buttons */
box-shadow: 0 4px 16px rgba(0,0,0,0.08);

/* Medium - modals, dropdowns */
box-shadow: 0 8px 24px rgba(0,0,0,0.12);

/* Strong - overlays, important elements */
box-shadow: 0 24px 48px rgba(0,0,0,0.15);
```

**Key principle**: Shadows are subtle and refined. No harsh black shadows - always use low opacity (8-15%).

## Color Usage Guidelines

### Do's ✅
- Use pure white (#FFFFFF) for main backgrounds
- Use black (#000000) for primary text
- Keep borders thin and minimal
- Use accent brown sparingly (CTA, focus states, active states)
- Add subtle texture overlay for depth
- Use light shadows for elevation

### Don'ts ❌
- Don't use off-white or cream (#F9F9F9, #FAFAF8) as base - only as hover states
- Don't use heavy shadows - keep under 15% opacity
- Don't overuse the accent color - it should guide, not dominate
- Don't add unnecessary borders - let whitespace define sections
- Don't use border radius - keep sharp, editorial corners

## Specific Use Cases

### Product Pricing
```css
Regular price:    #666666 (secondary text)
Crossed-out:      #999999 (tertiary text) + line-through
Sale price:       #8B7355 (accent brown)
Sale badge:       #F8F4EE background + #8B7355 text
```

### Status Indicators
```css
Loading:          #999999 (tertiary) → #8B7355 (accent) pulse
Success:          #8B7355 (subtle brown, not green)
Error:            Keep minimal - use text only
Hover:            Black text → Brown text transition
```

### Interactive States
```css
Rest:             Secondary color (#666666)
Hover:            Accent color (#8B7355)
Active:           Darker accent (#6B5335)
Disabled:         Tertiary color (#999999) + 50% opacity
```

## Typography Scale

```css
Mega:     72px - Hero titles
H1:       48px - Page titles
H2:       36px - Section headers
H3:       24px - Subsection headers
Body:     14px - Main content
Small:    12px - Metadata
Micro:    11px - Labels, hints
Tiny:     9-10px - Technical info
```

All with generous line-height (1.4-1.6) and careful letter-spacing.

## Spacing Rhythm

```css
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   48px
--space-2xl:  64px
```

Use consistently throughout for visual harmony.

## Animation Principles

### Timing
```css
Fast:     240ms - Small UI changes
Medium:   480ms - Page transitions
Slow:     600ms - Dramatic reveals
```

### Easing
```css
Standard:  cubic-bezier(0.4, 0.0, 0.2, 1) - Most transitions
Spring:    cubic-bezier(0.34, 1.56, 0.64, 1) - Playful interactions
```

### What to Animate
- ✅ Opacity, transform (translate, scale)
- ✅ Border color, text color
- ✅ Box shadow (subtle)
- ❌ Width, height (use transform: scale)
- ❌ Background color changes (too jarring)

## Accessibility Standards

### Contrast Ratios (WCAG)
- Primary text on white: 21:1 (AAA) ✅
- Secondary text on white: 5.74:1 (AA) ✅
- Tertiary text on white: 2.85:1 (Use for non-essential) ⚠️
- Accent on white: 4.58:1 (AA) ✅

### Focus Indicators
Always visible, always 2px, always accent color:
```css
outline: 2px solid var(--color-border-accent);
outline-offset: 2px;
```

## When to Use Which Background

```
Pure White (#FFFFFF)
├─ Page base
├─ Cards (rest state)
├─ Modals
└─ Sidebars

Barely Off-White (#FAFAFA)
├─ Input fields
├─ Cards (hover state)
└─ Subtle section backgrounds

Light Gray (#F5F5F5)
├─ Disabled states
└─ Overlay backgrounds

Very Light Gray (#F8F8F8)
└─ Sale badge backgrounds only
```

## Mobile Considerations

On mobile (< 768px):
- Increase touch targets (min 44px)
- Simplify shadows (remove or reduce)
- Maintain contrast ratios
- Preserve whitespace rhythm
- Stack cards vertically with subtle dividers

## Implementation Checklist

When adding new components:
- [ ] Uses pure white base
- [ ] Text has sufficient contrast
- [ ] Borders are thin (1px) and minimal
- [ ] Shadows are subtle (< 15% opacity)
- [ ] Accent color used sparingly
- [ ] No border radius
- [ ] Hover states defined
- [ ] Focus states accessible
- [ ] Works on mobile
- [ ] Matches SSENSE aesthetic

---

**Remember**: Less is more. The goal is refined minimalism that elevates the products, not decorates the interface.
