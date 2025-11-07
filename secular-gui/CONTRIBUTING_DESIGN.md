# Contributing to the Design System

Guidelines for maintaining and extending the Secular GUI design system.

---

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Adding New Components](#adding-new-components)
3. [Modifying Existing Components](#modifying-existing-components)
4. [Updating Design Tokens](#updating-design-tokens)
5. [Documentation Requirements](#documentation-requirements)
6. [Code Review Checklist](#code-review-checklist)
7. [Testing Guidelines](#testing-guidelines)

---

## Before You Start

### Read the Documentation

Familiarize yourself with:
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Complete design system reference
- [FIGMA_INTEGRATION.md](./FIGMA_INTEGRATION.md) - Figma sync process
- [ComponentShowcase.tsx](./src/views/ComponentShowcase.tsx) - Component examples

### Check Existing Components

Before creating new components:
1. Search the codebase for similar functionality
2. Review the Controls showcase in the app
3. Check if existing components can be extended

### Discuss Major Changes

For significant additions:
1. Open a GitHub issue describing the component
2. Share mockups or Figma links
3. Get feedback from the team
4. Proceed with implementation

---

## Adding New Components

### Step 1: Plan the Component

**Define the Purpose:**
- What problem does it solve?
- Who will use it?
- What are the use cases?

**Design the API:**
```typescript
interface NewComponentProps {
  // Required props
  value: number;
  onChange: (value: number) => void;

  // Optional configuration
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;

  // Visual options
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';

  // Accessibility
  label?: string;
  'aria-label'?: string;
}
```

**Plan State Management:**
- What state is needed?
- What's controlled vs uncontrolled?
- What side effects exist?

### Step 2: Create the Component File

**File Structure:**
```
src/
  components/
    controls/
      NewComponent.tsx       ← Component implementation
      __tests__/
        NewComponent.test.tsx ← Unit tests
      index.ts              ← Update exports
```

**Component Template:**
```typescript
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export interface NewComponentProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * NewComponent - Brief description
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */
export function NewComponent({
  label,
  value,
  onChange,
  size = 'md',
  disabled = false,
}: NewComponentProps) {
  // State
  const [isActive, setIsActive] = useState(false);

  // Refs
  const elementRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleInteraction = () => {
    if (disabled) return;
    // Handle interaction
  };

  return (
    <div
      ref={elementRef}
      className="glass rounded-lg"
      role="widget"
      aria-label={label}
      aria-disabled={disabled}
    >
      {/* Component UI */}
    </div>
  );
}
```

### Step 3: Follow Design Patterns

**Use Existing Utilities:**
```typescript
// Import shared animation presets
import { getRotationSpring, getPositionSpring } from '../../hooks/useAnimation';

// Import design tokens
import { designTokens } from '../../design-tokens';

// Use Tailwind classes
className="glass rounded-lg hover:bg-white/10 transition-colors"
```

**Size Variants:**
```typescript
const sizeConfig = {
  sm: { width: 48, height: 48, fontSize: 'text-xs' },
  md: { width: 64, height: 64, fontSize: 'text-sm' },
  lg: { width: 80, height: 80, fontSize: 'text-base' },
};

const config = sizeConfig[size];
```

**Color System:**
```typescript
// Use semantic colors
const getStatusColor = (status: Status): string => {
  const colors = {
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(250, 204, 21)',
    error: 'rgb(239, 68, 68)',
  };
  return colors[status];
};
```

### Step 4: Add Accessibility

**Required Attributes:**
```typescript
<div
  role="slider"
  aria-label={label}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-disabled={disabled}
  tabIndex={disabled ? -1 : 0}
  onKeyDown={handleKeyDown}
>
```

**Keyboard Navigation:**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      e.preventDefault();
      onChange(Math.min(max, value + step));
      break;
    case 'ArrowDown':
    case 'ArrowLeft':
      e.preventDefault();
      onChange(Math.max(min, value - step));
      break;
    case 'Home':
      e.preventDefault();
      onChange(min);
      break;
    case 'End':
      e.preventDefault();
      onChange(max);
      break;
  }
};
```

**Screen Reader Announcements:**
```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {`${label} value changed to ${value}`}
</div>
```

### Step 5: Write Tests

**Test File Template:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders with label', () => {
    render(<NewComponent label="Test" value={50} onChange={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onChange when interacted', () => {
    const handleChange = jest.fn();
    render(<NewComponent label="Test" value={50} onChange={handleChange} />);

    // Simulate interaction
    fireEvent.click(screen.getByRole('widget'));

    expect(handleChange).toHaveBeenCalled();
  });

  it('respects disabled state', () => {
    const handleChange = jest.fn();
    render(
      <NewComponent
        label="Test"
        value={50}
        onChange={handleChange}
        disabled
      />
    );

    fireEvent.click(screen.getByRole('widget'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', () => {
    const handleChange = jest.fn();
    render(<NewComponent label="Test" value={50} onChange={handleChange} />);

    const widget = screen.getByRole('widget');
    fireEvent.keyDown(widget, { key: 'ArrowUp' });

    expect(handleChange).toHaveBeenCalledWith(51);
  });
});
```

### Step 6: Add to ComponentShowcase

**Update ComponentShowcase.tsx:**
```typescript
import { NewComponent } from '../components/controls/NewComponent';

// Inside ComponentShowcase component:
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.7 }}
  className="glass rounded-2xl p-8"
>
  <div className="flex items-center gap-2 mb-4">
    <Code className="w-5 h-5 text-primary-400" />
    <h2 className="text-xl font-bold">NewComponent</h2>
  </div>

  <p className="text-white/60 mb-6 text-sm">
    Brief description of what the component does and its key features.
  </p>

  <div className="grid grid-cols-3 gap-8">
    <NewComponent
      label="Example 1"
      value={newValue1}
      onChange={setNewValue1}
      size="sm"
    />

    <NewComponent
      label="Example 2"
      value={newValue2}
      onChange={setNewValue2}
      size="md"
    />

    <NewComponent
      label="Example 3"
      value={newValue3}
      onChange={setNewValue3}
      size="lg"
    />
  </div>

  {/* Code example */}
  <div className="mt-6 bg-black/30 rounded-lg p-4 font-mono text-sm">
    <div className="text-green-400">// Basic usage</div>
    <div className="text-white/80">
      {'<NewComponent'}
      <div className="ml-4">label="Value"</div>
      <div className="ml-4">value={'{value}'}</div>
      <div className="ml-4">onChange={'{setValue}'}</div>
      {'/>'}
    </div>
  </div>
</motion.section>
```

### Step 7: Update Documentation

**Add to DESIGN_SYSTEM.md:**

1. Component section:
```markdown
#### NewComponent

Brief description of the component.

\`\`\`jsx
<NewComponent
  label="Volume"
  value={value}
  min={0}
  max={100}
  onChange={setValue}
  size="md"
/>
\`\`\`

**Features:**
- Feature 1
- Feature 2
- Feature 3

**Props:**
- `label` - Accessible label
- `value` - Current value
- `onChange` - Value change handler
- `size` - Component size (sm, md, lg)
- `disabled` - Disable interactions

**Sizes:** `sm` (48px), `md` (64px), `lg` (80px)
```

2. Usage guidelines section:
```markdown
**NewComponent**
- ✅ Use case 1
- ✅ Use case 2
- ❌ Anti-pattern 1
- ❌ Anti-pattern 2
```

### Step 8: Update Exports

**Update src/components/controls/index.ts:**
```typescript
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

---

## Modifying Existing Components

### Before Making Changes

1. **Understand the Impact:**
   - Who uses this component?
   - What projects depend on it?
   - Are there breaking changes?

2. **Review Existing Tests:**
   - Ensure all tests pass
   - Add tests for new behavior
   - Update tests for changed behavior

3. **Check Dependencies:**
   - What other components use this?
   - Are there cascade effects?

### Making Changes

**For Bug Fixes:**
- Fix the issue
- Add regression test
- Update documentation if needed
- No version bump required

**For New Features:**
- Add new props (optional, with defaults)
- Maintain backward compatibility
- Add tests for new features
- Update ComponentShowcase
- Document new functionality
- Minor version bump

**For Breaking Changes:**
- Justify the breaking change
- Discuss with team first
- Create migration guide
- Update all usages in codebase
- Major version bump
- Add CHANGELOG entry

### Example: Adding Optional Prop

```typescript
// Before
export interface KnobProps {
  value: number;
  onChange: (value: number) => void;
}

// After (backward compatible)
export interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  // New optional prop with default
  showTooltip?: boolean;
}

export function Knob({
  value,
  onChange,
  showTooltip = false, // Default value
}: KnobProps) {
  // Implementation
}
```

---

## Updating Design Tokens

### When to Update Tokens

- Adding new colors
- Changing spacing scale
- Updating typography
- Modifying component sizes
- Adding new shadow styles

### Update Process

1. **Update design-tokens.json:**
```json
{
  "colors": {
    "accent": {
      "newColor": { "value": "#ff5733", "type": "color" }
    }
  }
}
```

2. **Update design-tokens.css:**
```css
:root {
  --color-accent-new: #ff5733;
}
```

3. **Update design-tokens.ts:**
```typescript
export const designTokens = {
  colors: {
    accent: {
      newColor: '#ff5733',
    },
  },
} as const;
```

4. **Update tailwind.config.js:**
```javascript
theme: {
  extend: {
    colors: {
      accent: {
        new: '#ff5733',
      },
    },
  },
}
```

5. **Update DESIGN_SYSTEM.md:**
- Add new token to relevant table
- Explain usage context
- Provide examples

6. **Sync with Figma:**
- Import updated tokens
- Update Figma styles
- Notify design team

---

## Documentation Requirements

Every new component must include:

### 1. Code Documentation

**TypeScript Interface:**
```typescript
/**
 * Props for the NewComponent
 */
export interface NewComponentProps {
  /** Accessible label for screen readers */
  label: string;

  /** Current value (controlled) */
  value: number;

  /** Callback when value changes */
  onChange: (value: number) => void;

  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
}
```

**Component JSDoc:**
```typescript
/**
 * NewComponent - Brief one-line description
 *
 * Longer description explaining what the component does,
 * when to use it, and any important details.
 *
 * @example
 * ```tsx
 * <NewComponent
 *   label="Volume"
 *   value={volume}
 *   onChange={setVolume}
 * />
 * ```
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Accessibility support
 */
```

### 2. README Section

Add to DESIGN_SYSTEM.md:
- Component description
- Visual examples
- Props table
- Usage guidelines
- Do's and Don'ts

### 3. ComponentShowcase Entry

- Interactive examples
- All size variants
- All states (default, hover, active, disabled)
- Code snippets

### 4. Figma Component

- Matching Figma component
- Component properties
- All variants
- Annotations

---

## Code Review Checklist

Before submitting a PR, verify:

### Functionality
- [ ] Component works as expected
- [ ] All props are functional
- [ ] Edge cases handled
- [ ] No console errors/warnings

### Code Quality
- [ ] Follows TypeScript best practices
- [ ] Uses existing design tokens
- [ ] Consistent with other components
- [ ] No hardcoded values
- [ ] Proper error handling

### Accessibility
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader tested
- [ ] Color contrast meets WCAG AA

### Testing
- [ ] Unit tests written
- [ ] All tests passing
- [ ] Edge cases covered
- [ ] Accessibility tests included

### Documentation
- [ ] TypeScript interfaces documented
- [ ] JSDoc comments added
- [ ] DESIGN_SYSTEM.md updated
- [ ] ComponentShowcase updated
- [ ] README examples added

### Performance
- [ ] No unnecessary re-renders
- [ ] Animations smooth (60fps)
- [ ] No memory leaks
- [ ] Proper cleanup in useEffect

### Design Consistency
- [ ] Matches Figma designs
- [ ] Uses glass effects correctly
- [ ] Follows spacing system
- [ ] Consistent with other components
- [ ] Responsive design

---

## Testing Guidelines

### Unit Tests

**Test Coverage Requirements:**
- Rendering with different props
- User interactions (click, drag, keyboard)
- State changes
- Edge cases (min/max values, disabled states)
- Accessibility features

**Example Test Suite:**
```typescript
describe('NewComponent', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {});
    it('renders with all props', () => {});
    it('applies size variants correctly', () => {});
  });

  describe('Interactions', () => {
    it('handles click events', () => {});
    it('handles drag events', () => {});
    it('handles keyboard input', () => {});
  });

  describe('State Management', () => {
    it('updates internal state', () => {});
    it('calls onChange callback', () => {});
    it('respects controlled value', () => {});
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {});
    it('supports keyboard navigation', () => {});
    it('announces changes to screen readers', () => {});
  });

  describe('Edge Cases', () => {
    it('handles disabled state', () => {});
    it('clamps values to min/max', () => {});
    it('handles rapid updates', () => {});
  });
});
```

### Visual Testing

**Manual Testing:**
1. Test all size variants
2. Test all states (default, hover, active, disabled)
3. Test with different values
4. Test responsive behavior
5. Test in light/dark mode
6. Test with browser zoom

**Automated Testing:**
Consider adding visual regression tests:
```typescript
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

it('matches visual snapshot', () => {
  const { container } = render(<NewComponent {...props} />);
  expect(container).toMatchImageSnapshot();
});
```

### Performance Testing

**Check Performance:**
```typescript
import { measurePerformance } from '@testing-library/react';

it('renders quickly', () => {
  const start = performance.now();
  render(<NewComponent {...props} />);
  const end = performance.now();

  expect(end - start).toBeLessThan(100); // <100ms
});
```

**Animation Performance:**
- Use Chrome DevTools Performance tab
- Record interaction
- Check for 60fps (16.67ms per frame)
- Optimize if needed

---

## Common Patterns

### Controlled vs Uncontrolled

**Controlled (Recommended):**
```typescript
export function Component({ value, onChange }: Props) {
  return (
    <div onClick={() => onChange(value + 1)}>
      {value}
    </div>
  );
}
```

**Uncontrolled (with defaultValue):**
```typescript
export function Component({ defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div onClick={() => handleChange(value + 1)}>
      {value}
    </div>
  );
}
```

### Handling Animations

**Use Framer Motion:**
```typescript
<motion.div
  animate={{ scale: isActive ? 1.1 : 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
```

**Use CSS Transitions:**
```typescript
<div className="transition-all duration-300 hover:scale-105">
```

### Managing Refs

```typescript
const elementRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!elementRef.current) return;

  // Use ref
  elementRef.current.focus();
}, []);

return <div ref={elementRef} />;
```

---

## Questions?

- **Slack**: #design-system channel
- **GitHub**: Open an issue with `design-system` label
- **Email**: design-team@secular.com
- **Office Hours**: Tuesdays 2pm-3pm PT

---

## Resources

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Version**: 0.1.0
**Updated**: 2025-11-05
