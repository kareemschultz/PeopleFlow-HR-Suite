import {
	db,
	type NewRetroAdjustment,
	retroAdjustments,
} from "@PeopleFlow-HR-Suite/db";
import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createRetroAdjustmentSchema = z.object({
	organizationId: z.string().uuid(),
	payrollRunId: z.string().uuid(),
	employeeId: z.string().uuid(),
	originalPeriodStart: z.string().date(),
	originalPeriodEnd: z.string().date(),
	adjustmentType: z.enum([
		"salary_change",
		"allowance_added",
		"allowance_removed",
		"attendance_correction",
		"statutory_correction",
		"bonus_arrears",
		"deduction_correction",
		"other",
	]),
	category: z.enum(["earnings", "deductions", "statutory", "other"]),
	changeDescription: z.string().min(1),
	originalAmount: z.number().int(),
	correctedAmount: z.number().int(),
	reason: z.string().min(1),
	priority: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
	affectedTaxYear: z.number().int().min(2000).max(2100),
	requiresReFileing: z.boolean().default(false),
	notes: z.string().optional(),
	calculationDetails: z
		.object({
			earningsAdjustments: z
				.array(
					z.object({
						code: z.string(),
						name: z.string(),
						originalAmount: z.number(),
						correctedAmount: z.number(),
						delta: z.number(),
					})
				)
				.optional(),
			deductionsAdjustments: z
				.array(
					z.object({
						code: z.string(),
						name: z.string(),
						originalAmount: z.number(),
						correctedAmount: z.number(),
						delta: z.number(),
					})
				)
				.optional(),
			taxRecalculation: z
				.object({
					originalTaxableIncome: z.number(),
					correctedTaxableIncome: z.number(),
					originalPaye: z.number(),
					correctedPaye: z.number(),
				})
				.optional(),
			nisRecalculation: z
				.object({
					originalNisableEarnings: z.number(),
					correctedNisableEarnings: z.number(),
					originalNis: z.number(),
					correctedNis: z.number(),
				})
				.optional(),
		})
		.optional(),
});

const listRetroAdjustmentsSchema = z
	.object({
		organizationId: z.string().uuid(),
		employeeId: z.string().uuid().optional(),
		status: z
			.enum(["pending", "approved", "rejected", "applied", "cancelled"])
			.optional(),
		priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
		periodStart: z.string().date().optional(),
		periodEnd: z.string().date().optional(),
		limit: z.number().int().positive().max(100).default(50),
		offset: z.number().int().nonnegative().default(0),
	})
	.optional();

const reviewRetroAdjustmentSchema = z.object({
	adjustmentId: z.string().uuid(),
	action: z.enum(["approve", "reject"]),
	reviewNotes: z.string().optional(),
});

const applyRetroAdjustmentSchema = z.object({
	adjustmentId: z.string().uuid(),
	payslipId: z.string().uuid(),
});

const cancelRetroAdjustmentSchema = z.object({
	adjustmentId: z.string().uuid(),
	reason: z.string().min(1),
});

// ============================================================================
// RETRO ADJUSTMENT PROCEDURES
// ============================================================================

/**
 * Create a new retroactive adjustment request
 */
export const createRetroAdjustment = authedProcedure
	.input(createRetroAdjustmentSchema)
	.handler(async ({ input, context }) => {
		// Calculate delta amounts
		const deltaAmount = input.correctedAmount - input.originalAmount;

		// Calculate tax and NIS impacts if calculation details provided
		let deltaPaye = 0;
		let deltaNis = 0;
		let deltaNetPay = deltaAmount;

		if (input.calculationDetails?.taxRecalculation) {
			const { originalPaye, correctedPaye } =
				input.calculationDetails.taxRecalculation;
			deltaPaye = correctedPaye - originalPaye;
			deltaNetPay -= deltaPaye;
		}

		if (input.calculationDetails?.nisRecalculation) {
			const { originalNis, correctedNis } =
				input.calculationDetails.nisRecalculation;
			deltaNis = correctedNis - originalNis;
			deltaNetPay -= deltaNis;
		}

		const newAdjustment: NewRetroAdjustment = {
			organizationId: input.organizationId,
			payrollRunId: input.payrollRunId,
			employeeId: input.employeeId,
			originalPeriodStart: input.originalPeriodStart,
			originalPeriodEnd: input.originalPeriodEnd,
			adjustmentType: input.adjustmentType,
			category: input.category,
			changeDescription: input.changeDescription,
			originalAmount: input.originalAmount,
			correctedAmount: input.correctedAmount,
			deltaAmount,
			originalPaye: input.calculationDetails?.taxRecalculation?.originalPaye,
			correctedPaye: input.calculationDetails?.taxRecalculation?.correctedPaye,
			deltaPaye,
			originalNis: input.calculationDetails?.nisRecalculation?.originalNis,
			correctedNis: input.calculationDetails?.nisRecalculation?.correctedNis,
			deltaNis,
			deltaNetPay,
			calculationDetails: input.calculationDetails,
			reason: input.reason,
			status: "pending",
			requestedBy: context.session?.user.id,
			priority: input.priority,
			affectedTaxYear: input.affectedTaxYear,
			requiresReFileing: input.requiresReFileing ? 1 : 0,
			notes: input.notes ?? null,
		};

		const [adjustment] = await db
			.insert(retroAdjustments)
			.values(newAdjustment)
			.returning();

		if (!adjustment) {
			throw new Error("Failed to create retroactive adjustment");
		}

		return adjustment;
	});

/**
 * List retroactive adjustments with filtering
 */
export const listRetroAdjustments = authedProcedure
	.input(listRetroAdjustmentsSchema)
	.handler(async ({ input }) => {
		const filters = [];

		if (input?.organizationId) {
			filters.push(eq(retroAdjustments.organizationId, input.organizationId));
		}

		if (input?.employeeId) {
			filters.push(eq(retroAdjustments.employeeId, input.employeeId));
		}

		if (input?.status) {
			filters.push(eq(retroAdjustments.status, input.status));
		}

		if (input?.priority) {
			filters.push(eq(retroAdjustments.priority, input.priority));
		}

		if (input?.periodStart) {
			filters.push(
				gte(retroAdjustments.originalPeriodStart, input.periodStart)
			);
		}

		if (input?.periodEnd) {
			filters.push(lte(retroAdjustments.originalPeriodEnd, input.periodEnd));
		}

		const adjustments = await db.query.retroAdjustments.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: [desc(retroAdjustments.createdAt)],
			with: {
				employee: {
					columns: {
						id: true,
						employeeNumber: true,
						firstName: true,
						lastName: true,
					},
				},
				requester: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				reviewer: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return adjustments;
	});

/**
 * Get retroactive adjustment by ID with full details
 */
export const getRetroAdjustment = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const adjustment = await db.query.retroAdjustments.findFirst({
			where: eq(retroAdjustments.id, input.id),
			with: {
				employee: true,
				payrollRun: true,
				payslip: true,
				originalPayrollRun: true,
				originalPayslip: true,
				requester: true,
				reviewer: true,
			},
		});

		if (!adjustment) {
			throw new Error("Retroactive adjustment not found");
		}

		return adjustment;
	});

/**
 * Approve or reject a retroactive adjustment
 */
export const reviewRetroAdjustment = authedProcedure
	.input(reviewRetroAdjustmentSchema)
	.handler(async ({ input, context }) => {
		const adjustment = await db.query.retroAdjustments.findFirst({
			where: eq(retroAdjustments.id, input.adjustmentId),
		});

		if (!adjustment) {
			throw new Error("Retroactive adjustment not found");
		}

		if (adjustment.status !== "pending") {
			throw new Error("Only pending adjustments can be approved or rejected");
		}

		const newStatus = input.action === "approve" ? "approved" : "rejected";

		const [updated] = await db
			.update(retroAdjustments)
			.set({
				status: newStatus,
				reviewedBy: context.session?.user.id,
				reviewedAt: new Date(),
				reviewNotes: input.reviewNotes || null,
				updatedAt: new Date(),
			})
			.where(eq(retroAdjustments.id, input.adjustmentId))
			.returning();

		return updated;
	});

/**
 * Apply a retroactive adjustment to a payslip
 */
export const applyRetroAdjustment = authedProcedure
	.input(applyRetroAdjustmentSchema)
	.handler(async ({ input }) => {
		const adjustment = await db.query.retroAdjustments.findFirst({
			where: eq(retroAdjustments.id, input.adjustmentId),
		});

		if (!adjustment) {
			throw new Error("Retroactive adjustment not found");
		}

		if (adjustment.status !== "approved") {
			throw new Error("Only approved adjustments can be applied");
		}

		// Mark adjustment as applied
		const [updated] = await db
			.update(retroAdjustments)
			.set({
				status: "applied",
				payslipId: input.payslipId,
				appliedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(retroAdjustments.id, input.adjustmentId))
			.returning();

		return updated;
	});

/**
 * Cancel a retroactive adjustment
 */
export const cancelRetroAdjustment = authedProcedure
	.input(cancelRetroAdjustmentSchema)
	.handler(async ({ input }) => {
		const adjustment = await db.query.retroAdjustments.findFirst({
			where: eq(retroAdjustments.id, input.adjustmentId),
		});

		if (!adjustment) {
			throw new Error("Retroactive adjustment not found");
		}

		if (adjustment.status === "applied") {
			throw new Error("Cannot cancel an adjustment that has been applied");
		}

		const [updated] = await db
			.update(retroAdjustments)
			.set({
				status: "cancelled",
				notes: adjustment.notes
					? `${adjustment.notes}\n\nCancelled: ${input.reason}`
					: `Cancelled: ${input.reason}`,
				updatedAt: new Date(),
			})
			.where(eq(retroAdjustments.id, input.adjustmentId))
			.returning();

		return updated;
	});

/**
 * Get retroactive adjustments for an employee by period
 */
export const getEmployeeRetroAdjustments = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			periodStart: z.string().date(),
			periodEnd: z.string().date(),
			includeStatuses: z
				.array(
					z.enum(["pending", "approved", "rejected", "applied", "cancelled"])
				)
				.optional(),
		})
	)
	.handler(async ({ input }) => {
		const statusFilters = input.includeStatuses
			? or(
					...input.includeStatuses.map((status) =>
						eq(retroAdjustments.status, status)
					)
				)
			: undefined;

		const adjustments = await db.query.retroAdjustments.findMany({
			where: and(
				eq(retroAdjustments.employeeId, input.employeeId),
				gte(retroAdjustments.originalPeriodStart, input.periodStart),
				lte(retroAdjustments.originalPeriodEnd, input.periodEnd),
				statusFilters
			),
			orderBy: [desc(retroAdjustments.originalPeriodStart)],
		});

		return adjustments;
	});

// ============================================================================
// ROUTER
// ============================================================================

export const retroAdjustmentsRouter = {
	create: createRetroAdjustment,
	list: listRetroAdjustments,
	get: getRetroAdjustment,
	review: reviewRetroAdjustment,
	apply: applyRetroAdjustment,
	cancel: cancelRetroAdjustment,
	getByEmployee: getEmployeeRetroAdjustments,
};
