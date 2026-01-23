# Accessibility Guidelines (WCAG 2.1 AA Compliance)

## Overview

PeopleFlow HR Suite is committed to providing an accessible experience for all users, including those with disabilities. We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

## WCAG 2.1 AA Success Criteria

### 1. Perceivable

#### 1.1 Text Alternatives
**Status**: ✅ Compliant

- All images have alt text
- Icons use `aria-label` or `aria-hidden="true"`
- Form inputs have associated labels

```tsx
// Example: Icon with aria-hidden
<Cancel01Icon aria-hidden="true" className="h-5 w-5" />

// Example: Button with aria-label
<Button aria-label="Close menu">
  <CloseIcon />
</Button>
```

#### 1.2 Time-based Media
**Status**: ✅ Compliant

- Not applicable (no video/audio content currently)

#### 1.3 Adaptable
**Status**: ✅ Compliant

- Semantic HTML (header, nav, main, footer)
- Proper heading hierarchy (h1 → h2 → h3)
- Responsive layout works at all zoom levels
- Content order makes sense when CSS is disabled

```tsx
// Example: Semantic structure
<header role="banner">
  <nav aria-label="Main navigation">
    {/* Navigation links */}
  </nav>
</header>

<main id="main-content" role="main">
  {/* Page content */}
</main>
```

#### 1.4 Distinguishable
**Status**: ✅ Compliant

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Text Resize**: Content readable at 200% zoom
- **Focus Indicators**: Visible focus states on all interactive elements
- **Responsive Text**: Uses relative units (rem, em)

### 2. Operable

#### 2.1 Keyboard Accessible
**Status**: ✅ Compliant

- All functionality available via keyboard
- No keyboard traps
- Skip to main content link
- Tab order follows visual order

```tsx
// Example: Skip link
<a className="skip-link" href="#main-content">
  Skip to main content
</a>

// Example: Keyboard-friendly button
<Button
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  Submit
</Button>
```

#### 2.2 Enough Time
**Status**: ✅ Compliant

- No time limits on user input
- Session timeout warnings provided
- Users can extend timeouts

#### 2.3 Seizures and Physical Reactions
**Status**: ✅ Compliant

- No flashing content
- Respects `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 2.4 Navigable
**Status**: ✅ Compliant

- Skip link to main content
- Page titles describe topic
- Focus order is logical
- Link text describes purpose
- Multiple ways to find pages (nav, search)
- Headings and labels are descriptive
- Focus visible

```tsx
// Example: Descriptive link text
// ❌ Bad
<Link to="/employees">Click here</Link>

// ✅ Good
<Link to="/employees">View all employees</Link>

// Example: Descriptive page title
<title>Dashboard - PeopleFlow HR Suite</title>
```

#### 2.5 Input Modalities
**Status**: ✅ Compliant

- Touch targets minimum 44x44px
- Pointer gestures have keyboard alternatives
- No device-specific features required

```tsx
// Example: Touch-friendly buttons
<Button className="tap-target min-h-[44px] min-w-[44px]">
  Submit
</Button>
```

### 3. Understandable

#### 3.1 Readable
**Status**: ✅ Compliant

- Language specified (`<html lang="en">`)
- Clear, simple language used
- Technical terms explained

#### 3.2 Predictable
**Status**: ✅ Compliant

- Consistent navigation across pages
- Components behave consistently
- No context changes on focus
- Navigation order is consistent

```tsx
// Example: Consistent navigation
export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/employees", label: "Employees" },
    // ... consistent across all pages
  ] as const;
}
```

#### 3.3 Input Assistance
**Status**: ✅ Compliant

- Error identification and suggestions
- Form labels and instructions
- Error prevention for critical actions
- Confirmation dialogs for destructive actions

```tsx
// Example: Form validation with error messages
<Input
  aria-invalid={hasError}
  aria-describedby="email-error"
  label="Email"
  type="email"
/>
{hasError && (
  <p id="email-error" className="text-red-500">
    Please enter a valid email address
  </p>
)}
```

### 4. Robust

#### 4.1 Compatible
**Status**: ✅ Compliant

- Valid HTML
- Proper ARIA usage
- Compatible with assistive technologies
- Name, role, value available for all UI components

```tsx
// Example: Proper ARIA for custom components
<Button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
  aria-haspopup="true"
>
  Options
</Button>
<div id="dropdown-menu" role="menu">
  {/* Menu items */}
</div>
```

## Accessibility Features Implemented

### 1. Skip to Content Link

Allows keyboard users to skip navigation and go directly to main content.

```tsx
// Location: src/components/skip-link.tsx
<a className="skip-link" href="#main-content">
  Skip to main content
</a>
```

### 2. ARIA Landmarks

Proper semantic HTML and ARIA landmarks for screen readers.

```tsx
<header role="banner">
  <nav aria-label="Main navigation">
    {/* Navigation */}
  </nav>
</header>

<main id="main-content" role="main" tabIndex={-1}>
  {/* Main content */}
</main>
```

### 3. Focus Management

Visible focus indicators and logical tab order.

```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary;
}
```

### 4. Screen Reader Support

- Screen reader only text (`.sr-only` class)
- ARIA labels for interactive elements
- Live region announcements for dynamic content

```tsx
// Example: Screen reader announcement
import { announce } from "@/lib/accessibility";

announce("Employee added successfully", "polite");
```

### 5. Keyboard Navigation

All interactive elements accessible via keyboard:

- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter/Space: Activate buttons
- Escape: Close modals/menus
- Arrow keys: Navigate within components

### 6. Touch-Friendly Design

All interactive elements meet minimum 44x44px size requirement.

```css
.tap-target {
  @apply min-h-[44px] min-w-[44px];
}
```

### 7. Reduced Motion Support

Respects user's motion preferences.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8. High Contrast Support

Enhanced outlines for high contrast mode.

```css
@media (prefers-contrast: high) {
  * {
    outline-width: 2px;
  }
}
```

## Accessibility Utilities

### CSS Classes

```css
/* Screen reader only */
.sr-only

/* Skip link */
.skip-link

/* Touch-friendly sizing */
.tap-target

/* Safe area insets for mobile */
.safe-area-inset-top
.safe-area-inset-bottom
.safe-area-inset-left
.safe-area-inset-right
```

### JavaScript Utilities

Located in `src/lib/accessibility.ts`:

```tsx
// Announce to screen readers
announce(message: string, priority: "polite" | "assertive")

// Focus management
trapFocus(element: HTMLElement)
handleSkipToContent(targetId: string)

// User preferences
prefersReducedMotion(): boolean

// Keyboard constants
Keys.ENTER, Keys.ESCAPE, Keys.ARROW_UP, etc.

// ARIA roles
AriaRoles.BUTTON, AriaRoles.DIALOG, etc.
```

## Testing Accessibility

### Automated Testing

```bash
# Run accessibility tests
npm run test:a11y
```

### Manual Testing

1. **Keyboard Navigation**
   - Can you access all interactive elements with Tab?
   - Can you activate buttons with Enter/Space?
   - Can you close modals with Escape?

2. **Screen Reader Testing**
   - NVDA (Windows): https://www.nvaccess.org/
   - JAWS (Windows): https://www.freedomscientific.com/products/software/jaws/
   - VoiceOver (Mac/iOS): Built-in
   - TalkBack (Android): Built-in

3. **Browser Extensions**
   - axe DevTools: https://www.deque.com/axe/devtools/
   - WAVE: https://wave.webaim.org/extension/
   - Lighthouse (Chrome DevTools)

4. **Color Contrast**
   - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - Chrome DevTools: Inspect > Accessibility > Contrast

5. **Zoom Testing**
   - Test at 200% zoom
   - Test at 400% zoom (mobile)
   - Ensure content remains accessible

### Common Issues to Check

- [ ] All images have alt text
- [ ] Forms have labels
- [ ] Color contrast meets AA standards
- [ ] Focus indicators are visible
- [ ] Skip link works
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] No keyboard traps
- [ ] Touch targets are large enough
- [ ] Content works at 200% zoom

## Best Practices

### 1. Use Semantic HTML

```tsx
// ✅ Good
<button onClick={handleClick}>Submit</button>

// ❌ Bad
<div onClick={handleClick}>Submit</div>
```

### 2. Provide Text Alternatives

```tsx
// ✅ Good
<img src="logo.png" alt="PeopleFlow HR Suite logo" />

// ❌ Bad
<img src="logo.png" />
```

### 3. Use ARIA Appropriately

```tsx
// ✅ Good: ARIA supplements HTML
<button aria-expanded={isOpen}>Menu</button>

// ❌ Bad: Overusing ARIA
<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>
  // Just use <button>!
</div>
```

### 4. Test with Real Users

- Include users with disabilities in testing
- Use assistive technologies
- Get feedback early and often

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Accessibility Statement

PeopleFlow HR Suite is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

### Feedback

If you encounter any accessibility barriers, please contact us:
- Email: accessibility@peopleflow.com
- Phone: [Your phone number]

We welcome your feedback and will work to resolve any issues promptly.

---

**Last Updated**: 2026-01-23
**Compliance Level**: WCAG 2.1 Level AA
