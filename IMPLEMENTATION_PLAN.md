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
- [x] organizations table (id, name, slug, jurisdictionId, timezone, currency, fiscalYearStart, settings)
- [x] organizationMembers table (id, organizationId, userId, role, permissions)
- [ ] Export relations and types

---

## Phase 2: Core HR Tables ✅

### 2.1 Database Schema
**Files to create:**
- [x] `packages/db/src/schema/departments.ts` - departments, positions tables
- [x] `packages/db/src/schema/employees.ts` - employees table with all fields from spec

**Key relationships:**
- departments → organizations (FK)
- positions → departments (FK)
- employees → departments, positions, organizations (FKs)

### 2.2 API Routers
**Files to create:**
- [x] `packages/api/src/routers/organizations.ts` - CRUD for organizations
- [x] `packages/api/src/routers/departments.ts` - CRUD for departments
- [x] `packages/api/src/routers/employees.ts` - CRUD for employees

**Update:** 
- [x] `packages/api/src/routers/index.ts` - Add modular router structure

---

## Phase 3: Multi-Country Tax System ✅

### 3.1 Tax Schema (from spec.md)
**File:** `packages/db/src/schema/tax-jurisdictions.ts`
- [x] taxJurisdictions (id, countryCode, name, currency, timezone, fiscalYearStart)
- [x] incomeTaxRules (id, jurisdictionId, taxYear, bands JSONB, personalDeductionFormula)
- [x] socialSecurityRules (id, jurisdictionId, taxYear, employeeRate, employerRate, ceiling)
- [x] filingRequirements (id, jurisdictionId, formName, frequency, requiredFields JSONB)

### 3.2 Tax Calculation Engine
**File:** `packages/api/src/services/tax-calculator.ts`
- [x] `calculatePAYE()` - Progressive tax bands with formula evaluation
- [x] `calculateSocialSecurity()` - NIS contributions with ceilings
- [x] `evaluateFormula()` - Safe formula parser supporting MAX, MIN, IF, variables
- [x] `periodizeTax()` - Handle monthly/annual tax calculations

### 3.3 Guyana Seed Data
**File:** `packages/db/src/seeds/guyana-tax-rules.ts`
- [x] Default jurisdiction with GYD currency
- [x] Tax bands: 25% up to $3,120,000, 35% above
- [x] Personal deduction: `MAX(1560000, {annualGross} * 0.333)`
- [x] NIS: 5.6% employee, 8.4% employer
- [x] Filing requirements (Form 2, Form 5, NIS Monthly)

---

## Phase 4: Payroll & Retroactive Adjustments ✅

### 4.1 Payroll Schema
**File:** `packages/db/src/schema/payroll.ts`
- [x] payrollRuns (id, organizationId, periodStart, periodEnd, payDate, status, totals)
- [x] payslips (id, payrollRunId, employeeId, basePay, deductions, netPay, taxDetails JSONB)

### 4.2 Retro Adjustments Schema (from spec.md)
**File:** `packages/db/src/schema/retro-adjustments.ts`
- [x] retroAdjustments (id, employeeId, type, originalPeriod, deltas JSONB, status, approvalWorkflow)

### 4.3 Services
**File:** `packages/api/src/services/payroll-service.ts`
- [x] `createPayrollRun()` - Initialize new payroll period
- [x] `calculatePayslip()` - Compute all earnings, deductions, and statutory
- [x] `approvePayrollRun()` - Lock payroll and prepare for payment

**File:** `packages/api/src/services/retro-adjustment-service.ts`
- [x] Calculate delta amounts for salary/attendance corrections
- [x] Apply adjustments to current payroll run
- [x] Track approval workflow

---

## Phase 5: Analytics & Metrics System ✅

### 5.1 Metric Lineage Schema (from spec.md)
**File:** `packages/db/src/schema/metrics.ts`
- [x] metricDependencies (id, metricKey, dependsOnTable, dependsOnColumn, calculationType)
- [x] dataFreshness (id, tableName, lastUpdated, isLocked, staleness)
- [x] metricValues (id, metricKey, value, periodStart, periodEnd)

### 5.2 Anomaly Detection Schema (from spec.md)
**File:** `packages/db/src/schema/anomalies.ts`
- [x] anomalyRules (id, metricKey, ruleType, threshold, severity)
- [x] metricAnomalies (id, ruleId, detectedValue, expectedValue, status)

### 5.3 Metrics Service
**File:** `packages/api/src/services/metrics-service.ts`
- [x] Calculate and cache metrics with freshness tracking
- [x] Detect anomalies based on configurable rules
- [x] Track metric dependencies

---

## Phase 6: Permissions & Audit System ✅

### 6.1 Schema (from spec.md)
**File:** `packages/db/src/schema/permissions.ts`
- [x] permissionSnapshots (id, userId, employeeId, permissionType, scope, grantedAt, revokedAt)
- [x] auditLog (id, userId, action, entityType, entityId, changes JSONB, timestamp)

### 6.2 Permission Service
**File:** `packages/api/src/services/permission-service.ts`
- [x] Historical permission queries for audit
- [x] Scope-based access control (all, department, individual)
- [x] `getAccessorsAsOf()` - Who could see what when

### 6.3 Audit Service
**File:** `packages/api/src/services/audit-service.ts`
- [x] Log all significant actions
- [x] Track changes to sensitive data
- [x] Generate audit reports

---

## Phase 7: UI Components & Pages 🚧

### 7.1 Add shadcn Components ✅
```bash
bunx --bun shadcn@latest add dialog sheet tabs table select combobox
bunx --bun shadcn@latest add calendar date-picker form badge avatar tooltip
bunx --bun shadcn@latest add sidebar navigation-menu breadcrumb alert progress chart
```

### 7.2 Custom Components (from spec.md)
**Files to create:**
- [ ] `apps/web/src/components/data-freshness.tsx` - Real-time freshness indicator
- [x] `apps/web/src/components/jurisdiction-settings.tsx` - Tax jurisdiction management
- [ ] `apps/web/src/components/tax-band-editor.tsx` - Visual tax rules editor
- [ ] `apps/web/src/components/payslip-viewer.tsx` - Detailed payslip display
- [ ] `apps/web/src/components/metrics-dashboard.tsx` - Analytics dashboard
- [x] `apps/web/src/components/anomaly-alerts.tsx` - Anomaly detection UI

### 7.3 Route Structure ✅
```
apps/web/src/routes/
├── dashboard.tsx           # Metrics dashboard ✅
├── employees/
│   ├── index.tsx          # List employees ✅
│   ├── $employeeId.tsx    # View employee (partial)
│   └── new.tsx            # Add employee (partial)
├── departments/           # Department management (partial)
│   ├── index.tsx          # List departments ✅
│   ├── $departmentId.tsx  # View department (partial)
│   └── new.tsx            # Add department (partial)
├── payroll/
│   ├── index.tsx          # Payroll dashboard ✅
│   ├── runs/              # Payroll runs ✅
│   └── reports/           # Payroll reports ✅
├── settings/
│   ├── organization.tsx   # Org settings ✅
│   ├── permissions.tsx    # User permissions ✅
│   └── profile.tsx        # User profile ✅
└── reports/index.tsx      # Report generation ✅
```

---

## Phase 8: Reports & Compliance ✅

### 8.1 API Services
- [x] `packages/api/src/services/reports-service.ts` - Report generation logic
- [x] `packages/api/src/routers/reports.ts` - API router for reports

### 8.2 UI Implementation
- [x] `apps/web/src/routes/reports/index.tsx` - Reports dashboard
- [x] `apps/web/src/routes/payroll/reports/` - Payroll specific reports
```

---

## Phase 9: Licensing & Monetization ⬜

### 9.1 Database Schema
**File:** `packages/db/src/schema/licensing.ts`
- [ ] licenses table (id, organizationId, type, tier, seats, expiresAt, contactedAt)
- [ ] subscriptions table (id, organizationId, plan, status, billingCycle)
- [ ] licenseInquiries table (id, name, email, company, inquiryType, status)

### 9.2 API Router
**File:** `packages/api/src/routers/licensing.ts`
- [ ] `submitInquiry()` - One-time license pricing inquiries
- [ ] `getCurrentLicense()` - Get organization's current license
- [ ] `validateLicense()` - Validate license key for on-prem
- [ ] `upgradePlan()` - Handle SaaS plan upgrades

### 9.3 UI Implementation
**Files to create:**
- [ ] `apps/web/src/routes/pricing.tsx` - Pricing page with tiers
- [ ] `apps/web/src/routes/settings/license.tsx` - License management
- [ ] `apps/web/src/components/pricing-card.tsx` - Pricing tier display

### 9.4 License Types
**SaaS Subscriptions:**
- Starter: 1-10 employees, $49/month
- Professional: 11-100 employees, $199/month
- Enterprise: 101+ employees, Custom pricing

**One-Time Perpetual:**
- On-premise deployment
- Lifetime license
- Contact sales for pricing

---

## Phase 10: Better Auth Plugin Integration ⬜

### 10.1 Core Plugins
**File:** `packages/auth/src/index.ts`
- [ ] **Organization Plugin** - Multi-tenant organization management
- [ ] **Two-Factor Authentication** - Enhanced security (TOTP)
- [ ] **Admin Plugin** - User management and role assignment
- [ ] **Email Verification** - Verify user emails on signup
- [ ] **Password Reset** - Secure password recovery workflow

### 10.2 Additional Plugins
- [ ] **Session Management** - Track active sessions, device info
- [ ] **Rate Limiting** - Prevent brute force attacks
- [ ] **Audit Log Integration** - Track auth events in audit log
- [ ] **OAuth Providers** - Google, Microsoft SSO for enterprise

### 10.3 Security Enhancements
- [ ] Implement 2FA requirement for payroll/finance roles
- [ ] Session timeout for inactive users
- [ ] IP whitelisting for sensitive operations
- [ ] Device fingerprinting for fraud detection

---

## Phase 11: Competitive Research & Feature Analysis ⬜

### 11.1 Platforms to Analyze
**Major HRMS Platforms:**
- [ ] **BambooHR** - SMB-focused, excellent UX
- [ ] **Gusto** - Payroll + HR, US-focused
- [ ] **Rippling** - IT + HR + Finance unified
- [ ] **Workday** - Enterprise-grade, comprehensive
- [ ] **ADP** - Legacy payroll giant
- [ ] **Zenefits** - Benefits administration focus
- [ ] **Deel** - Global payroll specialist

**Caribbean/Regional:**
- [ ] **HRIS Systems** - Local tax compliance
- [ ] **Regional payroll providers** - Guyana, Trinidad, Jamaica

### 11.2 Feature Comparison Matrix
**Categories to evaluate:**
- [ ] Onboarding/Offboarding workflows
- [ ] Time & Attendance tracking
- [ ] Leave management & accruals
- [ ] Performance reviews & goals
- [ ] Benefits administration
- [ ] Document management
- [ ] Employee self-service portals
- [ ] Mobile app capabilities
- [ ] Reporting & analytics
- [ ] Integrations (accounting, HRIS, etc.)

### 11.3 Key Differentiators to Build
**What makes PeopleFlow unique:**
- [ ] Multi-country tax engine with formula flexibility
- [ ] Retroactive adjustment delta tracking
- [ ] Real-time anomaly detection
- [ ] Comprehensive audit trails
- [ ] Developer-friendly API (oRPC)
- [ ] Local-first Caribbean focus with global scalability

### 11.4 Research Deliverables
**Files to create:**
- [ ] `docs/competitive-analysis.md` - Feature comparison matrix
- [ ] `docs/best-practices.md` - Industry standards we follow
- [ ] `docs/roadmap-features.md` - Prioritized feature wishlist from research

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
