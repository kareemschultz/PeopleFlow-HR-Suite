import {
	db,
	holidays,
	leaveBalances,
	leavePolicies,
	leavePolicyAssignments,
	leaveRequests,
	leaveTypes,
	type NewHoliday,
	type NewLeaveBalance,
	type NewLeavePolicy,
	type NewLeavePolicyAssignment,
	type NewLeaveRequest,
	type NewLeaveType,
} from "@PeopleFlow-HR-Suite/db";
import { and, between, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { authedProcedure } from "..";

// ============================================================================
// LEAVE TYPES
// ============================================================================

/**
 * Create Leave Type
 * Creates a new leave type (vacation, sick, personal, etc.)
 */
export const createLeaveType = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			name: z.string().min(1),
			code: z.string().min(1),
			description: z.string().optional(),
			isPaid: z.boolean().default(true),
			accrualRate: z.number().default(0),
			maxAccrual: z.number().optional(),
			carryOverDays: z.number().default(0),
			minNotice: z.number().default(0),
			maxConsecutive: z.number().optional(),
			requiresApproval: z.boolean().default(true),
			requiresDocumentation: z.boolean().default(false),
			defaultForNewEmployees: z.boolean().default(false),
		})
	)
	.handler(async ({ input }) => {
		const newLeaveType: NewLeaveType = {
			organizationId: input.organizationId,
			name: input.name,
			code: input.code,
			description: input.description || null,
			isPaid: input.isPaid,
			accrualRate: input.accrualRate,
			maxAccrual: input.maxAccrual || null,
			carryOverDays: input.carryOverDays,
			minNotice: input.minNotice,
			maxConsecutive: input.maxConsecutive || null,
			requiresApproval: input.requiresApproval,
			requiresDocumentation: input.requiresDocumentation,
			defaultForNewEmployees: input.defaultForNewEmployees,
			isActive: true,
		};

		const [leaveType] = await db
			.insert(leaveTypes)
			.values(newLeaveType)
			.returning();

		return leaveType;
	});

/**
 * List Leave Types
 * Returns all leave types for an organization
 */
export const listLeaveTypes = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			isActive: z.boolean().optional(),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(leaveTypes.organizationId, input.organizationId)];

		if (input.isActive !== undefined) {
			conditions.push(eq(leaveTypes.isActive, input.isActive));
		}

		const types = await db.query.leaveTypes.findMany({
			where: and(...conditions),
			orderBy: [leaveTypes.name],
		});

		return types;
	});

// ============================================================================
// LEAVE POLICIES
// ============================================================================

/**
 * Create Leave Policy
 * Creates a policy for a leave type with specific rules
 */
export const createLeavePolicy = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			leaveTypeId: z.string().uuid(),
			name: z.string().min(1),
			description: z.string().optional(),
			eligibilityMonths: z.number().default(0),
			minTenureMonths: z.number().default(0),
			customAccrualRate: z.number().optional(),
			customMaxAccrual: z.number().optional(),
			customCarryOver: z.number().optional(),
			initialBalance: z.number().default(0),
			priority: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		const newPolicy: NewLeavePolicy = {
			organizationId: input.organizationId,
			leaveTypeId: input.leaveTypeId,
			name: input.name,
			description: input.description || null,
			eligibilityMonths: input.eligibilityMonths,
			minTenureMonths: input.minTenureMonths,
			customAccrualRate: input.customAccrualRate || null,
			customMaxAccrual: input.customMaxAccrual || null,
			customCarryOver: input.customCarryOver || null,
			initialBalance: input.initialBalance,
			priority: input.priority,
			isActive: true,
		};

		const [policy] = await db
			.insert(leavePolicies)
			.values(newPolicy)
			.returning();

		return policy;
	});

/**
 * Assign Policy to Employee
 * Assigns a leave policy to an employee
 */
export const assignPolicy = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			policyId: z.string().uuid(),
			organizationId: z.string().uuid(),
			effectiveDate: z.string(),
			endDate: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		const assignment: NewLeavePolicyAssignment = {
			employeeId: input.employeeId,
			policyId: input.policyId,
			organizationId: input.organizationId,
			effectiveDate: input.effectiveDate,
			endDate: input.endDate || null,
		};

		const [result] = await db
			.insert(leavePolicyAssignments)
			.values(assignment)
			.returning();

		return result;
	});

// ============================================================================
// LEAVE BALANCES
// ============================================================================

/**
 * Get Employee Leave Balance
 * Returns current leave balance for an employee and leave type
 */
export const getLeaveBalance = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			leaveTypeId: z.string().uuid(),
			year: z.number().optional(),
		})
	)
	.handler(async ({ input }) => {
		const year = input.year || new Date().getFullYear();

		const balance = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, input.employeeId),
				eq(leaveBalances.leaveTypeId, input.leaveTypeId),
				eq(leaveBalances.year, year)
			),
			with: {
				leaveType: true,
			},
		});

		return balance || null;
	});

/**
 * Get All Employee Balances
 * Returns all leave balances for an employee
 */
export const getEmployeeBalances = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			year: z.number().optional(),
		})
	)
	.handler(async ({ input }) => {
		const year = input.year || new Date().getFullYear();

		const balances = await db.query.leaveBalances.findMany({
			where: and(
				eq(leaveBalances.employeeId, input.employeeId),
				eq(leaveBalances.year, year)
			),
			with: {
				leaveType: true,
			},
			orderBy: [leaveBalances.totalEntitled],
		});

		return balances;
	});

/**
 * Initialize Leave Balance
 * Creates or updates leave balance for an employee
 */
export const initializeBalance = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			leaveTypeId: z.string().uuid(),
			organizationId: z.string().uuid(),
			year: z.number(),
			totalEntitled: z.number(),
			carriedOver: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		// Check if balance exists
		const existing = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, input.employeeId),
				eq(leaveBalances.leaveTypeId, input.leaveTypeId),
				eq(leaveBalances.year, input.year)
			),
		});

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(leaveBalances)
				.set({
					totalEntitled: input.totalEntitled,
					carriedOver: input.carriedOver,
					available:
						input.totalEntitled +
						input.carriedOver -
						existing.used -
						existing.pending,
					updatedAt: new Date(),
				})
				.where(eq(leaveBalances.id, existing.id))
				.returning();

			return updated;
		}

		// Create new
		const newBalance: NewLeaveBalance = {
			employeeId: input.employeeId,
			leaveTypeId: input.leaveTypeId,
			organizationId: input.organizationId,
			year: input.year,
			totalEntitled: input.totalEntitled,
			carriedOver: input.carriedOver,
			used: 0,
			pending: 0,
			available: input.totalEntitled + input.carriedOver,
		};

		const [balance] = await db
			.insert(leaveBalances)
			.values(newBalance)
			.returning();

		return balance;
	});

// ============================================================================
// LEAVE REQUESTS
// ============================================================================

/**
 * Create Leave Request
 * Submits a new leave request
 */
export const createLeaveRequest = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			leaveTypeId: z.string().uuid(),
			organizationId: z.string().uuid(),
			startDate: z.string(),
			endDate: z.string(),
			totalDays: z.number(),
			reason: z.string().optional(),
			attachmentUrl: z.string().optional(),
			emergencyContact: z.string().optional(),
			emergencyPhone: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		// Check if employee has sufficient balance
		const year = new Date(input.startDate).getFullYear();
		const balance = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, input.employeeId),
				eq(leaveBalances.leaveTypeId, input.leaveTypeId),
				eq(leaveBalances.year, year)
			),
		});

		if (!balance || balance.available < input.totalDays) {
			throw new Error("Insufficient leave balance");
		}

		// Create request
		const newRequest: NewLeaveRequest = {
			employeeId: input.employeeId,
			leaveTypeId: input.leaveTypeId,
			organizationId: input.organizationId,
			startDate: input.startDate,
			endDate: input.endDate,
			totalDays: input.totalDays,
			reason: input.reason || null,
			attachmentUrl: input.attachmentUrl || null,
			emergencyContact: input.emergencyContact || null,
			emergencyPhone: input.emergencyPhone || null,
			status: "pending",
		};

		const [request] = await db
			.insert(leaveRequests)
			.values(newRequest)
			.returning();

		// Update pending balance
		await db
			.update(leaveBalances)
			.set({
				pending: balance.pending + input.totalDays,
				available: balance.available - input.totalDays,
				updatedAt: new Date(),
			})
			.where(eq(leaveBalances.id, balance.id));

		return request;
	});

/**
 * List Leave Requests
 * Returns leave requests with filters
 */
export const listLeaveRequests = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			employeeId: z.string().uuid().optional(),
			status: z
				.enum(["pending", "approved", "rejected", "cancelled"])
				.optional(),
			startDate: z.string().optional(),
			endDate: z.string().optional(),
			limit: z.number().default(50),
			offset: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(leaveRequests.organizationId, input.organizationId)];

		if (input.employeeId) {
			conditions.push(eq(leaveRequests.employeeId, input.employeeId));
		}

		if (input.status) {
			conditions.push(eq(leaveRequests.status, input.status));
		}

		if (input.startDate && input.endDate) {
			const dateFilter = or(
				between(leaveRequests.startDate, input.startDate, input.endDate),
				between(leaveRequests.endDate, input.startDate, input.endDate)
			);
			if (dateFilter) {
				conditions.push(dateFilter);
			}
		}

		const requests = await db.query.leaveRequests.findMany({
			where: and(...conditions),
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						employeeNumber: true,
					},
				},
				leaveType: true,
			},
			orderBy: [desc(leaveRequests.submittedAt)],
			limit: input.limit,
			offset: input.offset,
		});

		return requests;
	});

/**
 * Approve Leave Request
 * Approves a pending leave request
 */
export const approveLeaveRequest = authedProcedure
	.input(
		z.object({
			requestId: z.string().uuid(),
			approverId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		// Get request
		const request = await db.query.leaveRequests.findFirst({
			where: eq(leaveRequests.id, input.requestId),
		});

		if (!request) {
			throw new Error("Leave request not found");
		}

		if (request.status !== "pending") {
			throw new Error("Only pending requests can be approved");
		}

		// Update request
		const [updated] = await db
			.update(leaveRequests)
			.set({
				status: "approved",
				approvedBy: input.approverId,
				approvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(leaveRequests.id, input.requestId))
			.returning();

		// Update balance: move from pending to used
		const year = new Date(request.startDate).getFullYear();
		const balance = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, request.employeeId),
				eq(leaveBalances.leaveTypeId, request.leaveTypeId),
				eq(leaveBalances.year, year)
			),
		});

		if (balance) {
			await db
				.update(leaveBalances)
				.set({
					used: balance.used + request.totalDays,
					pending: balance.pending - request.totalDays,
					updatedAt: new Date(),
				})
				.where(eq(leaveBalances.id, balance.id));
		}

		return updated;
	});

/**
 * Reject Leave Request
 * Rejects a pending leave request
 */
export const rejectLeaveRequest = authedProcedure
	.input(
		z.object({
			requestId: z.string().uuid(),
			approverId: z.string().uuid(),
			reason: z.string(),
		})
	)
	.handler(async ({ input }) => {
		// Get request
		const request = await db.query.leaveRequests.findFirst({
			where: eq(leaveRequests.id, input.requestId),
		});

		if (!request) {
			throw new Error("Leave request not found");
		}

		if (request.status !== "pending") {
			throw new Error("Only pending requests can be rejected");
		}

		// Update request
		const [updated] = await db
			.update(leaveRequests)
			.set({
				status: "rejected",
				approvedBy: input.approverId,
				approvedAt: new Date(),
				rejectionReason: input.reason,
				updatedAt: new Date(),
			})
			.where(eq(leaveRequests.id, input.requestId))
			.returning();

		// Restore balance: remove from pending, add back to available
		const year = new Date(request.startDate).getFullYear();
		const balance = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, request.employeeId),
				eq(leaveBalances.leaveTypeId, request.leaveTypeId),
				eq(leaveBalances.year, year)
			),
		});

		if (balance) {
			await db
				.update(leaveBalances)
				.set({
					pending: balance.pending - request.totalDays,
					available: balance.available + request.totalDays,
					updatedAt: new Date(),
				})
				.where(eq(leaveBalances.id, balance.id));
		}

		return updated;
	});

/**
 * Cancel Leave Request
 * Allows employee to cancel their own pending or approved request
 */
export const cancelLeaveRequest = authedProcedure
	.input(
		z.object({
			requestId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		// Get request
		const request = await db.query.leaveRequests.findFirst({
			where: eq(leaveRequests.id, input.requestId),
		});

		if (!request) {
			throw new Error("Leave request not found");
		}

		if (request.status === "cancelled" || request.status === "rejected") {
			throw new Error("Request already cancelled or rejected");
		}

		const wasPending = request.status === "pending";
		const wasApproved = request.status === "approved";

		// Update request
		const [updated] = await db
			.update(leaveRequests)
			.set({
				status: "cancelled",
				updatedAt: new Date(),
			})
			.where(eq(leaveRequests.id, input.requestId))
			.returning();

		// Restore balance
		const year = new Date(request.startDate).getFullYear();
		const balance = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.employeeId, request.employeeId),
				eq(leaveBalances.leaveTypeId, request.leaveTypeId),
				eq(leaveBalances.year, year)
			),
		});

		if (balance) {
			if (wasPending) {
				// Was pending: remove from pending, add to available
				await db
					.update(leaveBalances)
					.set({
						pending: balance.pending - request.totalDays,
						available: balance.available + request.totalDays,
						updatedAt: new Date(),
					})
					.where(eq(leaveBalances.id, balance.id));
			} else if (wasApproved) {
				// Was approved: remove from used, add to available
				await db
					.update(leaveBalances)
					.set({
						used: balance.used - request.totalDays,
						available: balance.available + request.totalDays,
						updatedAt: new Date(),
					})
					.where(eq(leaveBalances.id, balance.id));
			}
		}

		return updated;
	});

// ============================================================================
// HOLIDAYS
// ============================================================================

/**
 * Create Holiday
 * Creates an organization-wide holiday
 */
export const createHoliday = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			name: z.string().min(1),
			date: z.string(),
			isRecurring: z.boolean().default(false),
			isPaid: z.boolean().default(true),
			description: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		const newHoliday: NewHoliday = {
			organizationId: input.organizationId,
			name: input.name,
			date: input.date,
			isRecurring: input.isRecurring,
			isPaid: input.isPaid,
			description: input.description || null,
			isActive: true,
		};

		const [holiday] = await db.insert(holidays).values(newHoliday).returning();

		return holiday;
	});

/**
 * List Holidays
 * Returns holidays for an organization
 */
export const listHolidays = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			year: z.number().optional(),
			isActive: z.boolean().optional(),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(holidays.organizationId, input.organizationId)];

		if (input.isActive !== undefined) {
			conditions.push(eq(holidays.isActive, input.isActive));
		}

		if (input.year) {
			const startDate = `${input.year}-01-01`;
			const endDate = `${input.year}-12-31`;
			conditions.push(between(holidays.date, startDate, endDate));
		}

		const allHolidays = await db.query.holidays.findMany({
			where: and(...conditions),
			orderBy: [holidays.date],
		});

		return allHolidays;
	});

// Export as router object
export const leaveManagementRouter = {
	// Leave Types
	createLeaveType,
	listLeaveTypes,

	// Leave Policies
	createLeavePolicy,
	assignPolicy,

	// Leave Balances
	getLeaveBalance,
	getEmployeeBalances,
	initializeBalance,

	// Leave Requests
	createLeaveRequest,
	listLeaveRequests,
	approveLeaveRequest,
	rejectLeaveRequest,
	cancelLeaveRequest,

	// Holidays
	createHoliday,
	listHolidays,
};
