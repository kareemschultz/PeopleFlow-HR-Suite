import { db, departments, type NewDepartment } from "@PeopleFlow-HR-Suite/db";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createDepartmentSchema = z.object({
	organizationId: z.string().uuid(),
	name: z.string().min(1).max(255),
	code: z.string().min(1).max(50),
	description: z.string().optional(),
	parentDepartmentId: z.string().uuid().optional(),
	location: z.string().optional(),
	settings: z
		.object({
			annualBudget: z.number().positive().optional(),
			budgetCurrency: z.string().length(3).optional(),
			requiresApprovalForLeave: z.boolean().optional(),
			requiresApprovalForExpenses: z.boolean().optional(),
			notifyHeadOnNewEmployee: z.boolean().optional(),
		})
		.optional(),
});

const updateDepartmentSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	code: z.string().min(1).max(50).optional(),
	description: z.string().optional(),
	parentDepartmentId: z.string().uuid().nullable().optional(),
	headEmployeeId: z.string().uuid().nullable().optional(),
	location: z.string().optional(),
	settings: z
		.object({
			annualBudget: z.number().positive().optional(),
			budgetCurrency: z.string().length(3).optional(),
			requiresApprovalForLeave: z.boolean().optional(),
			requiresApprovalForExpenses: z.boolean().optional(),
			notifyHeadOnNewEmployee: z.boolean().optional(),
		})
		.optional(),
	isActive: z.boolean().optional(),
});

// ============================================================================
// PROCEDURES
// ============================================================================

/**
 * Create a new department
 */
export const createDepartment = authedProcedure
	.input(createDepartmentSchema)
	.handler(async ({ input }) => {
		const [department] = await db
			.insert(departments)
			.values(input as NewDepartment)
			.returning();

		return department;
	});

/**
 * Get department by ID with its relationships
 */
export const getDepartment = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const department = await db.query.departments.findFirst({
			where: eq(departments.id, input.id),
			with: {
				parentDepartment: true,
				subDepartments: true,
				positions: true,
			},
		});

		if (!department) {
			throw new Error("Department not found");
		}

		return department;
	});

/**
 * List departments with optional filtering
 */
export const listDepartments = authedProcedure
	.input(
		z
			.object({
				organizationId: z.string().uuid(),
				search: z.string().optional(),
				parentDepartmentId: z.string().uuid().optional(),
				isActive: z.boolean().optional(),
				limit: z.number().int().positive().max(100).default(50),
				offset: z.number().int().nonnegative().default(0),
			})
			.optional()
	)
	.handler(async ({ input }) => {
		if (!input?.organizationId) {
			throw new Error("organizationId is required");
		}

		const filters = [eq(departments.organizationId, input.organizationId)];

		if (input?.search) {
			filters.push(like(departments.name, `%${input.search}%`));
		}

		if (input?.parentDepartmentId !== undefined) {
			filters.push(
				eq(departments.parentDepartmentId, input.parentDepartmentId)
			);
		}

		if (input?.isActive !== undefined) {
			filters.push(eq(departments.isActive, input.isActive));
		}

		const depts = await db.query.departments.findMany({
			where: and(...filters),
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: (depts, { asc }) => [asc(depts.name)],
		});

		return depts;
	});

/**
 * Update a department
 */
export const updateDepartment = authedProcedure
	.input(updateDepartmentSchema)
	.handler(async ({ input }) => {
		const { id, ...updates } = input;

		const [updated] = await db
			.update(departments)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(departments.id, id))
			.returning();

		if (!updated) {
			throw new Error("Department not found");
		}

		return updated;
	});

/**
 * Delete (soft delete by marking inactive) a department
 */
export const deleteDepartment = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.update(departments)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(eq(departments.id, input.id))
			.returning();

		if (!deleted) {
			throw new Error("Department not found");
		}

		return { success: true };
	});

// ============================================================================
// ROUTER
// ============================================================================

export const departmentsRouter = {
	create: createDepartment,
	get: getDepartment,
	list: listDepartments,
	update: updateDepartment,
	delete: deleteDepartment,
};
