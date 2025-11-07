# Secular GUI Design System

A comprehensive glassmorphism design system for P2P code collaboration, featuring professional audio mixer aesthetics, smooth animations, and accessible interactions.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Glass Effects](#glass-effects)
6. [Components](#components)
7. [Animations](#animations)
8. [Accessibility](#accessibility)
9. [Usage Guidelines](#usage-guidelines)

---

## Design Philosophy

The Secular GUI design system embodies:

- **Professional Audio Aesthetic**: Studio control components with tactile, hardware-inspired interactions
- **Glassmorphism**: Layered transparency with depth perception
- **Dark Mode First**: Optimized for extended coding sessions
- **Responsive Feedback**: Every interaction feels immediate and satisfying
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

---

## Color System

### Primary Palette

The primary color system uses a cyan-blue gradient as the foundational identity:

| Token | Value | Usage |
|-------|-------|-------|
| `primary-50` | `#f0f9ff` | Subtle backgrounds |
| `primary-100` | `#e0f2fe` | Hover states (light) |
| `primary-200` | `#bae6fd` | Borders (light) |
| `primary-300` | `#7dd3fc` | Text accents |
| `primary-400` | `#38bdf8` | Interactive elements |
| `primary-500` | `#0ea5e9` | Primary actions |
| `primary-600` | `#0284c7` | Primary hover |
| `primary-700` | `#0369a1` | Primary active |
| `primary-800` | `#075985` | Deep backgrounds |
| `primary-900` | `#0c4a6e` | Darkest backgrounds |

### Accent Colors

Accent colors provide semantic meaning and visual variety:

| Token | Value | Usage |
|-------|-------|-------|
| `accent.cyan` | `#06b6d4` | Information, data visualization |
| `accent.purple` | `#a855f7` | Special features, premium |
| `accent.pink` | `#ec4899` | Highlights, attention |
| `accent.amber` | `#f59e0b` | Warnings, alerts |

### Semantic Colors

Status-driven colors communicate state:

| Status | Color | Usage |
|--------|-------|-------|
| Success | `rgb(34, 197, 94)` | Completed actions, running status |
| Warning | `rgb(250, 204, 21)` | Caution, approaching limits |
| Error | `rgb(239, 68, 68)` | Failures, critical alerts |
| Info | `rgb(59, 130, 246)` | Informational messages |
| Idle | `rgb(107, 114, 128)` | Inactive, neutral state |

### Text Colors

Hierarchical text opacity system:

| Class | Opacity | Usage |
|-------|---------|-------|
| `.text-primary` | `100%` | Headings, primary content |
| `.text-secondary` | `80%` | Body text, secondary info |
| `.text-tertiary` | `60%` | Labels, metadata |
| `.text-quaternary` | `40%` | Placeholders, hints |
| `.text-disabled` | `30%` | Disabled states |

### Background Gradients

```css
/* Main background */
background: linear-gradient(to bottom right, #020617, #172554, #0f172a);

/* Card gradients */
background: linear-gradient(to right, #0ea5e9, #3b82f6);
background: linear-gradient(to right, #06b6d4, #a855f7);
```

---

## Typography

### Font Stack

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code',
               'Roboto Mono', 'Courier New', monospace;
}
```

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `.text-xs` | `12px` | `16px` | Captions, hints |
| `.text-sm` | `14px` | `20px` | Secondary text |
| `.text-base` | `16px` | `24px` | Body text |
| `.text-lg` | `18px` | `28px` | Card titles |
| `.text-xl` | `20px` | `28px` | Section headers |
| `.text-2xl` | `24px` | `32px` | Page sections |
| `.text-3xl` | `30px` | `36px` | Page titles |
| `.text-4xl` | `36px` | `40px` | Hero headings |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `.font-normal` | `400` | Body text |
| `.font-medium` | `500` | Labels, buttons |
| `.font-semibold` | `600` | Subheadings |
| `.font-bold` | `700` | Headings, emphasis |

### Best Practices

- Use uppercase + tracking for labels: `uppercase tracking-wider`
- Monospace for numeric values: `font-mono`
- Gradient text for hero elements: `bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent`

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `.gap-1` | `4px` | Tight spacing |
| `.gap-2` | `8px` | Compact elements |
| `.gap-3` | `12px` | Default spacing |
| `.gap-4` | `16px` | Comfortable spacing |
| `.gap-6` | `24px` | Generous spacing |
| `.gap-8` | `32px` | Section spacing |
| `.gap-12` | `48px` | Major sections |
| `.gap-16` | `64px` | Page sections |

### Semantic Spacing

```css
.element-gap     { gap: 1rem; }      /* 16px - between related elements */
.content-gap     { space-y: 1.5rem; } /* 24px - content blocks */
.card-gap        { gap: 2rem; }      /* 32px - between cards */
.section-gap     { space-y: 3rem; }  /* 48px - page sections */
```

### Layout Patterns

**Dashboard Grid:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* cards */}
</div>
```

**Page Container:**
```jsx
<div className="max-w-7xl mx-auto p-8 space-y-12">
  {/* content */}
</div>
```

---

## Glass Effects

### Base Glass

```css
.glass {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Glass Hierarchy

Depth perception through layering:

| Class | Opacity | Shadow | Usage |
|-------|---------|--------|-------|
| `.glass` | `5%` | None | Base elements |
| `.glass-elevated` | `10%` | `shadow-lg shadow-cyan-500/20` | Cards |
| `.glass-float` | `15%` | `shadow-2xl shadow-cyan-500/30` | Modals |
| `.glass-modal` | `20%` | `shadow-cyan-500/40` | Overlays |
| `.glass-tooltip` | `95%` | `shadow-2xl` | Tooltips |

### Interactive Glass

```css
.glass-hover {
  @apply glass transition-all duration-300;
}

.glass-hover:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
```

---

## Components

### Button Hierarchy

**Primary Button** - Main actions
```jsx
<button className="btn-primary">
  Deploy Now
</button>
```
- Height: `48px`
- Gradient: cyan-500 → blue-500
- Shadow: Cyan glow
- States: hover (scale 1.05), active (scale 0.95)

**Secondary Button** - Alternative actions
```jsx
<button className="btn-secondary">
  View Details
</button>
```
- Height: `40px`
- Glass elevated style
- Subtle border animation on hover

**Tertiary Button** - Low-priority actions
```jsx
<button className="btn-tertiary">
  Cancel
</button>
```
- Height: `32px`
- Minimal styling
- Text-focused

**Danger Button** - Destructive actions
```jsx
<button className="btn-danger">
  Delete Project
</button>
```
- Red gradient
- Prominent shadow
- Use sparingly

### Card Hierarchy

**Hero Card** - Primary feature cards
```jsx
<div className="card-hero">
  <h3>Feature Title</h3>
  <p>Description...</p>
</div>
```
- Large padding (32px)
- Cyan border accent
- Animated hover effects

**Standard Card** - General purpose
```jsx
<div className="card-standard">
  <h4>Card Title</h4>
  <p>Content...</p>
</div>
```
- Medium padding (24px)
- Subtle borders
- Hover glow

**Compact Card** - Dense layouts
```jsx
<div className="card-compact">
  <span>Quick info</span>
</div>
```
- Small padding (16px)
- Minimal decoration

**Interactive Card** - Clickable cards
```jsx
<div className="card-interactive">
  <h4>Click me</h4>
</div>
```
- Cursor pointer
- Scale on active
- Accessibility features

### Studio Control Components

#### ParameterKnob

Rotary knob with -135° to +135° rotation range.

```jsx
<ParameterKnob
  label="Volume"
  value={volume}
  min={0}
  max={100}
  step={1}
  unit="%"
  onChange={setVolume}
  colorZones={[
    { start: 0, end: 60, color: 'rgb(34, 197, 94)' },
    { start: 60, end: 85, color: 'rgb(250, 204, 21)' },
    { start: 85, end: 100, color: 'rgb(239, 68, 68)' },
  ]}
  presets={[0, 25, 50, 75, 100]}
  size="md"
/>
```

**Interactions:**
- Click-drag vertically to adjust
- Scroll wheel for fine-tuning
- Double-click to type exact value
- Preset buttons for quick values

**Sizes:** `sm` (48px), `md` (64px), `lg` (80px)

#### ParameterFader

Vertical slider with LED-style level indicator.

```jsx
<ParameterFader
  label="Master"
  value={faderValue}
  min={0}
  max={100}
  step={1}
  unit="%"
  onChange={setFaderValue}
  height={250}
  showScale={true}
  snapValues={[0, 25, 50, 75, 100]}
/>
```

**Features:**
- Smooth track interaction
- LED segment visualization
- Gradient fill (green → yellow → red)
- Optional scale markers
- Snap-to-value behavior

#### MetricMeter

VU meter style horizontal bar with animated gradient.

```jsx
<MetricMeter
  label="Audio Level"
  value={meterValue}
  min={0}
  max={100}
  unit="dB"
  showPeak={true}
  showSparkline={true}
  thresholds={[
    { value: 60, label: 'Safe', color: 'rgb(34, 197, 94)' },
    { value: 85, label: 'Warn', color: 'rgb(250, 204, 21)' },
    { value: 95, label: 'Peak', color: 'rgb(239, 68, 68)' },
  ]}
  size="md"
/>
```

**Features:**
- Real-time value updates
- Peak hold indicator (2-second hold)
- Optional sparkline history
- Threshold markers
- Segmented background

**Sizes:** `sm` (16px), `md` (24px), `lg` (32px)

#### StatusLED

Binary status indicator with glow effects.

```jsx
<StatusLED
  status="running"
  label="Server"
  size="md"
/>
```

**States:**
- `idle` - Gray, no animation
- `running` - Green, pulsing glow
- `warning` - Amber, blinking
- `error` - Red, blinking

**Group Usage:**
```jsx
<StatusLEDGroup
  items={[
    { status: 'running', label: 'Server' },
    { status: 'running', label: 'Database' },
    { status: 'warning', label: 'Cache' },
  ]}
  orientation="horizontal"
  size="md"
/>
```

#### WaveformGraph

SVG-based line chart for real-time data visualization.

```jsx
<WaveformGraph
  series={[
    {
      id: 'signal',
      data: waveformData,
      color: 'rgb(59, 130, 246)',
      label: 'Signal',
      glow: true,
    },
  ]}
  width={600}
  height={200}
  min={0}
  max={100}
  showGrid={true}
  showAxes={true}
  showLegend={false}
  zoomable={true}
  pannable={true}
/>
```

**Features:**
- Multiple series overlay
- Zoom/pan controls
- Optional glow effects
- Grid background
- Responsive sizing
- Real-time updates

---

## Animations

### Motion Variants

```typescript
import { Variants } from 'framer-motion';

// Fade in
const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Scale in
const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

// Slide up
const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
```

### Transition Presets

```typescript
// Smooth
const smoothTransition = {
  duration: 0.3,
  ease: 'easeInOut',
};

// Spring
const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Rotation (knobs)
const rotationSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 0.5,
};

// Position (faders)
const positionSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};
```

### CSS Animations

```css
/* Float effect */
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Glow effect */
.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  0% { box-shadow: 0 0 5px rgba(14, 165, 233, 0.5); }
  100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.8); }
}

/* Pulse slow */
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Animation Guidelines

**Do:**
- Use spring physics for physical controls (knobs, faders)
- Apply subtle hover states (scale 1.05 max)
- Stagger list animations (delay: 0.1s increments)
- Animate opacity + transform together

**Don't:**
- Animate on scroll (performance)
- Use easing functions longer than 0.6s
- Apply multiple conflicting animations
- Animate on every state change

---

## Accessibility

### ARIA Labels

All interactive components include proper ARIA attributes:

```jsx
// Status indicators
<div role="status" aria-label="Server running">
  <StatusLED status="running" label="Server" />
</div>

// Controls
<div role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
  <ParameterKnob {...props} />
</div>
```

### Keyboard Navigation

| Component | Key | Action |
|-----------|-----|--------|
| Knob | Arrow Up/Down | Adjust value |
| Knob | Enter | Edit mode |
| Knob | Escape | Cancel edit |
| Fader | Arrow Up/Down | Adjust value |
| Button | Space/Enter | Activate |

### Focus States

```css
.focus-primary:focus {
  @apply ring-4 ring-cyan-500/50 outline-none;
}

.focus-secondary:focus {
  @apply ring-2 ring-cyan-500/30 outline-none;
}
```

### Color Contrast

All text meets WCAG AA standards:

- Primary text (white): 21:1 ratio
- Secondary text (white/80%): 16:1 ratio
- Tertiary text (white/60%): 12:1 ratio

### Screen Readers

Component state changes announce properly:

```jsx
<div aria-live="polite" aria-atomic="true">
  Value changed to {value}
</div>
```

---

## Usage Guidelines

### When to Use Each Component

**ParameterKnob**
- ✅ Fine-tuning parameters (volume, frequency)
- ✅ Circular value ranges
- ✅ Professional audio/video controls
- ❌ Boolean on/off states
- ❌ Text input fields

**ParameterFader**
- ✅ Linear mixing controls
- ✅ Level adjustments
- ✅ Multi-channel balance
- ❌ Non-linear scales
- ❌ Discrete selections

**MetricMeter**
- ✅ Real-time monitoring
- ✅ System resources (CPU, memory)
- ✅ Audio levels
- ❌ User input controls
- ❌ Static data display

**StatusLED**
- ✅ Binary state indicators
- ✅ System health monitoring
- ✅ Real-time status updates
- ❌ Detailed error messages
- ❌ Multi-state selections

**WaveformGraph**
- ✅ Time-series data
- ✅ Signal visualization
- ✅ Trend analysis
- ❌ Static charts
- ❌ Bar/pie charts

### Component Composition

**Dashboard Metrics:**
```jsx
<div className="grid grid-cols-3 gap-6">
  <div className="card-hero">
    <MetricMeter label="CPU" value={cpu} />
    <StatusLED status={cpuStatus} />
  </div>
</div>
```

**Control Panel:**
```jsx
<div className="glass rounded-2xl p-8">
  <div className="grid grid-cols-4 gap-8">
    <ParameterKnob label="Gain" {...gainProps} />
    <ParameterKnob label="Freq" {...freqProps} />
    <ParameterFader label="Master" {...masterProps} />
    <ParameterFader label="Monitor" {...monitorProps} />
  </div>
</div>
```

### Responsive Behavior

**Breakpoints:**
- Mobile: `< 768px` - Single column, compact controls
- Tablet: `768px - 1024px` - Two columns, medium controls
- Desktop: `> 1024px` - Three columns, full controls

**Adaptive Sizing:**
```jsx
// Mobile: small, Desktop: large
<ParameterKnob
  size={isMobile ? 'sm' : 'lg'}
  {...props}
/>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* controls */}
</div>
```

### Performance Best Practices

**Do:**
- Throttle real-time updates (500ms intervals)
- Use CSS transforms for animations
- Limit waveform data points to 50-100
- Implement virtualization for long lists

**Don't:**
- Update every frame (60fps)
- Animate layout properties (width, height)
- Store entire history in state
- Re-render entire component trees

### Common Patterns

**Loading States:**
```jsx
<div className="loading-shimmer rounded-lg h-24" />
```

**Empty States:**
```jsx
<div className="glass rounded-2xl p-8 text-center">
  <Icon className="w-16 h-16 mx-auto mb-4 text-white/20" />
  <h3 className="text-xl font-bold mb-2">No data yet</h3>
  <p className="text-white/50">Start monitoring to see metrics</p>
</div>
```

**Error States:**
```jsx
<div className="status-danger rounded-lg p-4">
  <AlertTriangle className="w-5 h-5" />
  <span>Connection failed</span>
</div>
```

---

## Integration Examples

### Import Components

```typescript
import {
  ParameterKnob,
  ParameterFader,
  MetricMeter,
  StatusLED,
  StatusLEDGroup,
  WaveformGraph,
} from '@/components/controls';
```

### Basic Usage

```jsx
function AudioMixer() {
  const [volume, setVolume] = useState(80);
  const [gain, setGain] = useState(0);
  const [level, setLevel] = useState(45);

  return (
    <div className="glass rounded-2xl p-8">
      <div className="grid grid-cols-3 gap-8">
        <ParameterKnob
          label="Volume"
          value={volume}
          min={0}
          max={100}
          onChange={setVolume}
        />

        <ParameterKnob
          label="Gain"
          value={gain}
          min={-12}
          max={12}
          step={0.1}
          unit="dB"
          onChange={setGain}
        />

        <ParameterFader
          label="Master"
          value={level}
          min={0}
          max={100}
          onChange={setLevel}
        />
      </div>

      <MetricMeter
        label="Output"
        value={level}
        min={0}
        max={100}
        showPeak
      />
    </div>
  );
}
```

---

## Design Tokens Export

Design tokens are available in multiple formats:

- **JSON**: `/design-tokens.json`
- **CSS Variables**: `/design-tokens.css`
- **TypeScript**: `/design-tokens.ts`

See [Figma Integration Guide](./FIGMA_INTEGRATION.md) for design tool setup.

---

## Resources

- **Component Showcase**: Open app → Navigate to "Controls" tab
- **Live Examples**: [/showcase](#) in running application
- **Source Code**: `/src/components/controls/`
- **Tailwind Config**: `/tailwind.config.js`
- **CSS Utilities**: `/src/index.css`

---

## Contributing to the Design System

When adding new components:

1. Follow existing naming conventions
2. Include TypeScript interfaces
3. Add ARIA labels for accessibility
4. Provide size variants (sm, md, lg)
5. Include disabled states
6. Add hover/focus animations
7. Document in ComponentShowcase.tsx
8. Update this DESIGN_SYSTEM.md

---

## Version History

- **v0.1.0** (2025-11-05) - Initial design system documentation
  - Core components: Knob, Fader, Meter, LED, Graph
  - Glassmorphism visual system
  - Animation presets
  - Accessibility features

---

Built with React, TypeScript, Tailwind CSS, and Framer Motion
