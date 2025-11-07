# Visual Hierarchy Guide

## Problem Assessment
Current State: 2/10 - Everything looks the same importance, no clear focus

## Hierarchy System

### 1. Size Hierarchy

#### Buttons & Interactive Elements
- **Primary CTA**: h-12 (48px) - Main actions (Start Scan, Clone Repo, Deploy)
- **Secondary**: h-10 (40px) - Important but not primary (Add Repo, Filters)
- **Tertiary**: h-8 (32px) - Supporting actions (View all, Toggle options)
- **Utility**: h-6 (24px) - Inline actions (Edit, Delete icons)

#### Typography
- **Page Title**: text-4xl (36px) - Main page heading
- **Section Header**: text-2xl (24px) - Major section dividers
- **Card Title**: text-lg (18px) - Card/component headers
- **Body**: text-base (16px) - Default content
- **Caption**: text-sm (14px) - Metadata, timestamps
- **Micro**: text-xs (12px) - Labels, hints

#### Cards & Surfaces
- **Hero Cards**: p-8, rounded-2xl - Primary focus areas
- **Standard Cards**: p-6, rounded-xl - Regular content
- **Compact Cards**: p-4, rounded-lg - Dense information
- **List Items**: p-3, rounded-lg - Repeating elements

### 2. Color Hierarchy

#### Importance Levels
```
Level 1 (Primary):    text-white, bg-cyan-400/100        - Most important
Level 2 (Important):  text-cyan-100, bg-cyan-400/80      - Very important
Level 3 (Secondary):  text-white/80, bg-white/10         - Important
Level 4 (Tertiary):   text-white/60, bg-white/5          - Supporting
Level 5 (Disabled):   text-white/40, bg-white/3          - Inactive
```

#### Action Colors
- **Primary Action**: `bg-gradient-to-r from-cyan-500 to-blue-500` + glow
- **Success**: `text-green-400`, `bg-green-500/20`
- **Warning**: `text-yellow-400`, `bg-yellow-500/20`
- **Danger**: `text-red-400`, `bg-red-500/20`
- **Info**: `text-blue-400`, `bg-blue-500/20`

### 3. Spacing Hierarchy

```
Page Layout:
  - Page top padding:           pt-8 (32px)
  - Page title margin-bottom:   mb-16 (64px)
  - Section gap:                space-y-12 (48px)

Section Layout:
  - Section header margin-top:  mt-12 (48px)
  - Section header margin-bottom: mb-8 (32px)
  - Card grid gaps:             gap-8 (32px)

Card Layout:
  - Card padding (hero):        p-8 (32px)
  - Card padding (standard):    p-6 (24px)
  - Card padding (compact):     p-4 (16px)
  - Card internal gaps:         space-y-6 (24px)

Component Layout:
  - Component spacing:          space-y-4 (16px)
  - Element spacing:            gap-3 (12px)
  - Tight spacing:              gap-2 (8px)
```

### 4. Depth Hierarchy (Z-axis)

```
Level 0: Background
  - Gradient backgrounds, mesh patterns
  - z-0

Level 1: Base Surfaces
  - Cards, panels
  - glass (blur-md, bg-white/5)
  - shadow-sm
  - z-10

Level 2: Elevated Elements
  - Hover states, active cards
  - glass-elevated (blur-lg, bg-white/10)
  - shadow-lg shadow-cyan-500/20
  - z-20

Level 3: Floating Elements
  - Dropdowns, popovers, notifications
  - glass-float (blur-xl, bg-white/15)
  - shadow-2xl shadow-cyan-500/30
  - z-30

Level 4: Modals & Overlays
  - Full-screen modals, dialogs
  - glass-modal (blur-2xl, bg-white/20)
  - shadow-2xl shadow-cyan-500/40
  - z-40

Level 5: Tooltips & Toasts
  - Temporary UI elements
  - glass-tooltip (blur-xl, bg-slate-900/95)
  - shadow-2xl
  - z-50
```

### 5. Focus & Interactive States

#### Primary Button States
```jsx
// Default
className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500
           text-white font-semibold shadow-lg shadow-cyan-500/30"

// Hover
hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-105

// Active/Focus
focus:ring-4 focus:ring-cyan-500/50 active:scale-95

// Loading
animate-pulse opacity-90 cursor-wait

// Disabled
opacity-40 cursor-not-allowed grayscale
```

#### Card Hover States
```jsx
// Default
className="glass rounded-xl p-6 border border-white/10 transition-all duration-300"

// Hover
hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20
```

### 6. Content Density

#### Dashboard View (Spacious)
```
- Large gaps between sections (space-y-12)
- Generous card padding (p-8)
- Large text for key metrics (text-4xl)
- White space for breathing room
```

#### List/Table Views (Moderate)
```
- Medium gaps (space-y-6)
- Standard padding (p-6)
- Consistent row height (h-16)
- Hover states for interaction
```

#### Data Logs (Dense)
```
- Compact spacing (space-y-2)
- Tight padding (p-3)
- Small text (text-sm)
- Monospace fonts
```

## CSS Utility Classes

### New Classes to Add
```css
/* Hierarchy Levels */
.h-primary { @apply h-12 px-8 text-base font-semibold; }
.h-secondary { @apply h-10 px-6 text-sm font-medium; }
.h-tertiary { @apply h-8 px-4 text-sm; }

/* Glass Hierarchy */
.glass-elevated { @apply glass bg-white/10 shadow-lg shadow-cyan-500/20; }
.glass-float { @apply glass-elevated bg-white/15 shadow-2xl shadow-cyan-500/30; }
.glass-modal { @apply glass-float bg-white/20 shadow-cyan-500/40; }

/* Button Hierarchy */
.btn-primary { @apply h-primary rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500
               text-white shadow-lg shadow-cyan-500/30
               hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-105
               focus:ring-4 focus:ring-cyan-500/50 active:scale-95
               transition-all duration-300; }

.btn-secondary { @apply h-secondary rounded-lg glass-elevated
                 text-cyan-100 hover:text-white hover:bg-white/15
                 focus:ring-2 focus:ring-cyan-500/30
                 transition-all duration-300; }

.btn-tertiary { @apply h-tertiary rounded-lg glass
                text-white/70 hover:text-white hover:bg-white/10
                transition-all duration-200; }

/* Card Hierarchy */
.card-hero { @apply glass-elevated rounded-2xl p-8 border border-cyan-500/20
             hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/30
             transition-all duration-300; }

.card-standard { @apply glass rounded-xl p-6 border border-white/10
                 hover:bg-white/10 hover:border-cyan-500/20
                 transition-all duration-300; }

.card-compact { @apply glass rounded-lg p-4 border border-white/5
                hover:bg-white/8
                transition-all duration-200; }

/* Text Hierarchy */
.text-primary { @apply text-white; }
.text-secondary { @apply text-white/80; }
.text-tertiary { @apply text-white/60; }
.text-quaternary { @apply text-white/40; }
.text-disabled { @apply text-white/30; }

/* Spacing Hierarchy */
.section-gap { @apply space-y-12; }
.card-gap { @apply gap-8; }
.content-gap { @apply space-y-6; }
.element-gap { @apply gap-4; }
```

## Before/After Examples

### Example 1: Dashboard Metrics

#### Before (2/10)
```jsx
<div className="glass rounded-xl p-4">
  <div className="flex items-center gap-3">
    <Activity className="w-4 h-4 text-blue-400" />
    <div>
      <div className="text-xl">42</div>
      <div className="text-xs text-white/50">Active</div>
    </div>
  </div>
</div>
```

#### After (9/10)
```jsx
<div className="card-hero cursor-pointer group">
  <div className="flex items-center gap-4">
    <div className="p-3 rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500/30
                    transition-colors">
      <Activity className="w-6 h-6 text-cyan-400" />
    </div>
    <div className="space-y-1">
      <div className="text-4xl font-bold text-primary
                      group-hover:text-cyan-300 transition-colors">
        42
      </div>
      <div className="text-sm text-tertiary group-hover:text-secondary
                      transition-colors">
        Active Peers
      </div>
    </div>
  </div>
  <div className="mt-6 pt-4 border-t border-white/10">
    <div className="flex items-center justify-between">
      <span className="text-xs text-quaternary">Last 24h</span>
      <span className="text-xs text-green-400 font-medium">+12%</span>
    </div>
  </div>
</div>
```

### Example 2: Action Buttons

#### Before (2/10)
```jsx
<button className="px-3 py-1.5 rounded-lg bg-blue-500 text-sm">
  Start Scan
</button>
<button className="px-3 py-1.5 rounded-lg bg-white/10 text-sm">
  Cancel
</button>
```

#### After (9/10)
```jsx
<button className="btn-primary">
  <Search className="w-5 h-5" />
  Start Scan
</button>
<button className="btn-secondary">
  Cancel
</button>
```

### Example 3: Repository Cards

#### Before (2/10)
```jsx
<div className="p-3 glass rounded-lg">
  <div className="text-sm">{repo.name}</div>
  <div className="text-xs text-white/50">{repo.description}</div>
  <div className="flex gap-1 mt-2">
    <button className="flex-1 px-2 py-1 rounded text-xs">Pull</button>
    <button className="flex-1 px-2 py-1 rounded text-xs">Push</button>
  </div>
</div>
```

#### After (9/10)
```jsx
<div className="card-standard group cursor-pointer">
  <div className="flex items-start gap-4 mb-6">
    <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20
                    transition-all duration-300">
      <FolderGit className="w-6 h-6 text-cyan-400" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-lg font-semibold text-primary group-hover:text-cyan-300
                     truncate transition-colors">
        {repo.name}
      </h4>
      <p className="text-sm text-tertiary group-hover:text-secondary
                    line-clamp-2 mt-1 transition-colors">
        {repo.description}
      </p>
    </div>
  </div>

  <div className="flex gap-3">
    <button className="btn-secondary flex-1 gap-2">
      <Download className="w-4 h-4" />
      Pull
    </button>
    <button className="btn-primary flex-1 gap-2">
      <Upload className="w-4 h-4" />
      Push
    </button>
  </div>
</div>
```

## Implementation Checklist

- [ ] Update index.css with hierarchy utilities
- [ ] Update Dashboard.tsx with hero metrics and proper spacing
- [ ] Update Scanner.tsx with prominent CTA buttons
- [ ] Update Repositories.tsx with elevated cards
- [ ] Update Deploy.tsx with clear action hierarchy
- [ ] Update Friends.tsx with proper list density
- [ ] Update Monitor.tsx with status indicators
- [ ] Test all hover states and transitions
- [ ] Verify focus states for accessibility
- [ ] Check mobile responsiveness

## Visual Flow Guide

1. **Eye naturally moves to**: Largest, brightest, highest contrast elements
2. **Primary actions should**: Stand out with size, color, and glow
3. **Secondary info should**: Support but not compete
4. **Tertiary info should**: Be discoverable but quiet
5. **Disabled/inactive should**: Clearly appear non-interactive

## Accessibility Notes

- Maintain 4.5:1 contrast ratio for text
- Focus rings visible on all interactive elements
- Clear hover states for discoverability
- Logical tab order following visual hierarchy
- ARIA labels match visual prominence
