# PeopleFlow v5.1 - Final Schema Additions

## Multi-Country Tax Jurisdictions (Configurable Formulas)

This allows SaaS customers from ANY country to input their own tax formulas, while keeping Guyana as the default.

```typescript
// packages/db/src/schema/tax-jurisdictions.ts

// ============================================================================
// TAX JURISDICTIONS - Multi-Country Support
// ============================================================================

// Master jurisdiction list (countries/regions)
export const taxJurisdictions = pgTable("tax_jurisdictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Identity
  code: text("code").notNull().unique(), // "GY", "TT", "BB", "US-CA"
  name: text("name").notNull(), // "Guyana", "Trinidad & Tobago"
  country: text("country").notNull(), // ISO 3166-1 alpha-2
  region: text("region"), // For sub-national (e.g., US states)
  
  // Currency
  currency: text("currency").notNull(), // "GYD", "TTD", "USD"
  currencySymbol: text("currency_symbol").notNull(), // "G$", "TT$", "$"
  
  // Timezone
  timezone: text("timezone").notNull(), // "America/Guyana"
  
  // Fiscal year
  fiscalYearStart: integer("fiscal_year_start").default(1), // Month (1-12)
  
  // Status
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Only one can be default
  
  // For SaaS: which orgs use this
  // For Gov: typically just one
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// INCOME TAX RULES (PAYE equivalent for each jurisdiction)
// ============================================================================

export const incomeTaxRules = pgTable("income_tax_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").references(() => taxJurisdictions.id).notNull(),
  
  // Effective period
  taxYear: integer("tax_year").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  
  // Tax bands (progressive rates)
  taxBands: jsonb("tax_bands").$type<{
    order: number;
    name: string; // "First band", "Second band"
    minAmount: number; // 0
    maxAmount: number | null; // null = unlimited
    rate: number; // 0.25 = 25%
    flatAmount?: number; // For flat + percentage systems
  }[]>().notNull(),
  
  // ============================================================================
  // PERSONAL DEDUCTIONS (configurable formula)
  // ============================================================================
  personalDeduction: jsonb("personal_deduction").$type<{
    type: "fixed" | "percentage" | "formula";
    
    // For "fixed": use this amount
    fixedAmount?: number;
    
    // For "percentage": percentage of gross
    percentage?: number;
    
    // For "formula": custom formula
    // Variables available: {gross}, {annualGross}, {dependents}
    formula?: string; // "MAX(1560000, {annualGross} * 0.333)"
    
    // Caps
    minAmount?: number;
    maxAmount?: number;
    
    // Annual vs monthly
    basis: "annual" | "monthly";
  }>().notNull(),
  
  // ============================================================================
  // ALLOWANCES / EXEMPTIONS (configurable)
  // ============================================================================
  allowances: jsonb("allowances").$type<{
    code: string; // "OVERTIME_EXEMPT", "CHILD_ALLOWANCE"
    name: string;
    description: string;
    
    type: "fixed" | "percentage" | "formula";
    value: number;
    formula?: string;
    
    // Caps
    monthlyCap?: number;
    annualCap?: number;
    
    // Conditions
    conditions?: {
      field: string;
      operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte";
      value: unknown;
    }[];
    
    // Taxability
    reducesTaxableIncome: boolean;
  }[]>(),
  
  // ============================================================================
  // CALCULATION SETTINGS
  // ============================================================================
  
  // How to periodize
  periodization: text("periodization").default("annualized"),
  // "annualized" = calculate annual, divide by periods
  // "true_period" = calculate for actual period
  // "cumulative" = YTD calculation
  
  // Rounding (CRITICAL for audits)
  roundingMode: text("rounding_mode").default("nearest"),
  // "nearest" = Math.round
  // "floor" = Math.floor (always round down)
  // "ceil" = Math.ceil (always round up)
  // "banker" = Round half to even
  
  roundingPrecision: integer("rounding_precision").default(1),
  // 1 = round to nearest cent
  // 5 = round to nearest 5 cents
  // 10 = round to nearest 10 cents
  // 100 = round to nearest dollar
  
  // ============================================================================
  // METADATA
  // ============================================================================
  
  sourceUrl: text("source_url"), // Link to official tax authority
  notes: text("notes"),
  
  // Audit
  createdBy: uuid("created_by").references(() => employees.id),
  approvedBy: uuid("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueJurisdictionYear: unique().on(table.jurisdictionId, table.taxYear),
}));

// ============================================================================
// SOCIAL SECURITY RULES (NIS equivalent for each jurisdiction)
// ============================================================================

export const socialSecurityRules = pgTable("social_security_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").references(() => taxJurisdictions.id).notNull(),
  
  // Identity
  name: text("name").notNull(), // "National Insurance Scheme", "Social Security"
  code: text("code").notNull(), // "NIS", "SSA"
  
  // Effective period
  year: integer("year").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  
  // ============================================================================
  // CONTRIBUTION RATES
  // ============================================================================
  
  // Employee contribution
  employeeRate: numeric("employee_rate", { precision: 6, scale: 4 }).notNull(),
  // 0.0560 = 5.6%
  
  // Employer contribution
  employerRate: numeric("employer_rate", { precision: 6, scale: 4 }).notNull(),
  // 0.0840 = 8.4%
  
  // Self-employed rate (if applicable)
  selfEmployedRate: numeric("self_employed_rate", { precision: 6, scale: 4 }),
  
  // ============================================================================
  // EARNINGS LIMITS
  // ============================================================================
  
  // Minimum earnings for contributions
  earningsFloor: integer("earnings_floor"), // null = no minimum
  
  // Maximum earnings subject to contributions
  earningsCeiling: integer("earnings_ceiling"), // null = no ceiling
  
  // ============================================================================
  // CALCULATION SETTINGS
  // ============================================================================
  
  // What earnings are included
  includedEarnings: jsonb("included_earnings").$type<string[]>(),
  // ["basic", "overtime", "allowances"] or ["all"]
  
  excludedEarnings: jsonb("excluded_earnings").$type<string[]>(),
  // ["reimbursements", "severance"]
  
  // Rounding
  roundingMode: text("rounding_mode").default("nearest"),
  roundingPrecision: integer("rounding_precision").default(1),
  
  // ============================================================================
  // METADATA
  // ============================================================================
  
  sourceUrl: text("source_url"),
  notes: text("notes"),
  
  createdBy: uuid("created_by").references(() => employees.id),
  approvedBy: uuid("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueJurisdictionYear: unique().on(table.jurisdictionId, table.year),
}));

// ============================================================================
// FILING REQUIREMENTS (GRA Form equivalent)
// ============================================================================

export const filingRequirements = pgTable("filing_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").references(() => taxJurisdictions.id).notNull(),
  
  // Identity
  code: text("code").notNull(), // "GRA_FORM_2", "BIR_P9"
  name: text("name").notNull(), // "Monthly PAYE Return"
  description: text("description"),
  
  // Type
  filingType: text("filing_type").notNull(),
  // "income_tax_monthly", "income_tax_annual", "social_security", "other"
  
  // Frequency
  frequency: text("frequency").notNull(),
  // "monthly", "quarterly", "annual"
  
  // Due date calculation
  dueDayOfMonth: integer("due_day_of_month"), // 15 = due on 15th
  dueDaysAfterPeriod: integer("due_days_after_period"), // 15 = 15 days after period ends
  
  // Required fields
  requiredFields: jsonb("required_fields").$type<{
    fieldName: string;
    source: string; // "employee.taxId", "payslip.grossEarnings"
    label: string;
    format: "string" | "number" | "currency" | "date";
  }[]>(),
  
  // Export format
  exportFormats: jsonb("export_formats").$type<string[]>(),
  // ["csv", "xlsx", "xml", "pdf"]
  
  // Template (for PDF/custom formats)
  templateUrl: text("template_url"),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ============================================================================
// DEFAULT GUYANA CONFIGURATION
// ============================================================================

export const guyanaJurisdictionSeed = {
  taxJurisdiction: {
    code: "GY",
    name: "Guyana",
    country: "GY",
    currency: "GYD",
    currencySymbol: "G$",
    timezone: "America/Guyana",
    fiscalYearStart: 1,
    isDefault: true,
  },
  
  incomeTaxRules2025: {
    taxYear: 2025,
    effectiveFrom: "2025-01-01",
    
    taxBands: [
      { order: 1, name: "Standard rate", minAmount: 0, maxAmount: 3120000, rate: 0.25 },
      { order: 2, name: "Higher rate", minAmount: 3120000, maxAmount: null, rate: 0.35 },
    ],
    
    personalDeduction: {
      type: "formula",
      formula: "MAX(1560000, {annualGross} * 0.333)",
      basis: "annual",
    },
    
    allowances: [
      {
        code: "OVERTIME_EXEMPT",
        name: "Overtime Exemption",
        description: "Overtime earnings exemption",
        type: "fixed",
        value: 0,
        monthlyCap: 50000,
        annualCap: 600000,
        reducesTaxableIncome: true,
      },
      {
        code: "SECOND_JOB_EXEMPT",
        name: "Second Job Exemption",
        description: "Second employment exemption",
        type: "fixed",
        value: 0,
        monthlyCap: 50000,
        annualCap: 600000,
        reducesTaxableIncome: true,
      },
      {
        code: "CHILD_ALLOWANCE",
        name: "Child Allowance",
        description: "Per-child tax allowance",
        type: "fixed",
        value: 10000,
        monthlyCap: 10000,
        reducesTaxableIncome: true,
      },
    ],
    
    periodization: "annualized",
    roundingMode: "nearest",
    roundingPrecision: 1,
    
    sourceUrl: "https://gra.gov.gy/tax-types/personal-income-tax/",
    notes: "Updated per GRA 2025 budget measures",
  },
  
  nisRules2025: {
    name: "National Insurance Scheme",
    code: "NIS",
    year: 2025,
    effectiveFrom: "2025-01-01",
    
    employeeRate: 0.056, // 5.6%
    employerRate: 0.084, // 8.4%
    
    earningsCeiling: null, // No ceiling
    
    includedEarnings: ["basic", "overtime", "allowances"],
    excludedEarnings: ["reimbursements"],
    
    roundingMode: "nearest",
    roundingPrecision: 1,
    
    sourceUrl: "https://nis.gov.gy/",
  },
  
  filingRequirements: [
    {
      code: "GRA_FORM_2",
      name: "Monthly PAYE Return (Form 2)",
      description: "Monthly employer PAYE remittance",
      filingType: "income_tax_monthly",
      frequency: "monthly",
      dueDayOfMonth: 14,
      requiredFields: [
        { fieldName: "tin", source: "employee.taxId", label: "TIN", format: "string" },
        { fieldName: "nis", source: "employee.nisNumber", label: "NIS Number", format: "string" },
        { fieldName: "name", source: "employee.fullName", label: "Employee Name", format: "string" },
        { fieldName: "gross", source: "payslip.grossEarnings", label: "Gross Earnings", format: "currency" },
        { fieldName: "taxable", source: "payslip.taxableIncome", label: "Taxable Income", format: "currency" },
        { fieldName: "paye", source: "payslip.payeAmount", label: "PAYE Deducted", format: "currency" },
      ],
      exportFormats: ["csv", "xlsx"],
    },
    {
      code: "GRA_FORM_5",
      name: "Annual PAYE Return (Form 5)",
      description: "Annual employer PAYE summary",
      filingType: "income_tax_annual",
      frequency: "annual",
      dueDaysAfterPeriod: 60,
      requiredFields: [
        { fieldName: "tin", source: "employee.taxId", label: "TIN", format: "string" },
        { fieldName: "nis", source: "employee.nisNumber", label: "NIS Number", format: "string" },
        { fieldName: "name", source: "employee.fullName", label: "Employee Name", format: "string" },
        { fieldName: "annualGross", source: "annual.grossEarnings", label: "Annual Gross", format: "currency" },
        { fieldName: "annualTaxable", source: "annual.taxableIncome", label: "Annual Taxable", format: "currency" },
        { fieldName: "annualPaye", source: "annual.payeAmount", label: "Annual PAYE", format: "currency" },
        { fieldName: "monthsWorked", source: "annual.monthsWorked", label: "Months Worked", format: "number" },
      ],
      exportFormats: ["csv", "xlsx", "pdf"],
    },
    {
      code: "NIS_MONTHLY",
      name: "Monthly NIS Contribution Return",
      description: "Monthly NIS contribution remittance",
      filingType: "social_security",
      frequency: "monthly",
      dueDayOfMonth: 14,
      requiredFields: [
        { fieldName: "nis", source: "employee.nisNumber", label: "NIS Number", format: "string" },
        { fieldName: "name", source: "employee.fullName", label: "Employee Name", format: "string" },
        { fieldName: "nisable", source: "payslip.nisableEarnings", label: "NIS-able Earnings", format: "currency" },
        { fieldName: "employee", source: "payslip.nisEmployee", label: "Employee Contribution", format: "currency" },
        { fieldName: "employer", source: "payslip.nisEmployer", label: "Employer Contribution", format: "currency" },
      ],
      exportFormats: ["csv", "xlsx"],
    },
  ],
};
```

## Retroactive Adjustments Schema

```typescript
// packages/db/src/schema/retro-adjustments.ts

// Retroactive payroll adjustments
export const retroAdjustments = pgTable("retro_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  
  // Which payroll run includes this adjustment
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id).notNull(),
  payslipId: uuid("payslip_id").references(() => payslips.id).notNull(),
  
  // What period is being adjusted
  originalPeriodStart: date("original_period_start").notNull(),
  originalPeriodEnd: date("original_period_end").notNull(),
  originalPayrollRunId: uuid("original_payroll_run_id").references(() => payrollRuns.id),
  
  // Employee
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  
  // Adjustment type
  adjustmentType: text("adjustment_type").notNull(),
  // "salary_change", "allowance_added", "attendance_correction", "statutory_correction"
  
  // What changed
  changeDescription: text("change_description").notNull(),
  
  // Amounts
  originalAmount: integer("original_amount").notNull(),
  correctedAmount: integer("corrected_amount").notNull(),
  deltaAmount: integer("delta_amount").notNull(), // corrected - original
  
  // Statutory impact
  originalPaye: integer("original_paye"),
  correctedPaye: integer("corrected_paye"),
  deltaPaye: integer("delta_paye"),
  
  originalNis: integer("original_nis"),
  correctedNis: integer("corrected_nis"),
  deltaNis: integer("delta_nis"),
  
  // Reason
  reason: text("reason").notNull(),
  
  // Supporting documents
  attachments: jsonb("attachments").$type<Attachment[]>(),
  
  // Approval
  requestedBy: uuid("requested_by").references(() => employees.id).notNull(),
  approvedBy: uuid("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Metric Lineage & Dependencies

```typescript
// packages/db/src/schema/metric-lineage.ts

// Metric dependencies (what feeds what)
export const metricDependencies = pgTable("metric_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // The metric that depends on another
  metricKey: text("metric_key").notNull(),
  
  // What it depends on
  dependsOnType: text("depends_on_type").notNull(),
  // "metric", "table", "calculation"
  
  dependsOnKey: text("depends_on_key").notNull(),
  // "headcount" (metric), "employees" (table), "gross_earnings" (calc)
  
  // Relationship
  relationship: text("relationship").default("input"),
  // "input", "filter", "aggregation"
  
  // Description
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data freshness tracking
export const dataFreshness = pgTable("data_freshness", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  
  // What data
  dataType: text("data_type").notNull(),
  // "attendance", "payroll", "leave", "metrics"
  
  // Last update
  lastUpdatedAt: timestamp("last_updated_at").notNull(),
  lastUpdatedBy: uuid("last_updated_by").references(() => employees.id),
  
  // For payroll: is it locked?
  isLocked: boolean("is_locked").default(false),
  lockedAt: timestamp("locked_at"),
  
  // Period covered
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  
  // Status
  status: text("status").default("current"),
  // "current", "stale", "calculating", "locked"
  
  // Next refresh
  nextRefreshAt: timestamp("next_refresh_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueFreshness: unique().on(table.organizationId, table.dataType, table.periodStart),
}));
```

## Anomaly Detection

```typescript
// packages/db/src/schema/anomalies.ts

// Metric anomalies (simple threshold-based)
export const metricAnomalies = pgTable("metric_anomalies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  
  // Which metric
  metricKey: text("metric_key").notNull(),
  metricValueId: uuid("metric_value_id").references(() => metricValues.id),
  
  // Period
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  // The anomaly
  anomalyType: text("anomaly_type").notNull(),
  // "spike", "drop", "threshold_breach", "pattern_break"
  
  // Values
  currentValue: numeric("current_value", { precision: 15, scale: 4 }).notNull(),
  expectedValue: numeric("expected_value", { precision: 15, scale: 4 }),
  previousValue: numeric("previous_value", { precision: 15, scale: 4 }),
  
  // Deviation
  deviationPercent: numeric("deviation_percent", { precision: 8, scale: 2 }),
  deviationAbsolute: numeric("deviation_absolute", { precision: 15, scale: 4 }),
  
  // Severity
  severity: text("severity").default("warning"),
  // "info", "warning", "critical"
  
  // Description
  description: text("description").notNull(),
  
  // Status
  status: text("status").default("open"),
  // "open", "acknowledged", "resolved", "dismissed"
  
  acknowledgedBy: uuid("acknowledged_by").references(() => employees.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolution: text("resolution"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Anomaly rules configuration
export const anomalyRules = pgTable("anomaly_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  // null = global default
  
  metricKey: text("metric_key").notNull(),
  
  // Rule type
  ruleType: text("rule_type").notNull(),
  // "percent_change", "absolute_threshold", "standard_deviation"
  
  // Thresholds
  warningThreshold: numeric("warning_threshold", { precision: 10, scale: 4 }),
  criticalThreshold: numeric("critical_threshold", { precision: 10, scale: 4 }),
  
  // Direction
  direction: text("direction").default("both"),
  // "up", "down", "both"
  
  // Comparison period
  comparisonPeriod: text("comparison_period").default("previous"),
  // "previous", "same_period_last_year", "average_3_months"
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Default anomaly rules
export const defaultAnomalyRules = [
  {
    metricKey: "payroll_cost",
    ruleType: "percent_change",
    warningThreshold: 10,
    criticalThreshold: 25,
    direction: "both",
    comparisonPeriod: "previous",
  },
  {
    metricKey: "overtime_hours",
    ruleType: "percent_change",
    warningThreshold: 30,
    criticalThreshold: 50,
    direction: "up",
    comparisonPeriod: "previous",
  },
  {
    metricKey: "absenteeism_rate",
    ruleType: "percent_change",
    warningThreshold: 20,
    criticalThreshold: 40,
    direction: "up",
    comparisonPeriod: "previous",
  },
  {
    metricKey: "headcount",
    ruleType: "percent_change",
    warningThreshold: 15,
    criticalThreshold: 30,
    direction: "both",
    comparisonPeriod: "previous",
  },
];
```

## Permission Snapshots (Who Could See What When)

```typescript
// packages/db/src/schema/permission-snapshots.ts

// Permission snapshots for audit ("who had access at time X")
export const permissionSnapshots = pgTable("permission_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  
  // User
  userId: uuid("user_id").references(() => users.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id),
  
  // Role at the time
  role: text("role").notNull(),
  
  // Scope at the time
  scope: jsonb("scope").$type<{
    type: "all" | "department" | "employees";
    departmentIds?: string[];
    employeeIds?: string[];
  }>(),
  
  // Effective period
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  
  // Change tracking
  changeType: text("change_type").notNull(),
  // "granted", "revoked", "modified"
  
  changedBy: uuid("changed_by").references(() => employees.id),
  changeReason: text("change_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Query: "Who could access employee X's data on date Y?"
export async function getAccessorsAsOf(
  organizationId: string,
  employeeId: string,
  asOfDate: Date
): Promise<{
  userId: string;
  role: string;
  accessType: "direct" | "department" | "all";
}[]> {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
  });
  
  const snapshots = await db.query.permissionSnapshots.findMany({
    where: and(
      eq(permissionSnapshots.organizationId, organizationId),
      lte(permissionSnapshots.effectiveFrom, asOfDate),
      or(
        isNull(permissionSnapshots.effectiveTo),
        gte(permissionSnapshots.effectiveTo, asOfDate),
      ),
    ),
  });
  
  return snapshots
    .filter(s => {
      // Check if this user could access the employee
      if (s.scope?.type === "all") return true;
      if (s.scope?.type === "department" && 
          s.scope.departmentIds?.includes(employee.departmentId)) return true;
      if (s.scope?.type === "employees" && 
          s.scope.employeeIds?.includes(employeeId)) return true;
      return false;
    })
    .map(s => ({
      userId: s.userId,
      role: s.role,
      accessType: s.scope?.type === "all" ? "all" : 
                  s.scope?.type === "department" ? "department" : "direct",
    }));
}
```

## UI Components for Jurisdiction Management

```typescript
// apps/shared/src/features/settings/jurisdiction-settings.tsx

export function JurisdictionSettings() {
  const { data: jurisdictions } = useQuery({
    queryKey: ["jurisdictions"],
    queryFn: () => api.settings.listJurisdictions.query(),
  });
  
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tax Jurisdictions</h2>
          <p className="text-muted-foreground">
            Configure tax rules for different countries and regions
          </p>
        </div>
        <Button onClick={() => setSelectedJurisdiction("new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Jurisdiction
        </Button>
      </div>
      
      <div className="grid gap-4">
        {jurisdictions?.map(j => (
          <Card key={j.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{j.name}</h3>
                  {j.isDefault && <Badge>Default</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {j.currency} • {j.timezone}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedJurisdiction(j.id)}
                >
                  Configure
                </Button>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tax Year:</span>{" "}
                <span className="font-medium">{j.currentTaxYear}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PAYE Bands:</span>{" "}
                <span className="font-medium">{j.taxBandCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">SS Rate:</span>{" "}
                <span className="font-medium">
                  {(j.employeeRate + j.employerRate) * 100}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Edit Modal */}
      <JurisdictionEditModal
        jurisdictionId={selectedJurisdiction}
        onClose={() => setSelectedJurisdiction(null)}
      />
    </div>
  );
}

// Tax Rules Editor (for custom formulas)
function TaxRulesEditor({ jurisdictionId }: { jurisdictionId: string }) {
  const { data: rules } = useQuery({
    queryKey: ["tax-rules", jurisdictionId],
    queryFn: () => api.settings.getTaxRules.query({ jurisdictionId }),
  });
  
  const [personalDeduction, setPersonalDeduction] = useState(rules?.personalDeduction);
  
  return (
    <div className="space-y-6">
      {/* Tax Bands */}
      <div>
        <Label>Tax Bands</Label>
        <TaxBandEditor 
          bands={rules?.taxBands || []}
          onChange={(bands) => /* update */}
        />
      </div>
      
      {/* Personal Deduction Formula */}
      <div>
        <Label>Personal Deduction</Label>
        <Select
          value={personalDeduction?.type}
          onValueChange={(type) => setPersonalDeduction({ ...personalDeduction, type })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
            <SelectItem value="percentage">Percentage of Gross</SelectItem>
            <SelectItem value="formula">Custom Formula</SelectItem>
          </SelectContent>
        </Select>
        
        {personalDeduction?.type === "formula" && (
          <div className="mt-2">
            <Label>Formula</Label>
            <Input
              value={personalDeduction.formula}
              onChange={(e) => setPersonalDeduction({
                ...personalDeduction,
                formula: e.target.value,
              })}
              placeholder="MAX(1560000, {annualGross} * 0.333)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: {"{gross}"}, {"{annualGross}"}, {"{dependents}"}
            </p>
          </div>
        )}
      </div>
      
      {/* Rounding Rules */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Rounding Mode</Label>
          <Select defaultValue={rules?.roundingMode || "nearest"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearest">Nearest (standard)</SelectItem>
              <SelectItem value="floor">Always Round Down</SelectItem>
              <SelectItem value="ceil">Always Round Up</SelectItem>
              <SelectItem value="banker">Banker's Rounding</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rounding Precision</Label>
          <Select defaultValue={String(rules?.roundingPrecision || 1)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">To nearest cent</SelectItem>
              <SelectItem value="5">To nearest 5 cents</SelectItem>
              <SelectItem value="10">To nearest 10 cents</SelectItem>
              <SelectItem value="100">To nearest dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

## Data Freshness Indicator Component

```typescript
// apps/shared/src/components/data-freshness.tsx

interface DataFreshnessProps {
  dataType: string;
  organizationId: string;
}

export function DataFreshnessIndicator({ dataType, organizationId }: DataFreshnessProps) {
  const { data: freshness } = useQuery({
    queryKey: ["freshness", dataType, organizationId],
    queryFn: () => api.analytics.getFreshness.query({ dataType, organizationId }),
    refetchInterval: 60000, // Refresh every minute
  });
  
  if (!freshness) return null;
  
  const statusColors = {
    current: "text-green-600",
    stale: "text-yellow-600",
    calculating: "text-blue-600",
    locked: "text-gray-600",
  };
  
  const statusIcons = {
    current: CheckCircle,
    stale: AlertTriangle,
    calculating: RefreshCw,
    locked: Lock,
  };
  
  const StatusIcon = statusIcons[freshness.status];
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <StatusIcon className={cn("h-3 w-3", statusColors[freshness.status])} />
      <span className="text-muted-foreground">
        Updated {formatDistanceToNow(freshness.lastUpdatedAt)} ago
        {freshness.isLocked && " • Locked"}
      </span>
    </div>
  );
}

// Usage in dashboards
function PayrollDashboard() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Payroll Dashboard</h1>
        <DataFreshnessIndicator dataType="payroll" organizationId={orgId} />
      </div>
      {/* ... dashboard content */}
    </div>
  );
}
```
