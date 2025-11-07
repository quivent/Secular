# Figma Integration Guide

Complete guide for importing Secular GUI design tokens into Figma and maintaining design-development consistency.

---

## Quick Start

1. **Import Design Tokens**: Use `design-tokens.json` with Figma plugins
2. **Create Color Styles**: Map color tokens to Figma styles
3. **Set Up Text Styles**: Configure typography system
4. **Build Components**: Create component library matching code
5. **Sync Regularly**: Keep Figma and code in sync

---

## Step 1: Import Design Tokens

### Option A: Figma Tokens Plugin (Recommended)

**Install:**
1. Open Figma
2. Go to Plugins → Browse Plugins
3. Search "Figma Tokens"
4. Install "Figma Tokens" by Jan Six

**Import:**
1. Open Figma Tokens plugin
2. Click "Load from File"
3. Select `design-tokens.json`
4. Click "Import"
5. Tokens will appear in plugin sidebar

**Sync:**
- Tokens automatically create Figma styles
- Changes propagate to all instances
- Export back to JSON when needed

### Option B: Manual Import

**Color Tokens:**
```javascript
// Copy tokens from design-tokens.json
{
  "colors": {
    "primary": {
      "500": "#0ea5e9"
    }
  }
}

// Create in Figma:
// Styles → Color → New Style
// Name: "Primary/500"
// Value: #0ea5e9
```

**Text Tokens:**
```javascript
{
  "typography": {
    "fontSize": {
      "base": "16px"
    }
  }
}

// Create in Figma:
// Styles → Text → New Style
// Name: "Body/Base"
// Size: 16px
```

---

## Step 2: Create Color Styles

### Primary Colors

Create a color style for each primary shade:

| Figma Style Name | Token | Value |
|------------------|-------|-------|
| Primary/50 | `colors.primary.50` | #f0f9ff |
| Primary/100 | `colors.primary.100` | #e0f2fe |
| Primary/200 | `colors.primary.200` | #bae6fd |
| Primary/300 | `colors.primary.300` | #7dd3fc |
| Primary/400 | `colors.primary.400` | #38bdf8 |
| Primary/500 | `colors.primary.500` | #0ea5e9 |
| Primary/600 | `colors.primary.600` | #0284c7 |
| Primary/700 | `colors.primary.700` | #0369a1 |
| Primary/800 | `colors.primary.800` | #075985 |
| Primary/900 | `colors.primary.900` | #0c4a6e |

### Semantic Colors

| Figma Style Name | Token | Value |
|------------------|-------|-------|
| Semantic/Success | `colors.semantic.success` | rgb(34, 197, 94) |
| Semantic/Warning | `colors.semantic.warning` | rgb(250, 204, 21) |
| Semantic/Error | `colors.semantic.error` | rgb(239, 68, 68) |
| Semantic/Info | `colors.semantic.info` | rgb(59, 130, 246) |
| Semantic/Idle | `colors.semantic.idle` | rgb(107, 114, 128) |

### Glass Effects

**Note**: Figma doesn't support backdrop-filter. Simulate with:
- Fill: White at 5% opacity
- Blur effect: 12px

| Figma Style Name | Opacity | Blur |
|------------------|---------|------|
| Glass/Light | 5% | 12px |
| Glass/Medium | 10% | 12px |
| Glass/Dark | 30% (black) | 12px |

### Text Colors

Create with variable opacity:

| Figma Style Name | Color | Opacity |
|------------------|-------|---------|
| Text/Primary | White | 100% |
| Text/Secondary | White | 80% |
| Text/Tertiary | White | 60% |
| Text/Quaternary | White | 40% |
| Text/Disabled | White | 30% |

---

## Step 3: Set Up Text Styles

### Typography Scale

Create text styles for each token:

| Figma Style Name | Size | Line Height | Weight | Use Case |
|------------------|------|-------------|--------|----------|
| Display/4XL | 36px | 40px | Bold | Hero headings |
| Display/3XL | 30px | 36px | Bold | Page titles |
| Display/2XL | 24px | 32px | Semibold | Section headers |
| Heading/XL | 20px | 28px | Semibold | Subheadings |
| Heading/LG | 18px | 28px | Semibold | Card titles |
| Body/Base | 16px | 24px | Normal | Body text |
| Body/SM | 14px | 20px | Normal | Secondary text |
| Caption/XS | 12px | 16px | Medium | Captions |

### Font Settings

**Primary Font:**
- Family: Inter (or system font)
- Fallback: -apple-system, BlinkMacSystemFont, Segoe UI

**Monospace Font:**
- Family: SF Mono
- Fallback: Monaco, Cascadia Code

### Text Style Details

**Example: Body/Base**
```
Name: Body/Base
Font: Inter
Size: 16px
Line Height: 24px (150%)
Letter Spacing: 0
Weight: Regular (400)
```

**Example: Caption/XS**
```
Name: Caption/XS
Font: Inter
Size: 12px
Line Height: 16px (133%)
Letter Spacing: 0.5px
Weight: Medium (500)
Transform: Uppercase
```

---

## Step 4: Build Component Library

### Button Components

**Primary Button:**
- Frame: 48px height
- Padding: 32px horizontal
- Corner Radius: 16px
- Fill: Linear gradient (Primary/500 → Blue/500)
- Effect: Drop shadow (cyan glow)
- Text: Body/Base, White, Bold

**Variants:**
```
State: Default | Hover | Active | Disabled
Size: Large | Medium | Small
```

**Auto Layout:**
- Horizontal direction
- Gap: 8px
- Padding: 16px 32px
- Align: Center

### Card Components

**Hero Card:**
- Frame: Auto width × Auto height
- Padding: 32px
- Corner Radius: 24px
- Fill: Glass/Medium (5% white + 12px blur)
- Stroke: 1px, Primary/500, 20% opacity
- Effect: Drop shadow (cyan glow, soft)

**Component Properties:**
```
Type: Hero | Standard | Compact
Interactive: Boolean
```

### Studio Control Components

**Parameter Knob:**
- Size: 64px × 64px (md)
- Track: 72px × 72px
- Fill: Glass/Light
- Stroke: 2px, Primary/500
- Effect: Inner shadow + Drop shadow

**Component Properties:**
```
Size: Small (48px) | Medium (64px) | Large (80px)
Value: 0-100
Status: Normal | Active | Disabled
```

**Parameter Fader:**
- Width: 32px
- Height: 250px
- Track: Glass/Light
- Handle: 40px × 24px
- Fill: Gradient (green → yellow → red)

**Status LED:**
- Size: 12px × 12px (md)
- Fill: Semantic color
- Effect: Outer glow (matching color)

**Component Properties:**
```
Status: Idle | Running | Warning | Error
Size: Small (8px) | Medium (12px) | Large (16px)
```

---

## Step 5: Effects & Styles

### Shadows

Create effect styles:

| Figma Style Name | Token | Value |
|------------------|-------|-------|
| Shadow/SM | `shadow.sm` | 0 1px 2px rgba(0,0,0,0.05) |
| Shadow/Base | `shadow.base` | 0 1px 3px rgba(0,0,0,0.1) |
| Shadow/MD | `shadow.md` | 0 4px 6px rgba(0,0,0,0.1) |
| Shadow/LG | `shadow.lg` | 0 10px 15px rgba(0,0,0,0.1) |
| Shadow/XL | `shadow.xl` | 0 20px 25px rgba(0,0,0,0.1) |
| Shadow/Glow Primary | `shadow.glowPrimary` | 0 0 20px Primary/500 60% |

### Blur Effects

| Figma Style Name | Token | Blur Amount |
|------------------|-------|-------------|
| Blur/SM | `blur.sm` | 4px |
| Blur/Base | `blur.base` | 8px |
| Blur/MD | `blur.md` | 12px |
| Blur/LG | `blur.lg` | 16px |
| Blur/XL | `blur.xl` | 24px |

### Grid System

**Layout Grid:**
```
Columns: 12
Gutter: 24px
Margin: 32px
Max Width: 1280px
```

**Spacing:**
- Element gap: 16px
- Content gap: 24px
- Card gap: 32px
- Section gap: 48px

---

## Step 6: Create Auto Layout Templates

### Dashboard Grid

```
Frame: Dashboard
Auto Layout: Horizontal wrap
Gap: 24px
Padding: 32px
Align: Top Left
```

**Nested:**
```
Card Frame
Auto Layout: Vertical
Gap: 16px
Padding: 32px
Fill: Glass/Medium
```

### Control Panel

```
Frame: Control Panel
Auto Layout: Horizontal
Gap: 32px
Padding: 32px
Align: Center
```

**Nested:**
```
Control Group
Auto Layout: Vertical
Gap: 12px
Align: Center
```

---

## Step 7: Maintain Sync

### Version Control

**Figma:**
1. Enable Version History
2. Name versions by date: "2025-11-05 - Design tokens v0.1.0"
3. Document changes in description

**Git:**
```bash
# Update tokens from Figma
git add design-tokens.json
git commit -m "Update design tokens from Figma"
git push

# Notify team
# Post in #design channel
```

### Sync Workflow

**Weekly Check:**
1. Export `design-tokens.json` from Figma Tokens
2. Compare with repo version: `diff design-tokens.json repo/design-tokens.json`
3. If different, review changes
4. Update repo if approved
5. Notify developers

**When Code Changes:**
1. Update `design-tokens.json` in repo
2. Import to Figma Tokens
3. Update Figma components
4. Verify visual consistency

### Automated Sync (Optional)

**Using Figma API:**

```javascript
// sync-tokens.js
const fetch = require('node-fetch');
const fs = require('fs');

const FIGMA_FILE_ID = 'your-file-id';
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

async function syncTokens() {
  const response = await fetch(
    `https://api.figma.com/v1/files/${FIGMA_FILE_ID}/styles`,
    { headers: { 'X-Figma-Token': FIGMA_TOKEN } }
  );

  const data = await response.json();
  const tokens = transformToTokens(data);

  fs.writeFileSync('design-tokens.json', JSON.stringify(tokens, null, 2));
}

syncTokens();
```

---

## Step 8: Component Documentation

### Component Specs Sheet

Create a documentation page in Figma:

**For Each Component:**
1. **Visual**: Component with annotations
2. **States**: All interactive states
3. **Spacing**: Padding, margin, gaps
4. **Colors**: Fill, stroke, effects
5. **Typography**: Text styles used
6. **Tokens**: Referenced design tokens
7. **Code Snippet**: Matching React component

**Example: Button Component**

```
┌─────────────────────────────────┐
│  Component: Primary Button      │
├─────────────────────────────────┤
│  Height: 48px                   │
│  Padding: 16px 32px             │
│  Radius: 16px                   │
│  Fill: gradient-primary         │
│  Text: Body/Base, Bold          │
│  Shadow: shadow-glow-primary    │
├─────────────────────────────────┤
│  States:                        │
│  • Default                      │
│  • Hover (scale 1.05)           │
│  • Active (scale 0.95)          │
│  • Disabled (opacity 0.4)       │
├─────────────────────────────────┤
│  Code:                          │
│  <button className="btn-primary">
│    Click Me                     │
│  </button>                      │
└─────────────────────────────────┘
```

---

## Best Practices

### Naming Conventions

**Do:**
- Use slash notation: `Primary/500`
- Match code tokens: `colors.primary.500`
- Group by category: `Button/Primary/Default`

**Don't:**
- Use spaces: ❌ `Primary 500`
- Mix styles: ❌ `ButtonPrimary-Default`
- Abbreviate: ❌ `Btn/Pri/Def`

### Component Organization

**Layer Structure:**
```
📁 Secular GUI
  📁 01 - Foundation
    📁 Colors
    📁 Typography
    📁 Spacing
    📁 Effects
  📁 02 - Components
    📁 Buttons
    📁 Cards
    📁 Studio Controls
      📄 Parameter Knob
      📄 Parameter Fader
      📄 Metric Meter
      📄 Status LED
      📄 Waveform Graph
  📁 03 - Patterns
    📁 Dashboard Layouts
    📁 Control Panels
  📁 04 - Documentation
    📄 Component Specs
    📄 Usage Guidelines
```

### Handoff Process

**Designer to Developer:**
1. Finalize design in Figma
2. Update all component specs
3. Export `design-tokens.json`
4. Create PR with tokens
5. Share Figma link with Dev Mode enabled
6. Schedule review meeting

**Developer to Designer:**
1. Review implementation
2. Report visual discrepancies
3. Request missing states/tokens
4. Suggest component improvements
5. Update documentation together

---

## Troubleshooting

### Common Issues

**Colors Don't Match:**
- Check color profile (sRGB vs Display P3)
- Verify opacity values
- Compare hex codes directly

**Text Looks Different:**
- Confirm font family installed
- Check letter spacing
- Verify line height calculation

**Effects Not Visible:**
- Ensure layer order correct
- Check effect opacity
- Verify blend modes

**Tokens Not Importing:**
- Validate JSON syntax
- Check plugin version
- Clear Figma cache

---

## Resources

- **Figma Tokens Plugin**: [github.com/tokens-studio/figma-plugin](https://github.com/tokens-studio/figma-plugin)
- **Design Tokens Format**: [design-tokens.github.io](https://design-tokens.github.io/)
- **Figma API Docs**: [figma.com/developers/api](https://www.figma.com/developers/api)
- **Token Transform**: [github.com/tokens-studio/token-transformer](https://github.com/tokens-studio/token-transformer)

---

## Example Figma File Structure

```
Secular GUI Design System
├── Cover
├── 📖 Documentation
│   ├── Getting Started
│   ├── Design Principles
│   └── Component Specs
├── 🎨 Foundation
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows
│   └── Animations
├── 🧩 Components
│   ├── Buttons
│   ├── Cards
│   ├── Inputs
│   └── Studio Controls
├── 📱 Patterns
│   ├── Dashboard Layouts
│   ├── Control Panels
│   └── Modal Dialogs
└── 🎬 Prototypes
    ├── Dashboard Flow
    └── Control Interaction
```

---

**Version**: 0.1.0
**Updated**: 2025-11-05
**Maintainer**: Design Team
