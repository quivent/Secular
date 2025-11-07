# Design System Quick Reference

Visual quick reference for developers implementing Secular GUI designs.

---

## Color Palette

### Primary (Cyan-Blue)

```
#f0f9ff  ████  50   Very light backgrounds
#e0f2fe  ████  100  Light backgrounds, hover states
#bae6fd  ████  200  Borders (light)
#7dd3fc  ████  300  Text accents, highlights
#38bdf8  ████  400  Interactive elements
#0ea5e9  ████  500  PRIMARY - Main brand color
#0284c7  ████  600  Primary hover
#0369a1  ████  700  Primary active
#075985  ████  800  Deep backgrounds
#0c4a6e  ████  900  Darkest backgrounds
```

### Accent Colors

```
#06b6d4  ████  Cyan    Information, data viz
#a855f7  ████  Purple  Special features, premium
#ec4899  ████  Pink    Highlights, attention
#f59e0b  ████  Amber   Warnings, alerts
```

### Semantic Colors

```
rgb(34, 197, 94)    ████  Success  Green-500  Completed, running
rgb(250, 204, 21)   ████  Warning  Yellow-400 Caution, approaching limits
rgb(239, 68, 68)    ████  Error    Red-500    Failures, critical alerts
rgb(59, 130, 246)   ████  Info     Blue-500   Informational messages
rgb(107, 114, 128)  ████  Idle     Gray-500   Inactive, neutral state
```

---

## Typography Scale

```
Display/4XL    36px / 40lh    Bold       Page heroes
Display/3XL    30px / 36lh    Bold       Page titles
Display/2XL    24px / 32lh    Semibold   Section headers

Heading/XL     20px / 28lh    Semibold   Subheadings
Heading/LG     18px / 28lh    Semibold   Card titles

Body/Base      16px / 24lh    Regular    Body text (DEFAULT)
Body/SM        14px / 20lh    Regular    Secondary text

Caption/XS     12px / 16lh    Medium     Captions, labels
```

---

## Spacing System

```
1   ▪   4px      Tight spacing (icons, badges)
2   ▪▪  8px      Compact elements (button gaps)
3   ▪▪▪ 12px     Controls, small groups
4   ▪▪▪▪ 16px    Default spacing (elements)
6   ▪▪▪▪▪▪ 24px  Generous spacing (content)
8   ▪▪▪▪▪▪▪▪ 32px Section spacing (cards)
12  ▪▪▪▪▪▪▪▪▪▪▪▪ 48px Major sections
16  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ 64px Page sections
```

---

## Border Radius

```
sm     ▢  4px     Tight corners (badges)
md     ▢  8px     Small cards, inputs
lg     ▢  12px    Standard cards, buttons
xl     ▢  16px    Large cards, primary buttons
2xl    ▢  24px    Hero cards, modals
full   ●  9999px  Circles, pills
```

---

## Component Sizes

### Buttons

```
Primary     48px height   32px padding-x   16px radius   Bold text
Secondary   40px height   24px padding-x   12px radius   Medium text
Tertiary    32px height   16px padding-x   12px radius   Regular text
```

### Cards

```
Hero        32px padding   24px radius   Elevated glass
Standard    24px padding   16px radius   Standard glass
Compact     16px padding   12px radius   Minimal glass
```

### Studio Controls

```
Knob      sm: 48px   md: 64px   lg: 80px
LED       sm: 8px    md: 12px   lg: 16px
Meter     sm: 16px   md: 24px   lg: 32px
```

---

## Glass Effects

```
Light     rgba(255,255,255,0.05)  backdrop-blur(12px)  Base elements
Medium    rgba(255,255,255,0.10)  backdrop-blur(12px)  Cards
Dark      rgba(0,0,0,0.30)        backdrop-blur(12px)  Overlays
```

**Z-Axis Depth:**
```
Base        5% opacity   no shadow              Backgrounds
Elevated    10% opacity  shadow-lg + cyan/20    Cards
Float       15% opacity  shadow-2xl + cyan/30   Modals
Modal       20% opacity  shadow + cyan/40       Dialogs
Tooltip     95% opacity  shadow-2xl             Tooltips
```

---

## Shadow System

```
sm     Subtle:      0 1px 2px rgba(0,0,0,0.05)
base   Standard:    0 1px 3px rgba(0,0,0,0.1)
md     Medium:      0 4px 6px rgba(0,0,0,0.1)
lg     Large:       0 10px 15px rgba(0,0,0,0.1)
xl     Extra Large: 0 20px 25px rgba(0,0,0,0.1)
2xl    Maximum:     0 25px 50px rgba(0,0,0,0.25)

Glows:
Primary  0 0 20px rgba(14,165,233,0.6)   Cyan glow
Success  0 0 20px rgba(34,197,94,0.6)    Green glow
Warning  0 0 20px rgba(250,204,21,0.6)   Yellow glow
Error    0 0 20px rgba(239,68,68,0.6)    Red glow
```

---

## Animation Timing

```
Fast     150ms   Quick feedback (hover)
Base     300ms   Standard transitions (DEFAULT)
Slow     600ms   Deliberate animations (modal)
Pulse    2000ms  Continuous pulse effects
```

**Easing Functions:**
```
linear      linear                        Constant speed
easeIn      cubic-bezier(0.4,0,1,1)      Slow start
easeOut     cubic-bezier(0,0,0.2,1)      Slow end
easeInOut   cubic-bezier(0.4,0,0.2,1)    Slow start & end (DEFAULT)
```

---

## Common Patterns

### Button Classes

```css
/* Primary */
.btn-primary {
  @apply h-12 px-8 rounded-xl
         bg-gradient-to-r from-cyan-500 to-blue-500
         text-white font-semibold
         shadow-lg shadow-cyan-500/30
         hover:scale-105 active:scale-95
         transition-all duration-300;
}

/* Secondary */
.btn-secondary {
  @apply h-10 px-6 rounded-lg
         glass-elevated text-cyan-100
         hover:bg-white/15
         transition-all duration-300;
}
```

### Card Classes

```css
/* Hero Card */
.card-hero {
  @apply glass-elevated rounded-2xl p-8
         border border-cyan-500/20
         hover:border-cyan-500/40
         transition-all duration-300;
}

/* Standard Card */
.card-standard {
  @apply glass rounded-xl p-6
         hover:bg-white/10
         transition-all duration-300;
}
```

### Text Hierarchy

```css
.text-primary    { color: rgba(255,255,255,1.0); }  /* 100% */
.text-secondary  { color: rgba(255,255,255,0.8); }  /* 80% */
.text-tertiary   { color: rgba(255,255,255,0.6); }  /* 60% */
.text-quaternary { color: rgba(255,255,255,0.4); }  /* 40% */
.text-disabled   { color: rgba(255,255,255,0.3); }  /* 30% */
```

---

## Component API Cheat Sheet

### ParameterKnob

```tsx
<ParameterKnob
  label="Volume"          // Required: Label text
  value={50}              // Required: Current value
  min={0}                 // Required: Minimum value
  max={100}               // Required: Maximum value
  onChange={setVolume}    // Required: Change handler
  step={1}                // Optional: Step increment
  unit="%"                // Optional: Display unit
  size="md"               // Optional: sm | md | lg
  disabled={false}        // Optional: Disable control
  presets={[0,50,100]}    // Optional: Quick preset values
  colorZones={[           // Optional: Color-coded ranges
    { start: 0, end: 60, color: 'rgb(34,197,94)' },
    { start: 60, end: 100, color: 'rgb(239,68,68)' }
  ]}
/>
```

### ParameterFader

```tsx
<ParameterFader
  label="Master"          // Required: Label text
  value={70}              // Required: Current value
  min={0}                 // Required: Minimum value
  max={100}               // Required: Maximum value
  onChange={setMaster}    // Required: Change handler
  step={1}                // Optional: Step increment
  unit="%"                // Optional: Display unit
  height={250}            // Optional: Fader height in px
  showScale={true}        // Optional: Show scale markers
  snapValues={[0,50,100]} // Optional: Snap-to values
  disabled={false}        // Optional: Disable control
/>
```

### MetricMeter

```tsx
<MetricMeter
  label="CPU Usage"       // Required: Label text
  value={45}              // Required: Current value
  min={0}                 // Optional: Minimum value (default: 0)
  max={100}               // Optional: Maximum value (default: 100)
  unit="%"                // Optional: Display unit
  size="md"               // Optional: sm | md | lg
  showPeak={true}         // Optional: Show peak hold indicator
  showSparkline={false}   // Optional: Show history graph
  thresholds={[           // Optional: Threshold markers
    { value: 60, label: 'Safe', color: 'green' },
    { value: 85, label: 'Warn', color: 'yellow' }
  ]}
/>
```

### StatusLED

```tsx
<StatusLED
  status="running"        // Required: idle | running | warning | error
  label="Server"          // Optional: Label text
  size="md"               // Optional: sm | md | lg
  showLabel={true}        // Optional: Show label text
/>

<StatusLEDGroup
  items={[                // Required: Array of LED items
    { status: 'running', label: 'Server' },
    { status: 'warning', label: 'Cache' }
  ]}
  orientation="horizontal" // Optional: horizontal | vertical
  size="md"                // Optional: sm | md | lg
/>
```

### WaveformGraph

```tsx
<WaveformGraph
  series={[               // Required: Array of data series
    {
      id: 'signal',
      data: [10,20,30],
      color: 'rgb(59,130,246)',
      label: 'Signal',
      glow: true
    }
  ]}
  width={600}             // Optional: Graph width in px
  height={200}            // Optional: Graph height in px
  min={0}                 // Optional: Y-axis minimum
  max={100}               // Optional: Y-axis maximum
  showGrid={true}         // Optional: Show grid lines
  showAxes={true}         // Optional: Show axes
  showLegend={true}       // Optional: Show series legend
  zoomable={false}        // Optional: Enable zoom controls
  pannable={false}        // Optional: Enable pan controls
/>
```

---

## Accessibility Checklist

When implementing components:

```
□ ARIA labels present (aria-label, aria-labelledby)
□ Roles defined (role="slider", role="button", etc.)
□ Keyboard navigation works (Arrow keys, Enter, Space)
□ Focus visible (ring-2 ring-primary-500/50)
□ States announced (aria-live="polite")
□ Values exposed (aria-valuemin, aria-valuemax, aria-valuenow)
□ Disabled state (aria-disabled, tabIndex={-1})
□ Color contrast meets WCAG AA (4.5:1 for text)
```

---

## Responsive Breakpoints

```
Mobile:   < 768px    Single column, compact controls
Tablet:   768-1024px Two columns, medium controls
Desktop:  > 1024px   Three+ columns, full controls
```

**Usage:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* cards */}
</div>
```

---

## Import Paths

```typescript
// Components
import {
  ParameterKnob,
  ParameterFader,
  MetricMeter,
  StatusLED,
  WaveformGraph,
} from '@/components/controls';

// Design tokens
import { designTokens } from '@/design-tokens';

// Animation utilities
import {
  getRotationSpring,
  getPositionSpring,
} from '@/hooks/useAnimation';

// Tailwind utilities
import { cn } from '@/lib/utils';
```

---

## Common Code Snippets

### Basic Button

```tsx
<button className="btn-primary">
  <Icon className="w-5 h-5" />
  <span>Click Me</span>
</button>
```

### Card with Content

```tsx
<div className="card-standard">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-white/60">Card content goes here...</p>
</div>
```

### Loading State

```tsx
<div className="loading-shimmer rounded-lg h-24 w-full" />
```

### Empty State

```tsx
<div className="glass rounded-2xl p-8 text-center">
  <Icon className="w-16 h-16 mx-auto mb-4 text-white/20" />
  <h3 className="text-xl font-bold mb-2">No Data</h3>
  <p className="text-white/50">Nothing to display yet</p>
</div>
```

### Status Badge

```tsx
<div className="status-success px-3 py-1 rounded-full text-sm">
  <CheckCircle className="w-4 h-4" />
  <span>Active</span>
</div>
```

---

## Performance Tips

```
✓ Use CSS transforms for animations (not width/height)
✓ Throttle real-time updates to 500ms
✓ Limit waveform data points to 50-100
✓ Use memo() for expensive components
✓ Implement virtualization for long lists
✗ Don't animate on every frame (60fps)
✗ Don't update entire component tree
✗ Don't store full history in state
```

---

## Browser Support

```
Chrome:    Latest 2 versions  ✓
Firefox:   Latest 2 versions  ✓
Safari:    Latest 2 versions  ✓
Edge:      Latest 2 versions  ✓
```

**Features:**
- CSS backdrop-filter (glassmorphism)
- Framer Motion animations
- SVG filters (glow effects)
- CSS Grid & Flexbox

---

## Need More Details?

- **Full Documentation**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Component Showcase**: Navigate to Controls tab in app
- **Contributing Guide**: [CONTRIBUTING_DESIGN.md](./CONTRIBUTING_DESIGN.md)
- **Figma Integration**: [FIGMA_INTEGRATION.md](./FIGMA_INTEGRATION.md)

---

**Version**: 0.1.0
**Updated**: 2025-11-05
