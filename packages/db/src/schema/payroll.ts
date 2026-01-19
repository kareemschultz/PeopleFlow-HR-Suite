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

// ============================================================================
// PAYROLL RUNS - Payroll processing cycles
// ============================================================================

/**
 * Payroll runs represent a payroll processing cycle (e.g., monthly payroll for January 2025).
 * Each run contains multiple payslips for employees.
 */
export const payrollRuns = pgTable(
	"payroll_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Period covered by this payroll
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),

		// Payment date
		payDate: date("pay_date").notNull(),

		// Payroll run status
		status: text("status").notNull().default("draft"),
		// "draft", "calculating", "calculated", "approved", "paid", "cancelled"

		// Payroll type
		runType: text("run_type").notNull().default("regular"),
		// "regular", "bonus", "thirteenth_month", "retro_adjustment", "final_settlement"

		// TOTALS (in cents)
		// These are aggregated from all payslips in this run
		totalGrossEarnings: integer("total_gross_earnings").default(0),
		totalNetPay: integer("total_net_pay").default(0),
		totalPaye: integer("total_paye").default(0),
		totalNisEmployee: integer("total_nis_employee").default(0),
		totalNisEmployer: integer("total_nis_employer").default(0),
		totalDeductions: integer("total_deductions").default(0),

		// Number of employees in this run
		employeeCount: integer("employee_count").default(0),

		// Processing metadata
		calculatedAt: timestamp("calculated_at"),
		approvedAt: timestamp("approved_at"),
		approvedBy: uuid("approved_by").references(() => employees.id),
		paidAt: timestamp("paid_at"),

		// Notes
		notes: text("notes"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: uuid("created_by").references(() => employees.id),
	},
	(table) => [
		index("payroll_runs_org_id_idx").on(table.organizationId),
		index("payroll_runs_period_idx").on(table.periodStart, table.periodEnd),
		index("payroll_runs_status_idx").on(table.status),
	]
);

// ============================================================================
// PAYSLIPS - Individual employee pay records
// ============================================================================

/**
 * Payslips are individual pay records for employees within a payroll run.
 * Contains detailed breakdown of earnings, deductions, and statutory contributions.
 */
export const payslips = pgTable(
	"payslips",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Relationships
		payrollRunId: uuid("payroll_run_id")
			.notNull()
			.references(() => payrollRuns.id, { onDelete: "cascade" }),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "restrict" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Period
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),
		payDate: date("pay_date").notNull(),

		// EARNINGS (all amounts in cents)
		basePay: integer("base_pay").notNull().default(0),
		overtimePay: integer("overtime_pay").default(0),
		allowances: integer("allowances").default(0),
		bonuses: integer("bonuses").default(0),
		commissions: integer("commissions").default(0),
		otherEarnings: integer("other_earnings").default(0),

		// Gross earnings = sum of all earnings
		grossEarnings: integer("gross_earnings").notNull().default(0),

		// EARNINGS BREAKDOWN (detailed JSONB for transparency)
		earningsBreakdown:
			jsonb("earnings_breakdown").$type<
				{
					code: string; // "BASE", "OVERTIME", "TRANSPORT_ALLOWANCE"
					name: string;
					amount: number; // In cents
					isTaxable: boolean;
					isNisable: boolean; // Subject to NIS contributions
				}[]
			>(),

		// STATUTORY DEDUCTIONS (calculated)
		// PAYE (Income Tax)
		taxableIncome: integer("taxable_income").notNull().default(0),
		payeAmount: integer("paye_amount").notNull().default(0),

		// NIS (Social Security)
		nisableEarnings: integer("nisable_earnings").notNull().default(0),
		nisEmployee: integer("nis_employee").notNull().default(0),
		nisEmployer: integer("nis_employer").notNull().default(0),

		// Tax calculation details (for audit trail)
		taxDetails: jsonb("tax_details").$type<{
			jurisdictionId: string;
			taxYear: number;
			annualGross?: number;
			personalDeduction?: number;
			taxableBands?: {
				bandName: string;
				amount: number;
				rate: number;
				tax: number;
			}[];
			annualTax?: number;
			monthlyTax?: number;
		}>(),

		// OTHER DEDUCTIONS (employee-specific)
		unionDues: integer("union_dues").default(0),
		loanRepayments: integer("loan_repayments").default(0),
		advanceDeductions: integer("advance_deductions").default(0),
		otherDeductions: integer("other_deductions").default(0),

		// Deductions breakdown
		deductionsBreakdown: jsonb("deductions_breakdown").$type<
			{
				code: string; // "UNION_DUES", "LOAN_001"
				name: string;
				amount: number; // In cents
			}[]
		>(),

		// TOTALS
		totalDeductions: integer("total_deductions").notNull().default(0),
		// Total deductions = PAYE + NIS + other deductions

		netPay: integer("net_pay").notNull().default(0),
		// Net pay = Gross earnings - Total deductions

		// YEAR-TO-DATE (YTD) TOTALS
		ytdGrossEarnings: integer("ytd_gross_earnings").default(0),
		ytdNetPay: integer("ytd_net_pay").default(0),
		ytdPaye: integer("ytd_paye").default(0),
		ytdNis: integer("ytd_nis").default(0),

		// PAYMENT
		paymentMethod: text("payment_method").default("bank_transfer"),
		// "bank_transfer", "cheque", "cash"

		paymentStatus: text("payment_status").default("pending"),
		// "pending", "paid", "failed", "cancelled"

		paymentReference: text("payment_reference"),
		paidAt: timestamp("paid_at"),

		// RETROACTIVE ADJUSTMENTS
		// If this payslip contains retro adjustments, track them here
		hasRetroAdjustments: integer("has_retro_adjustments").default(0),
		retroAdjustmentAmount: integer("retro_adjustment_amount").default(0),

		// Notes for this payslip
		notes: text("notes"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("payslips_payroll_run_idx").on(table.payrollRunId),
		index("payslips_employee_idx").on(table.employeeId),
		index("payslips_org_period_idx").on(
			table.organizationId,
			table.periodStart,
			table.periodEnd
		),
		index("payslips_payment_status_idx").on(table.paymentStatus),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [payrollRuns.organizationId],
		references: [organizations.id],
	}),
	approver: one(employees, {
		fields: [payrollRuns.approvedBy],
		references: [employees.id],
	}),
	creator: one(employees, {
		fields: [payrollRuns.createdBy],
		references: [employees.id],
	}),
	payslips: many(payslips),
	// Future relations:
	// retroAdjustments: many(retroAdjustments),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
	payrollRun: one(payrollRuns, {
		fields: [payslips.payrollRunId],
		references: [payrollRuns.id],
	}),
	employee: one(employees, {
		fields: [payslips.employeeId],
		references: [employees.id],
	}),
	organization: one(organizations, {
		fields: [payslips.organizationId],
		references: [organizations.id],
	}),
	// Future relations:
	// retroAdjustments: many(retroAdjustments),
}));

// ============================================================================
// TYPES
// ============================================================================

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type NewPayrollRun = typeof payrollRuns.$inferInsert;

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;

// Helper types for JSONB fields
export type EarningItem = NonNullable<Payslip["earningsBreakdown"]>[number];
export type DeductionItem = NonNullable<Payslip["deductionsBreakdown"]>[number];
export type TaxCalculationDetails = NonNullable<Payslip["taxDetails"]>;

// Status enums
export type PayrollRunStatus =
	| "draft"
	| "calculating"
	| "calculated"
	| "approved"
	| "paid"
	| "cancelled";

export type PayrollRunType =
	| "regular"
	| "bonus"
	| "thirteenth_month"
	| "retro_adjustment"
	| "final_settlement";

export type PaymentMethod = "bank_transfer" | "cheque" | "cash";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";
