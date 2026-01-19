# PeopleFlow HR Suite - Implementation Plan

## Overview
Build a multi-country HR/Payroll SaaS platform on the existing Better-T-Stack scaffold with Beads issue tracking, maia shadcn style, and Framer Motion animations.

**Technology Stack:**
- Frontend: React 19 + TanStack Router + Tailwind CSS (maia theme)
- Backend: Hono + oRPC
- Database: PostgreSQL + Drizzle ORM
- Auth: Better Auth
- Icons: Hugeicons
- Animations: Framer Motion
- Issue Tracking: Beads

---

## Phase 1: Foundation Setup ✅

### 1.1 Tooling Integration
- [ ] Install Beads: `npm install -g @beads/bd && bd init`
- [ ] Create epics for each phase in `.beads/`

### 1.2 Frontend Style Migration
**Files to modify:**
- [ ] `apps/web/components.json` - Change style to maia, iconLibrary to hugeicons
- [ ] `apps/web/src/index.css` - Update CSS variables for zinc/blue theme
- [ ] `apps/web/package.json` - Replace lucide-react with hugeicons-react, add framer-motion

**Commands:**
```bash
cd apps/web
bun remove lucide-react
bun add hugeicons-react framer-motion
# Regenerate components with new preset
bunx --bun shadcn@latest add button card input label --overwrite
```

### 1.3 Organizations Schema (Multi-tenancy)
**File:** `packages/db/src/schema/organizations.ts`
- [ ] organizations table (id, name, slug, jurisdictionId, timezone, currency, fiscalYearStart, settings)
- [ ] organizationMembers table (id, organizationId, userId, role, permissions)
- [ ] Export relations and types

---

## Phase 2: Core HR Tables

### 2.1 Database Schema
**Files to create:**
- [ ] `packages/db/src/schema/departments.ts` - departments, positions tables
- [ ] `packages/db/src/schema/employees.ts` - employees table with all fields from spec

**Key relationships:**
- departments → organizations (FK)
- positions → departments (FK)
- employees → departments, positions, organizations (FKs)

### 2.2 API Routers
**Files to create:**
- [ ] `packages/api/src/routers/organizations.ts` - CRUD for organizations
- [ ] `packages/api/src/routers/departments.ts` - CRUD for departments
- [ ] `packages/api/src/routers/employees.ts` - CRUD for employees

**Update:** 
- [ ] `packages/api/src/routers/index.ts` - Add modular router structure

---

## Phase 3: Multi-Country Tax System

### 3.1 Tax Schema (from spec.md)
**File:** `packages/db/src/schema/tax-jurisdictions.ts`
- [ ] taxJurisdictions (id, countryCode, name, currency, timezone, fiscalYearStart)
- [ ] incomeTaxRules (id, jurisdictionId, taxYear, bands JSONB, personalDeductionFormula)
- [ ] socialSecurityRules (id, jurisdictionId, taxYear, employeeRate, employerRate, ceiling)
- [ ] filingRequirements (id, jurisdictionId, formName, frequency, requiredFields JSONB)

### 3.2 Tax Calculation Engine
**File:** `packages/api/src/services/tax-calculator.ts`
- [ ] `calculatePAYE()` - Progressive tax bands with formula evaluation
- [ ] `calculateSocialSecurity()` - NIS contributions with ceilings
- [ ] `evaluateFormula()` - Safe formula parser supporting MAX, MIN, IF, variables
- [ ] `periodizeTax()` - Handle monthly/annual tax calculations

### 3.3 Guyana Seed Data
**File:** `packages/db/src/seeds/guyana-tax-rules.ts`
- [ ] Default jurisdiction with GYD currency
- [ ] Tax bands: 25% up to $3,120,000, 35% above
- [ ] Personal deduction: `MAX(1560000, {annualGross} * 0.333)`
- [ ] NIS: 5.6% employee, 8.4% employer
- [ ] Filing requirements (Form 2, Form 5, NIS Monthly)

---

## Phase 4: Payroll & Retroactive Adjustments

### 4.1 Payroll Schema
**File:** `packages/db/src/schema/payroll.ts`
- [ ] payrollRuns (id, organizationId, periodStart, periodEnd, payDate, status, totals)
- [ ] payslips (id, payrollRunId, employeeId, basePay, deductions, netPay, taxDetails JSONB)

### 4.2 Retro Adjustments Schema (from spec.md)
**File:** `packages/db/src/schema/retro-adjustments.ts`
- [ ] retroAdjustments (id, employeeId, type, originalPeriod, deltas JSONB, status, approvalWorkflow)

### 4.3 Services
**File:** `packages/api/src/services/payroll-service.ts`
- [ ] `createPayrollRun()` - Initialize new payroll period
- [ ] `calculatePayslip()` - Compute all earnings, deductions, and statutory
- [ ] `approvePayrollRun()` - Lock payroll and prepare for payment

**File:** `packages/api/src/services/retro-adjustment-service.ts`
- [ ] Calculate delta amounts for salary/attendance corrections
- [ ] Apply adjustments to current payroll run
- [ ] Track approval workflow

---

## Phase 5: Analytics & Metrics System

### 5.1 Metric Lineage Schema (from spec.md)
**File:** `packages/db/src/schema/metrics.ts`
- [ ] metricDependencies (id, metricKey, dependsOnTable, dependsOnColumn, calculationType)
- [ ] dataFreshness (id, tableName, lastUpdated, isLocked, staleness)
- [ ] metricValues (id, metricKey, value, periodStart, periodEnd)

### 5.2 Anomaly Detection Schema (from spec.md)
**File:** `packages/db/src/schema/anomalies.ts`
- [ ] anomalyRules (id, metricKey, ruleType, threshold, severity)
- [ ] metricAnomalies (id, ruleId, detectedValue, expectedValue, status)

### 5.3 Metrics Service
**File:** `packages/api/src/services/metrics-service.ts`
- [ ] Calculate and cache metrics with freshness tracking
- [ ] Detect anomalies based on configurable rules
- [ ] Track metric dependencies

---

## Phase 6: Permissions & Audit System

### 6.1 Schema (from spec.md)
**File:** `packages/db/src/schema/permissions.ts`
- [ ] permissionSnapshots (id, userId, employeeId, permissionType, scope, grantedAt, revokedAt)
- [ ] auditLog (id, userId, action, entityType, entityId, changes JSONB, timestamp)

### 6.2 Permission Service
**File:** `packages/api/src/services/permission-service.ts`
- [ ] Historical permission queries for audit
- [ ] Scope-based access control (all, department, individual)
- [ ] `getAccessorsAsOf()` - Who could see what when

### 6.3 Audit Service
**File:** `packages/api/src/services/audit-service.ts`
- [ ] Log all significant actions
- [ ] Track changes to sensitive data
- [ ] Generate audit reports

---

## Phase 7: UI Components & Pages

### 7.1 Add shadcn Components
```bash
bunx --bun shadcn@latest add dialog sheet tabs table select combobox
bunx --bun shadcn@latest add calendar date-picker form badge avatar tooltip
bunx --bun shadcn@latest add sidebar navigation-menu breadcrumb alert progress chart
```

### 7.2 Custom Components (from spec.md)
**Files to create:**
- [ ] `apps/web/src/components/data-freshness.tsx` - Real-time freshness indicator
- [ ] `apps/web/src/components/jurisdiction-settings.tsx` - Tax jurisdiction management
- [ ] `apps/web/src/components/tax-band-editor.tsx` - Visual tax rules editor
- [ ] `apps/web/src/components/payslip-viewer.tsx` - Detailed payslip display
- [ ] `apps/web/src/components/metrics-dashboard.tsx` - Analytics dashboard
- [ ] `apps/web/src/components/anomaly-alerts.tsx` - Anomaly detection UI

### 7.3 Route Structure
```
apps/web/src/routes/
├── dashboard.tsx           # Metrics dashboard
├── employees/
│   ├── index.tsx          # List employees
│   ├── $employeeId.tsx    # View employee
│   └── new.tsx            # Add employee
├── departments/           # Department management
├── payroll/
│   ├── runs/              # Payroll runs
│   ├── retro/             # Retro adjustments
│   └── reports/           # Payroll reports
├── analytics/             # Metrics + anomalies
├── settings/
│   ├── organization.tsx   # Org settings
│   ├── jurisdictions.tsx  # Tax jurisdictions
│   └── permissions.tsx    # User permissions
└── reports/               # Report generation
```

---

## Verification Plan

### After Each Phase:
1. Run `bun run db:push` - Schema changes apply without errors
2. Run `bun run check-types` - No TypeScript errors
3. Run `bun run dev` - All apps start without errors
4. Test API endpoints via `/api-reference` OpenAPI UI
5. Verify database constraints and relations

### End-to-End Tests:
1. **Organization Setup**: Create organization → Configure tax jurisdiction
2. **Employee Management**: Add departments → Add positions → Add employees
3. **Payroll Processing**: Create payroll run → Calculate payslips → Apply retro adjustments
4. **Tax Compliance**: Calculate PAYE → Calculate NIS → Generate Form 2
5. **Analytics**: View metrics dashboard → Detect anomalies → Review audit log
6. **Permissions**: Grant permissions → Test scope-based access → Review permission history

---

## Critical Files Summary

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `apps/web/components.json` | Update shadcn style to maia |
| 2 | `packages/db/src/schema/organizations.ts` | Multi-tenancy foundation |
| 3 | `packages/db/src/schema/employees.ts` | Core HR entity |
| 4 | `packages/db/src/schema/tax-jurisdictions.ts` | Tax system from spec |
| 5 | `packages/api/src/services/tax-calculator.ts` | PAYE/NIS calculation engine |
| 6 | `packages/api/src/routers/index.ts` | Reorganize for modular routers |
| 7 | `packages/db/src/schema/payroll.ts` | Payroll runs and payslips |
| 8 | `packages/db/src/schema/metrics.ts` | Analytics foundation |
| 9 | `packages/db/src/schema/permissions.ts` | Audit and security |

---

## Database Migration Order

1. organizations
2. taxJurisdictions
3. departments
4. positions
5. employees
6. incomeTaxRules
7. socialSecurityRules
8. filingRequirements
9. payrollRuns
10. payslips
11. retroAdjustments
12. metricDependencies
13. dataFreshness
14. metricValues
15. anomalyRules
16. metricAnomalies
17. permissionSnapshots
18. auditLog

---

## Dependencies & Prerequisites

- Node.js 18+ with Bun runtime
- PostgreSQL 14+
- Better Auth configured
- TanStack Router configured
- Drizzle ORM configured

---

## Timeline Estimate

- Phase 1: 1-2 days
- Phase 2: 2-3 days
- Phase 3: 3-4 days
- Phase 4: 2-3 days
- Phase 5: 2-3 days
- Phase 6: 1-2 days
- Phase 7: 4-5 days

**Total:** ~15-22 days of development

---

## Notes

- Follow Ultracite code standards for all code
- Use explicit types for better maintainability
- Write educational insights as code is implemented
- Test incrementally after each phase
- Keep security and audit requirements in mind
