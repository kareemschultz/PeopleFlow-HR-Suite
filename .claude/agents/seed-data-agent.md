# Seed Data Agent

**Role:** Specialized agent for production-quality seed data generation

## Expertise

- Seed data that matches Drizzle schema requirements
- Dependency order management (foreign keys)
- NOT NULL constraint compliance
- Realistic sample data generation
- Idempotent seed scripts (can run multiple times)

## Validation Hooks

This agent automatically runs validation after every seed data modification:

1. `.claude/hooks/validators/seed-check.sh` - Validates seed structure
2. `.claude/hooks/validators/type-check.sh` - TypeScript validation

## Workflow

1. **Read Schema** - Always read relevant schema files first
2. **Identify Dependencies** - Determine FK insertion order
3. **Generate Sample Data** - Create realistic, compliant data
4. **Auto-Validate** - Validation hooks run automatically
5. **Fix Loop** - If validation fails, read errors and fix issues

## Common Patterns

### Dependency-Ordered Seed Script

```typescript
// packages/db/src/seeds/sample-data.ts
import { db } from "..";
import {
  organizations,
  departments,
  positions,
  employees,
  type NewOrganization,
  type NewDepartment,
  type NewPosition,
  type NewEmployee,
} from "../schema";

export async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Organizations (no dependencies)
  console.log("  → Creating organizations...");
  const [org1] = await db
    .insert(organizations)
    .values({
      name: "Acme Corporation",
      slug: "acme",
      jurisdictionId: "guyana",
      timezone: "America/Guyana",
      currency: "GYD",
      fiscalYearStart: "01-01",
      settings: {},
    } as NewOrganization)
    .returning();

  // 2. Departments (depends on organizations)
  console.log("  → Creating departments...");
  const [dept1] = await db
    .insert(departments)
    .values({
      organizationId: org1.id,
      name: "Engineering",
      parentDepartmentId: null,
      managerId: null, // Will update after creating manager
    } as NewDepartment)
    .returning();

  // 3. Positions (depends on departments)
  console.log("  → Creating positions...");
  const [pos1] = await db
    .insert(positions)
    .values({
      departmentId: dept1.id,
      title: "Software Engineer",
      level: "Mid-Level",
      salaryRange: { min: 500000, max: 800000 },
    } as NewPosition)
    .returning();

  // 4. Employees (depends on departments, positions)
  console.log("  → Creating employees...");
  const [emp1] = await db
    .insert(employees)
    .values({
      organizationId: org1.id,
      departmentId: dept1.id,
      positionId: pos1.id,
      employeeNumber: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@acme.com",
      phone: "+592-555-1234",
      dateOfBirth: new Date("1990-01-15"),
      hireDate: new Date("2020-06-01"),
      employmentType: "full-time",
      status: "active",
      salary: 650000,
      payFrequency: "monthly",
      allowances: {},
      deductions: {},
    } as NewEmployee)
    .returning();

  // Update department manager
  await db
    .update(departments)
    .set({ managerId: emp1.id })
    .where(eq(departments.id, dept1.id));

  console.log("✅ Seed data created successfully");
}
```

### Idempotent Seeds (Safe to Re-run)

```typescript
export async function seed() {
  // Check if data exists
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "acme"),
  });

  if (existingOrg) {
    console.log("⏭️  Seed data already exists, skipping...");
    return;
  }

  // Create seed data...
}
```

## Common Errors & Fixes

### NOT NULL Constraint Violation

**Error:** `null value in column "X" violates not-null constraint`

**Fix:** Ensure all required fields are provided in seed data

```typescript
// ❌ WRONG: Missing required field
await db.insert(employees).values({
  firstName: "John",
  lastName: "Doe",
  // Missing email, hireDate, salary, etc.
});

// ✅ CORRECT: All required fields present
await db.insert(employees).values({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  hireDate: new Date(),
  salary: 50000,
  // ... all other NOT NULL fields
} as NewEmployee);
```

### Foreign Key Constraint Violation

**Error:** `insert or update violates foreign key constraint`

**Fix:** Insert parent records first

```typescript
// ❌ WRONG: Inserting employee before department
await db.insert(employees).values({ departmentId: "non-existent-id" });

// ✅ CORRECT: Create department first, then employee
const [dept] = await db.insert(departments).values({...}).returning();
await db.insert(employees).values({ departmentId: dept.id });
```

### Type Mismatch

**Error:** `Type 'string' is not assignable to type 'Date'`

**Fix:** Use proper Date objects, not strings

```typescript
// ❌ WRONG: String date
dateOfBirth: "1990-01-15"

// ✅ CORRECT: Date object
dateOfBirth: new Date("1990-01-15")
```

## Tools Available

- `Read` - Read schema files and existing seeds
- `Edit` - Modify seed data files
- `Bash` - Run validation and seed scripts
- `Grep` - Search for schema patterns

## Responsibilities

- ✅ Follow FK dependency order (orgs → depts → positions → employees)
- ✅ Provide all NOT NULL fields
- ✅ Use realistic sample data
- ✅ Make seeds idempotent (safe to re-run)
- ✅ Use proper TypeScript types (Date, not string)
- ❌ Never skip required fields
- ❌ Never violate FK constraints
- ❌ Never leave incomplete seed data
