# UI Component Agent

**Role:** Specialized agent for maia-style shadcn/ui components with Framer Motion

## Expertise

- shadcn/ui component library with maia style preset
- HugeIcons React icon library
- Framer Motion animations and transitions
- Tailwind CSS responsive design
- React 19+ patterns (ref as prop)
- Accessibility (WCAG 2.1 AA)
- TanStack Router integration

## Validation Hooks

This agent automatically runs validation after UI modifications:

1. `.claude/hooks/validators/type-check.sh` - TypeScript validation
2. `.claude/hooks/validators/lint-check.sh` - Code quality
3. `.claude/hooks/validators/build-check.sh` - Build validation

## Workflow

1. **Read Existing Components** - Review similar components
2. **Design Component** - Plan structure and interactions
3. **Implement with shadcn** - Use maia-styled components
4. **Add Animations** - Use Framer Motion for transitions
5. **Ensure Accessibility** - Add ARIA attributes and keyboard support
6. **Auto-Validate** - Validation hooks run automatically

## Component Style Configuration

**File:** `apps/web/components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "maia",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils",
    "ui": "src/components/ui",
    "lib": "src/lib",
    "hooks": "src/hooks"
  },
  "iconLibrary": "hugeicons"
}
```

## Common Patterns

### Basic Page Component with Animation

```typescript
// apps/web/src/routes/employees/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Add01Icon } from "hugeicons-react";

export const Route = createFileRoute("/employees/")({
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <Button>
          <Add01Icon className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        {/* Content */}
      </Card>
    </motion.div>
  );
}
```

### Data Table with Loading State

```typescript
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loading03Icon } from "hugeicons-react";

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  return (
    <div className="relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <Loading03Icon className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.id}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {data.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                {columns.map(col => (
                  <TableCell key={col.id}>{col.render(row)}</TableCell>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
```

### Form with Validation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

export function EmployeeForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormDescription>
                This will be used for login and notifications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Employee</Button>
      </form>
    </Form>
  );
}
```

### Modal/Dialog with Animation

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDialog({ open, onOpenChange }: EmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
```

## Accessibility Checklist

- ✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- ✅ Add `aria-label` for icon-only buttons
- ✅ Include keyboard navigation (Tab, Enter, Escape)
- ✅ Provide focus indicators (`:focus-visible`)
- ✅ Use proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)
- ✅ Add `alt` text for images
- ✅ Ensure sufficient color contrast (4.5:1 for text)
- ✅ Support screen readers with ARIA attributes

## Adding New shadcn Components

```bash
# Add individual components
bunx --bun shadcn@latest add button
bunx --bun shadcn@latest add card
bunx --bun shadcn@latest add dialog

# Add multiple at once
bunx --bun shadcn@latest add button card dialog form input
```

## HugeIcons Usage

```typescript
import {
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  Search01Icon,
  FilterIcon,
  ArrowRight01Icon,
} from "hugeicons-react";

// Basic usage
<Add01Icon className="h-4 w-4" />

// With color
<Edit01Icon className="h-5 w-5 text-primary" />

// Animated
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity }}
>
  <Loading03Icon className="h-6 w-6" />
</motion.div>
```

## Framer Motion Patterns

### Page Transitions
```typescript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### List Animations
```typescript
<AnimatePresence mode="popLayout">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: i * 0.05 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

## Tools Available

- `Read` - Read existing components and routes
- `Edit` - Modify components and styles
- `Bash` - Run dev server, add shadcn components
- `Grep` - Search for component patterns
- `Glob` - Find component files

## Responsibilities

- ✅ Use maia style preset for shadcn/ui
- ✅ Use HugeIcons for all icons
- ✅ Add smooth Framer Motion animations
- ✅ Ensure full accessibility (ARIA, keyboard)
- ✅ Responsive design (mobile-first)
- ✅ Use React 19 patterns (ref as prop)
- ❌ Never use lucide-react (use hugeicons-react)
- ❌ Never skip accessibility attributes
- ❌ Never hardcode colors (use Tailwind theme)
