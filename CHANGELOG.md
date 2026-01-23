# Changelog

All notable changes to the PeopleFlow HR Suite project will be documented in this file.

## [Unreleased] - 2026-01-22

### Added
- **Phase 9 (Licensing & Monetization):**
  - Licensing database schema with support for SaaS subscriptions and perpetual on-premise licenses.
  - License API router with public inquiry submission and authenticated license management.
  - Pricing page with three SaaS tiers (Starter $49/mo, Professional $199/mo, Enterprise Custom).
  - On-premise deployment section with perpetual license inquiry workflow.
  - License settings page displaying current license, subscription details, and features.
- **Phase 8 (Reports & Payroll Pages):** Completed implementation of reports and payroll pages with full API integration.
- **Phase 7 (UI Integration):**
  - Settings & Reports pages (`/settings/jurisdictions`, `/settings/permissions`, `/reports`).
  - Employees management UI:
    - Employee creation form with 9 sections (basic info, organizational assignment, personal details, address, emergency contact, identification, employment details, compensation, leave balances).
    - Employee detail page with 5 tabs (overview, compensation, personal, employment, notes), edit mode, and conditional rendering.
  - Departments management UI:
    - Department creation form with 5 sections (basic info, organizational structure, location, budget settings, approval & notification settings).
    - Department detail page with 4 tabs (overview, budget & settings, positions, employees), hierarchical navigation, and JSONB settings management.
  - Custom reusable components:
    - **Data Freshness Indicator** (`data-freshness.tsx`) - Real-time data freshness status with dual display modes (compact tooltip and detailed), auto-refresh every 30 seconds, smart relative timestamps.
    - **Tax Band Editor** (`tax-band-editor.tsx`) - Visual editor for progressive tax rules with band reordering, live preview calculator, unlimited max amount handling.
    - **Payslip Viewer** (`payslip-viewer.tsx`) - Comprehensive payslip display with earnings/deductions breakdown, YTD totals, tax calculation details, employer contributions, retro adjustment alerts.
    - **Metrics Dashboard** (`metrics-dashboard.tsx`) - Analytics dashboard with trend indicators (up/down arrows), category-based color coding, confidence indicators, insights section showing improving metrics.
  - Initial shadcn component integration with Maia theme.
- **Phase 6 (Permissions & Audit):**
  - Permission snapshots schema and service.
  - Audit logging system and service.
  - Accessor query capabilities (`getAccessorsAsOf`).
- **Phase 5 (Analytics & Metrics):**
  - Metric lineage and dependency tracking schemas (`metricDependencies`, `dataFreshness`).
  - Anomaly detection system with configurable rules (`metricAnomalies`, `anomalyRules`).
  - Metrics service and API router.
- **Phase 4 (Payroll & Retroactive Adjustments):**
  - Payroll schema (`payrollRuns`, `payslips`) and service (`createPayrollRun`, `calculatePayslip`).
  - Retroactive adjustments schema and service.
  - API routers for payroll and retro adjustments.
- **Phase 3 (Tax System):**
  - Multi-country tax jurisdiction schema (`taxJurisdictions`).
  - Configurable income tax rules (`incomeTaxRules`) and social security rules.
  - Guyana seed data.
  - Tax calculator service with formula evaluation engine.
- **Phase 2 (Core HR):**
  - Core schemas: `departments`, `positions`, `employees`.
  - API routers for organizational structure.
- **Phase 1 (Foundation):**
  - Multi-tenancy support with `organizations` schema.
  - Frontend migration to Maia theme + Hugeicons.
  - Project initialization with Beads tracking.

### Fixed
- Resolved all TypeScript errors in API routers and server.
- Fixed TanStack Router compatibility with Zod v4.
- Resolved Hono middleware import issues.
- Fixed header navigation - added comprehensive navigation links (Employees, Departments, Payroll, Reports, Settings).
- Fixed hardcoded organization ID in permissions settings - now uses dynamic `useOrganization()` hook.
- Fixed payroll YTD stats - replaced hardcoded $0 values with real API data.
- Enhanced dashboard with HR metrics (employee counts, departments, recent payroll runs, quick actions).

### Documentation
- Consolidated spec files - removed duplicates (SPEC.md, SPEC-ENHANCED.md), renamed hrms_saas_spec_v4.md as canonical SPEC.md.
- Updated STACK.md - corrected Tailwind CSS version to v4.x, added oRPC and Better Auth documentation links.
- Updated README.md with completed features and new licensing feature in roadmap.
- Updated IMPLEMENTATION_PLAN.md with Phase 9 (Licensing), Phase 10 (Better Auth Plugins), Phase 11 (Competitive Research).
- Updated Beads issues statuses (Phase 1, 3 marked as done; Phase 7 marked as in_progress; Phase 8 marked as done).

### Configuration
- Pinned unpinned dependencies (husky ^9.1.7, lint-staged ^15.2.11).
- Added db:seed task to turbo.json with dependency on db:push.

### Tooling
- Implemented self-validating system with automated hooks, agents, and commands.
- Added comprehensive database seed data (`bun run db:seed`).

## [0.1.0] - 2026-01-19
- Initial project scaffold.
