# Responsive Design System

## Overview

PeopleFlow HR Suite is designed to work seamlessly across all device sizes, from mobile phones (320px) to large desktop monitors (2560px+).

## Breakpoints

The application uses Tailwind CSS 4 default breakpoints:

| Breakpoint | Min Width | Device Type |
|------------|-----------|-------------|
| `sm` | 640px | Small tablets (portrait) |
| `md` | 768px | Tablets (landscape), small laptops |
| `lg` | 1024px | Laptops, desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

## Mobile-First Approach

All styles are written mobile-first, meaning base styles apply to mobile devices and are progressively enhanced for larger screens.

```tsx
// ✅ Correct: Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">

// ❌ Wrong: Desktop-first approach
<div className="text-lg md:text-base sm:text-sm">
```

## Responsive Utilities

### Typography

Responsive typography classes automatically scale text based on screen size:

```tsx
// Page titles
<h1 className="text-responsive-3xl font-bold">Dashboard</h1>

// Section titles
<h2 className="text-responsive-2xl font-semibold">Quick Actions</h2>

// Body text
<p className="text-responsive-base">Description text</p>

// Small text
<span className="text-responsive-sm text-muted-foreground">Helper text</span>
```

Available classes:
- `text-responsive-xs` - Extra small (xs → sm)
- `text-responsive-sm` - Small (sm → base)
- `text-responsive-base` - Base (base → lg)
- `text-responsive-lg` - Large (lg → xl)
- `text-responsive-xl` - Extra large (xl → 2xl)
- `text-responsive-2xl` - Heading 2 (2xl → 3xl → 4xl)
- `text-responsive-3xl` - Heading 1 (3xl → 4xl → 5xl)

### Spacing

#### Container Padding
```tsx
// Consistent responsive padding
<div className="container-padding">
  // px-4 sm:px-6 lg:px-8
</div>
```

#### Section Spacing
```tsx
// Vertical spacing between sections
<div className="section-spacing">
  // space-y-4 md:space-y-6 lg:space-y-8
</div>
```

### Grid Layouts

Pre-configured responsive grid utilities:

```tsx
// Auto-responsive 4-column grid
<div className="grid-responsive">
  // grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
</div>

// 2-column grid
<div className="grid-responsive-2">
  // grid-cols-1 md:grid-cols-2
</div>

// 3-column grid
<div className="grid-responsive-3">
  // grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
</div>
```

### Flex Layouts

```tsx
// Column on mobile, row on desktop
<div className="flex-col-mobile">
  // flex flex-col md:flex-row
</div>

// Reverse column on mobile
<div className="flex-col-reverse-mobile">
  // flex flex-col-reverse md:flex-row
</div>
```

### Touch Targets

Ensure all interactive elements meet the minimum 44x44px size requirement:

```tsx
<Button className="tap-target">
  // min-h-[44px] min-w-[44px]
</Button>
```

### Safe Area Insets

For PWA and mobile devices with notches:

```tsx
<div className="safe-area-inset-top">
  // padding-top: env(safe-area-inset-top)
</div>
```

## Component Patterns

### Header Navigation

The header adapts from a horizontal navigation to a hamburger menu on mobile:

```tsx
// Desktop: Horizontal nav
// Mobile: Hamburger menu with slide-out navigation
<Header />
```

### Tables

Tables automatically switch to a card-based layout on mobile using the `ResponsiveTable` component:

```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table";

<ResponsiveTable
  columns={[
    {
      key: "name",
      header: "Name",
      render: (item) => item.name,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => <Button>Edit</Button>,
      hideOnMobile: true, // Hide on mobile
    },
  ]}
  data={employees}
  keyExtractor={(item) => item.id}
/>
```

### Page Layout

Standard page layout pattern:

```tsx
function EmployeesPage() {
  return (
    <div className="container-padding section-spacing py-4 md:py-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-6">
        <div>
          <h1 className="text-responsive-2xl font-bold">Employees</h1>
          <p className="text-responsive-sm text-muted-foreground">
            Manage your organization's employees
          </p>
        </div>
        <Link className="self-start sm:self-auto" to="/employees/new">
          <Button className="tap-target w-full sm:w-auto">
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="grid-responsive-3 gap-3 sm:gap-4">
        {/* Cards or items */}
      </div>
    </div>
  );
}
```

### Cards

Cards should have responsive padding and adapt their internal layout:

```tsx
<Card className="p-4 sm:p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3 sm:gap-4">
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="text-responsive-base truncate font-semibold">
          Title
        </h3>
        <p className="text-responsive-xs text-muted-foreground">
          Description
        </p>
      </div>
    </div>

    {/* Actions/Stats */}
    <div className="flex items-center justify-between border-t border-border pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
      <p className="text-responsive-lg font-semibold">$1,234</p>
      <p className="text-responsive-xs text-muted-foreground">Details</p>
    </div>
  </div>
</Card>
```

### Forms

Forms should stack vertically on mobile and optionally use a grid on larger screens:

```tsx
<form className="space-y-4">
  {/* Mobile: Stack, Desktop: 2 columns */}
  <div className="grid gap-4 md:grid-cols-2">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>

  {/* Full width */}
  <Input label="Email" />

  {/* Submit button */}
  <Button className="tap-target w-full md:w-auto" type="submit">
    Submit
  </Button>
</form>
```

## Testing Responsive Design

### Browser DevTools

1. Open Chrome/Firefox DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test common device sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - iPad Pro (1024x1366)
   - Desktop (1920x1080)

### Physical Devices

Test on actual devices when possible:
- iPhone (iOS Safari)
- Android phone (Chrome)
- Tablet (both orientations)
- Desktop browser

### PWA Installation

After installing as PWA:
- Test all features work offline
- Verify safe area insets on notched devices
- Check that navigation feels native

## Common Responsive Patterns

### 1. Hiding Elements

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">Mobile only</div>
```

### 2. Reordering Content

```tsx
// Reverse order on mobile (useful for showing action buttons first)
<div className="flex flex-col-reverse md:flex-row">
  <div>Content</div>
  <div>Actions</div>
</div>
```

### 3. Responsive Images

```tsx
// Responsive image sizing
<img
  className="h-auto w-full max-w-sm md:max-w-md lg:max-w-lg"
  alt="Description"
  src="/image.png"
/>
```

### 4. Conditional Rendering

For complex responsive behavior, use window width detection:

```tsx
import { useMediaQuery } from "@/hooks/use-media-query";

function Component() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## Accessibility Considerations

1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Text Sizing**: Use relative units (rem, em) for font sizes
3. **Contrast**: Ensure text remains readable at all sizes
4. **Focus Indicators**: Visible focus states on all interactive elements
5. **Keyboard Navigation**: All functionality accessible via keyboard

## Performance Optimization

1. **Images**: Use responsive images with `srcset`
2. **Fonts**: Load only necessary font weights
3. **Code Splitting**: Lazy load mobile/desktop-specific components
4. **CSS**: Use Tailwind's purge to remove unused styles

## Browser Support

- iOS Safari 14+
- Chrome 90+
- Firefox 88+
- Edge 90+
- Samsung Internet 14+

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
