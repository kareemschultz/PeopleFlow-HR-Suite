import {
	db,
	employees,
	incomeTaxRules,
	type NewPayrollRun,
	payrollRuns,
	payslips,
	socialSecurityRules,
	taxJurisdictions,
} from "@PeopleFlow-HR-Suite/db";
import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from "..";
import { calculatePayslip } from "../services/payroll-service";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createPayrollRunSchema = z.object({
	organizationId: z.string().uuid(),
	periodStart: z.string().date(),
	periodEnd: z.string().date(),
	payDate: z.string().date(),
	notes: z.string().optional(),
	runType: z
		.enum([
			"regular",
			"bonus",
			"thirteenth_month",
			"retro_adjustment",
			"final_settlement",
		])
		.default("regular"),
	departmentIds: z.array(z.string().uuid()).optional(),
});

const listPayrollRunsSchema = z
	.object({
		organizationId: z.string().uuid(),
		status: z
			.enum(["draft", "processing", "approved", "paid", "cancelled"])
			.optional(),
		limit: z.number().int().positive().max(100).default(50),
		offset: z.number().int().nonnegative().default(0),
	})
	.optional();

const processPayrollRunSchema = z.object({
	payrollRunId: z.string().uuid(),
	departmentIds: z.array(z.string().uuid()).optional(),
});

const approvePayrollRunSchema = z.object({
	payrollRunId: z.string().uuid(),
});

// ============================================================================
// PAYROLL RUN PROCEDURES
// ============================================================================

/**
 * Create a new payroll run
 */
export const createPayrollRun = authedProcedure
	.input(createPayrollRunSchema)
	.handler(async ({ input }) => {
		const newRun: NewPayrollRun = {
			organizationId: input.organizationId,
			periodStart: input.periodStart,
			periodEnd: input.periodEnd,
			payDate: input.payDate,
			runType: input.runType,
			notes: input.notes ?? null,
			status: "draft",
			employeeCount: 0,
			totalGrossEarnings: 0,
			totalNetPay: 0,
			totalPaye: 0,
			totalNisEmployee: 0,
			totalNisEmployer: 0,
			totalDeductions: 0,
		};

		const [run] = await db.insert(payrollRuns).values(newRun).returning();

		if (!run) {
			throw new Error("Failed to create payroll run");
		}

		return run;
	});

/**
 * List payroll runs with optional filtering
 */
export const listPayrollRuns = authedProcedure
	.input(listPayrollRunsSchema)
	.handler(async ({ input }) => {
		const filters = [];

		if (input?.organizationId) {
			filters.push(eq(payrollRuns.organizationId, input.organizationId));
		}

		if (input?.status) {
			filters.push(eq(payrollRuns.status, input.status));
		}

		const runs = await db.query.payrollRuns.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: [desc(payrollRuns.createdAt)],
		});

		return runs;
	});

/**
 * Get payroll run by ID with payslips
 */
export const getPayrollRun = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const run = await db.query.payrollRuns.findFirst({
			where: eq(payrollRuns.id, input.id),
		});

		if (!run) {
			throw new Error("Payroll run not found");
		}

		// Get associated payslips
		const slips = await db.query.payslips.findMany({
			where: eq(payslips.payrollRunId, input.id),
			with: {
				employee: {
					columns: {
						id: true,
						employeeNumber: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
		});

		return {
			...run,
			payslips: slips,
		};
	});

/**
 * Process payroll run - calculate payslips for all employees
 */
export const processPayrollRun = authedProcedure
	.input(processPayrollRunSchema)
	.handler(async ({ input }) => {
		const run = await db.query.payrollRuns.findFirst({
			where: eq(payrollRuns.id, input.payrollRunId),
		});

		if (!run) {
			throw new Error("Payroll run not found");
		}

		if (run.status !== "draft") {
			throw new Error("Can only process payroll runs in draft status");
		}

		// Get organization's tax jurisdiction
		const org = await db.query.organizations.findFirst({
			where: eq(employees.organizationId, run.organizationId),
		});

		if (!org) {
			throw new Error("Organization not found");
		}

		// Get tax rules for the jurisdiction
		const jurisdiction = org.jurisdictionId
			? await db.query.taxJurisdictions.findFirst({
					where: eq(taxJurisdictions.id, org.jurisdictionId),
				})
			: null;

		if (!jurisdiction) {
			throw new Error("Tax jurisdiction not configured for organization");
		}

		// Get income tax and NIS rules
		const taxYear = new Date(run.periodStart).getFullYear();

		const incomeTaxRule = await db.query.incomeTaxRules.findFirst({
			where: and(
				eq(incomeTaxRules.jurisdictionId, jurisdiction.id),
				eq(incomeTaxRules.taxYear, taxYear)
			),
		});

		const nisRule = await db.query.socialSecurityRules.findFirst({
			where: and(
				eq(socialSecurityRules.jurisdictionId, jurisdiction.id),
				eq(socialSecurityRules.year, taxYear)
			),
		});

		if (!(incomeTaxRule && nisRule)) {
			throw new Error(
				`Tax rules not configured for jurisdiction ${jurisdiction.name} and year ${taxYear}`
			);
		}

		// Get employees to process
		const filters = [
			eq(employees.organizationId, run.organizationId),
			eq(employees.employmentStatus, "active"),
		];

		if (input.departmentIds && input.departmentIds.length > 0) {
			filters.push(
				or(...input.departmentIds.map((id) => eq(employees.departmentId, id)))!
			);
		}

		const activeEmployees = await db.query.employees.findMany({
			where: and(...filters),
		});

		// Calculate payslips for all employees
		const newPayslips = [];
		let totalGross = 0;
		let totalPaye = 0;
		let totalNis = 0;
		let totalDeductions = 0;
		let totalNetPay = 0;

		for (const employee of activeEmployees) {
			const { payslip } = calculatePayslip({
				employee,
				payrollRun: run,
				incomeTaxRule,
				nisRule,
			});

			newPayslips.push(payslip);

			totalGross += payslip.grossEarnings ?? 0;
			totalPaye += payslip.payeAmount ?? 0;
			totalNis += payslip.nisEmployee ?? 0;
			totalDeductions += payslip.totalDeductions ?? 0;
			totalNetPay += payslip.netPay ?? 0;
		}

		// Insert all payslips
		if (newPayslips.length > 0) {
			await db.insert(payslips).values(newPayslips);
		}

		// Update payroll run totals and status
		const [updatedRun] = await db
			.update(payrollRuns)
			.set({
				status: "calculated",
				employeeCount: newPayslips.length,
				totalGrossEarnings: totalGross,
				totalNetPay,
				totalPaye,
				totalNisEmployee: totalNis,
				totalDeductions,
				updatedAt: new Date(),
			})
			.where(eq(payrollRuns.id, input.payrollRunId))
			.returning();

		return updatedRun;
	});

/**
 * Approve payroll run
 */
export const approvePayrollRun = authedProcedure
	.input(approvePayrollRunSchema)
	.handler(async ({ input }) => {
		const run = await db.query.payrollRuns.findFirst({
			where: eq(payrollRuns.id, input.payrollRunId),
		});

		if (!run) {
			throw new Error("Payroll run not found");
		}

		if (run.status !== "calculated") {
			throw new Error("Can only approve payroll runs in calculated status");
		}

		const [updatedRun] = await db
			.update(payrollRuns)
			.set({
				status: "approved",
				updatedAt: new Date(),
			})
			.where(eq(payrollRuns.id, input.payrollRunId))
			.returning();

		return updatedRun;
	});

/**
 * Get payslips for date range (for YTD calculations)
 */
export const getPayslipsForPeriod = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			startDate: z.string().date(),
			endDate: z.string().date(),
		})
	)
	.handler(async ({ input }) => {
		const slips = await db.query.payslips.findMany({
			where: and(
				eq(payslips.employeeId, input.employeeId),
				gte(payslips.periodStart, input.startDate),
				lte(payslips.periodEnd, input.endDate)
			),
			orderBy: [desc(payslips.periodStart)],
		});

		return slips;
	});

// ============================================================================
// ROUTER
// ============================================================================

export const payrollRouter = {
	create: createPayrollRun,
	list: listPayrollRuns,
	get: getPayrollRun,
	process: processPayrollRun,
	approve: approvePayrollRun,
	getPayslipsForPeriod,
};
