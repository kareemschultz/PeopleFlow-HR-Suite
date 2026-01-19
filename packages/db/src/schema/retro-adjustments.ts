import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { payrollRuns, payslips } from "./payroll";

// ============================================================================
// RETROACTIVE ADJUSTMENTS - Historical payroll corrections
// ============================================================================

/**
 * Retroactive adjustments for correcting past payroll errors or changes.
 * Tracks the delta (difference) between original and corrected amounts.
 * Applied in future payroll runs with full audit trail.
 */
export const retroAdjustments = pgTable(
	"retro_adjustments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Which payroll run includes this adjustment
		payrollRunId: uuid("payroll_run_id")
			.notNull()
			.references(() => payrollRuns.id, { onDelete: "restrict" }),

		// Which payslip received the adjustment
		payslipId: uuid("payslip_id").references(() => payslips.id, {
			onDelete: "restrict",
		}),

		// What period is being adjusted (the historical period)
		originalPeriodStart: date("original_period_start").notNull(),
		originalPeriodEnd: date("original_period_end").notNull(),
		originalPayrollRunId: uuid("original_payroll_run_id").references(
			() => payrollRuns.id,
			{ onDelete: "set null" }
		),
		originalPayslipId: uuid("original_payslip_id").references(
			() => payslips.id,
			{ onDelete: "set null" }
		),

		// Employee
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "restrict" }),

		// ADJUSTMENT TYPE
		adjustmentType: text("adjustment_type").notNull(),
		// "salary_change", "allowance_added", "allowance_removed",
		// "attendance_correction", "statutory_correction", "bonus_arrears",
		// "deduction_correction", "other"

		// Category
		category: text("category").notNull(),
		// "earnings", "deductions", "statutory", "other"

		// DESCRIPTION
		changeDescription: text("change_description").notNull(),
		// Human-readable description of what changed

		// AMOUNTS (all in cents)
		// The core delta calculation
		originalAmount: integer("original_amount").notNull().default(0),
		correctedAmount: integer("corrected_amount").notNull().default(0),
		deltaAmount: integer("delta_amount").notNull().default(0),
		// deltaAmount = correctedAmount - originalAmount (can be negative)

		// STATUTORY IMPACT
		// How this adjustment affects PAYE
		originalPaye: integer("original_paye").default(0),
		correctedPaye: integer("corrected_paye").default(0),
		deltaPaye: integer("delta_paye").default(0),

		// How this adjustment affects NIS
		originalNis: integer("original_nis").default(0),
		correctedNis: integer("corrected_nis").default(0),
		deltaNis: integer("delta_nis").default(0),

		// Net pay impact
		deltaNetPay: integer("delta_net_pay").default(0),

		// DETAILED BREAKDOWN
		// For complex adjustments, store detailed calculation
		calculationDetails: jsonb("calculation_details").$type<{
			earningsAdjustments?: {
				code: string;
				name: string;
				originalAmount: number;
				correctedAmount: number;
				delta: number;
			}[];
			deductionsAdjustments?: {
				code: string;
				name: string;
				originalAmount: number;
				correctedAmount: number;
				delta: number;
			}[];
			taxRecalculation?: {
				originalTaxableIncome: number;
				correctedTaxableIncome: number;
				originalPaye: number;
				correctedPaye: number;
			};
			nisRecalculation?: {
				originalNisableEarnings: number;
				correctedNisableEarnings: number;
				originalNis: number;
				correctedNis: number;
			};
		}>(),

		// REASON \u0026 DOCUMENTATION
		reason: text("reason").notNull(),
		// Why is this adjustment being made?

		// Supporting documents
		attachments:
			jsonb("attachments").$type<
				{
					id: string;
					name: string;
					type: string; // "pdf", "image", "spreadsheet"
					url: string;
					uploadedAt: string;
				}[]
			>(),

		// APPROVAL WORKFLOW
		status: text("status").notNull().default("pending"),
		// "pending", "approved", "rejected", "applied", "cancelled"

		// Who requested this adjustment
		requestedBy: uuid("requested_by")
			.notNull()
			.references(() => employees.id),
		requestedAt: timestamp("requested_at").notNull().defaultNow(),

		// Who approved/rejected
		reviewedBy: uuid("reviewed_by").references(() => employees.id),
		reviewedAt: timestamp("reviewed_at"),
		reviewNotes: text("review_notes"),

		// When was it actually applied to a payroll run
		appliedAt: timestamp("applied_at"),

		// PRIORITY
		priority: text("priority").default("normal"),
		// "urgent", "high", "normal", "low"

		// COMPLIANCE
		// Tax year this affects (for reporting)
		affectedTaxYear: integer("affected_tax_year"),

		// Does this require re-filing of tax returns?
		requiresReFileing: integer("requires_re_filing").default(0),

		// Notes
		notes: text("notes"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("retro_adjustments_org_idx").on(table.organizationId),
		index("retro_adjustments_employee_idx").on(table.employeeId),
		index("retro_adjustments_payroll_run_idx").on(table.payrollRunId),
		index("retro_adjustments_original_period_idx").on(
			table.originalPeriodStart,
			table.originalPeriodEnd
		),
		index("retro_adjustments_status_idx").on(table.status),
		index("retro_adjustments_tax_year_idx").on(table.affectedTaxYear),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const retroAdjustmentsRelations = relations(
	retroAdjustments,
	({ one }) => ({
		organization: one(organizations, {
			fields: [retroAdjustments.organizationId],
			references: [organizations.id],
		}),
		employee: one(employees, {
			fields: [retroAdjustments.employeeId],
			references: [employees.id],
		}),
		payrollRun: one(payrollRuns, {
			fields: [retroAdjustments.payrollRunId],
			references: [payrollRuns.id],
		}),
		payslip: one(payslips, {
			fields: [retroAdjustments.payslipId],
			references: [payslips.id],
		}),
		originalPayrollRun: one(payrollRuns, {
			fields: [retroAdjustments.originalPayrollRunId],
			references: [payrollRuns.id],
		}),
		originalPayslip: one(payslips, {
			fields: [retroAdjustments.originalPayslipId],
			references: [payslips.id],
		}),
		requester: one(employees, {
			fields: [retroAdjustments.requestedBy],
			references: [employees.id],
		}),
		reviewer: one(employees, {
			fields: [retroAdjustments.reviewedBy],
			references: [employees.id],
		}),
	})
);

// ============================================================================
// TYPES
// ============================================================================

export type RetroAdjustment = typeof retroAdjustments.$inferSelect;
export type NewRetroAdjustment = typeof retroAdjustments.$inferInsert;

// Helper types
export type AdjustmentCalculationDetails = NonNullable<
	RetroAdjustment["calculationDetails"]
>;
export type AdjustmentAttachment = NonNullable<
	RetroAdjustment["attachments"]
>[number];

// Enums
export type AdjustmentType =
	| "salary_change"
	| "allowance_added"
	| "allowance_removed"
	| "attendance_correction"
	| "statutory_correction"
	| "bonus_arrears"
	| "deduction_correction"
	| "other";

export type AdjustmentCategory =
	| "earnings"
	| "deductions"
	| "statutory"
	| "other";

export type AdjustmentStatus =
	| "pending"
	| "approved"
	| "rejected"
	| "applied"
	| "cancelled";

export type AdjustmentPriority = "urgent" | "high" | "normal" | "low";
