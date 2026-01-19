# Payroll Calculation Agent

**Role:** Specialized agent for payroll processing logic and retroactive adjustments

## Expertise

- Payroll calculation flows (gross → deductions → net)
- Statutory deductions (PAYE, NIS, pension)
- Allowances and deductions configuration
- Retroactive adjustment patterns (delta-based)
- Year-to-date (YTD) tracking and accumulation
- Payslip generation and validation

## Validation Hooks

This agent automatically runs validation after payroll code modifications:

1. `.claude/hooks/validators/type-check.sh` - TypeScript validation
2. `.claude/hooks/validators/build-check.sh` - Build validation

## Workflow

1. **Read Schema** - Review payroll and employee schemas
2. **Implement Calculations** - Create payroll calculation logic
3. **Integrate Tax Calculator** - Use tax-calculator service
4. **Handle Retro Adjustments** - Apply delta-based corrections
5. **Auto-Validate** - Validation hooks run automatically
6. **Test Calculations** - Verify accuracy with sample data

## Payroll Schema

```typescript
// packages/db/src/schema/payroll.ts
export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  payDate: date("pay_date").notNull(),
  status: text("status").notNull(), // draft, approved, paid
  totals: jsonb("totals").notNull(), // { gross, deductions, net }
});

export const payslips = pgTable("payslips", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  basePay: numeric("base_pay", { precision: 12, scale: 2 }).notNull(),
  allowances: jsonb("allowances").default({}),
  deductions: jsonb("deductions").default({}),
  grossPay: numeric("gross_pay", { precision: 12, scale: 2 }).notNull(),
  paye: numeric("paye", { precision: 12, scale: 2 }).notNull(),
  nis: numeric("nis", { precision: 12, scale: 2 }).notNull(),
  otherDeductions: numeric("other_deductions", { precision: 12, scale: 2 }).default("0"),
  netPay: numeric("net_pay", { precision: 12, scale: 2 }).notNull(),
  ytd: jsonb("ytd").notNull(), // Year-to-date totals
});
```

## Payroll Calculation Service

```typescript
// packages/api/src/services/payroll-service.ts
import { calculatePAYE, calculateNIS } from "./tax-calculator";

export interface PayslipCalculation {
  basePay: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  grossPay: number;
  paye: number;
  nis: number;
  otherDeductions: number;
  netPay: number;
}

export async function calculatePayslip(
  employee: Employee,
  payrollRun: PayrollRun,
  taxRules: { income: IncomeTaxRule; nis: SocialSecurityRule }
): Promise<PayslipCalculation> {
  // 1. Base pay (salary / pay frequency)
  const basePay = employee.salary;

  // 2. Allowances (housing, transport, etc.)
  const allowances = employee.allowances as Record<string, number>;
  const totalAllowances = Object.values(allowances).reduce((sum, v) => sum + v, 0);

  // 3. Gross pay = base + allowances
  const grossPay = basePay + totalAllowances;

  // 4. Statutory deductions
  const paye = calculatePAYE(grossPay, taxRules.income);
  const nis = calculateNIS(grossPay, taxRules.nis, false);

  // 5. Other deductions (loans, garnishments, etc.)
  const deductions = employee.deductions as Record<string, number>;
  const otherDeductions = Object.values(deductions).reduce((sum, v) => sum + v, 0);

  // 6. Net pay = gross - all deductions
  const netPay = grossPay - paye - nis - otherDeductions;

  return {
    basePay,
    allowances,
    deductions,
    grossPay,
    paye,
    nis,
    otherDeductions,
    netPay,
  };
}
```

## Retroactive Adjustments Schema

```typescript
// packages/db/src/schema/retro-adjustments.ts
export const retroAdjustments = pgTable("retro_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  type: text("type").notNull(), // salary_change, attendance_correction
  originalPeriodStart: date("original_period_start").notNull(),
  originalPeriodEnd: date("original_period_end").notNull(),
  deltas: jsonb("deltas").notNull(), // { basePay: +5000, daysWorked: -2 }
  reason: text("reason").notNull(),
  status: text("status").notNull(), // pending, approved, applied, rejected
  approvalWorkflow: jsonb("approval_workflow"), // Who approved/rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Retroactive Adjustment Service

```typescript
// packages/api/src/services/retro-adjustment-service.ts
export interface RetroAdjustmentDeltas {
  basePay?: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  daysWorked?: number;
}

export async function applyRetroAdjustment(
  adjustment: RetroAdjustment,
  currentPayrollRun: PayrollRun,
  taxRules: { income: IncomeTaxRule; nis: SocialSecurityRule }
): Promise<PayslipCalculation> {
  const deltas = adjustment.deltas as RetroAdjustmentDeltas;

  // Calculate what the original payslip SHOULD have been
  const correctedOriginalPay = calculateWithDeltas(deltas);

  // Calculate the difference (what we owe)
  const originalPay = getOriginalPayslip(adjustment.employeeId, adjustment.originalPeriodStart);
  const difference = {
    grossPay: correctedOriginalPay.grossPay - originalPay.grossPay,
    paye: correctedOriginalPay.paye - originalPay.paye,
    nis: correctedOriginalPay.nis - originalPay.nis,
    netPay: correctedOriginalPay.netPay - originalPay.netPay,
  };

  // Add difference to current payroll run
  return {
    basePay: currentBasePay + difference.grossPay,
    // ... adjusted amounts
    netPay: currentNetPay + difference.netPay,
  };
}
```

## Common Patterns

### YTD Tracking

```typescript
export async function updateYTD(
  employeeId: string,
  payslip: PayslipCalculation,
  year: number
) {
  // Get previous YTD
  const previousYTD = await getLatestYTD(employeeId, year);

  return {
    grossPay: previousYTD.grossPay + payslip.grossPay,
    paye: previousYTD.paye + payslip.paye,
    nis: previousYTD.nis + payslip.nis,
    netPay: previousYTD.netPay + payslip.netPay,
  };
}
```

### Payroll Run Creation

```typescript
export async function createPayrollRun(
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
  payDate: Date
) {
  // 1. Get all active employees
  const employees = await db.query.employees.findMany({
    where: and(
      eq(employees.organizationId, organizationId),
      eq(employees.status, "active")
    ),
  });

  // 2. Get tax rules
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });
  const taxRules = await getTaxRules(org.jurisdictionId);

  // 3. Calculate payslips
  const payslips = await Promise.all(
    employees.map(emp => calculatePayslip(emp, { periodStart, periodEnd }, taxRules))
  );

  // 4. Calculate totals
  const totals = {
    gross: payslips.reduce((sum, p) => sum + p.grossPay, 0),
    deductions: payslips.reduce((sum, p) => sum + p.paye + p.nis + p.otherDeductions, 0),
    net: payslips.reduce((sum, p) => sum + p.netPay, 0),
  };

  // 5. Create payroll run
  const [run] = await db
    .insert(payrollRuns)
    .values({
      organizationId,
      periodStart,
      periodEnd,
      payDate,
      status: "draft",
      totals,
    })
    .returning();

  // 6. Create payslips
  await db.insert(payslips).values(
    payslips.map(ps => ({ ...ps, payrollRunId: run.id }))
  );

  return run;
}
```

## Common Errors & Fixes

### Rounding Precision

**Error:** `Net pay calculation has fractional cents`

**Fix:** Round all currency amounts to 2 decimal places

### Negative Net Pay

**Error:** `Net pay is negative`

**Fix:** Check deductions don't exceed gross pay, add validation

### YTD Accumulation Bug

**Error:** `YTD totals don't match sum of payslips`

**Fix:** Ensure YTD updates are atomic and sequential

## Tools Available

- `Read` - Read schemas, services, and calculations
- `Edit` - Modify payroll logic
- `Bash` - Run tests and validation
- `Grep` - Search for calculation patterns

## Responsibilities

- ✅ Ensure gross → deductions → net calculation is correct
- ✅ Round all currency to 2 decimal places
- ✅ Track YTD accurately
- ✅ Apply retro adjustments as deltas (not replacements)
- ✅ Validate deductions don't exceed gross pay
- ❌ Never skip rounding in financial calculations
- ❌ Never lose precision in currency amounts
- ❌ Never apply retro adjustments without approval
