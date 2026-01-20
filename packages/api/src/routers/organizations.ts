import {
	db,
	type NewOrganization,
	organizationMembers,
	organizations,
} from "@PeopleFlow-HR-Suite/db";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from ".."; // using .. because we are in routers/organizations.ts -> routers/index.ts is not parent, generic index might be?

// Actually authedProcedure is imported from ".." in the original file, which is odd if it's in routers/.
// Let's trust the existing import: import { authedProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createOrganizationSchema = z.object({
	name: z.string().min(1).max(255),
	slug: z.string().min(1).max(100),
	description: z.string().optional(),
	logo: z.string().url().optional(),
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	timezone: z.string().default("America/Guyana"),
	currency: z.string().length(3).default("GYD"),
	currencySymbol: z.string().default("G$"),
	fiscalYearStart: z.number().int().min(1).max(12).default(1),
	settings: z
		.object({
			payrollFrequency: z
				.enum(["weekly", "biweekly", "monthly", "semimonthly"])
				.optional(),
			payrollDayOfMonth: z.number().int().min(1).max(31).optional(),
			overtimeMultiplier: z.number().positive().optional(),
			annualLeaveDays: z.number().int().nonnegative().optional(),
			sickLeaveDays: z.number().int().nonnegative().optional(),
			carryoverAllowed: z.boolean().optional(),
			requiresPayrollApproval: z.boolean().optional(),
			requiresLeaveApproval: z.boolean().optional(),
			notifyOnPayrollRun: z.boolean().optional(),
			notifyOnLeaveRequest: z.boolean().optional(),
		})
		.optional(),
});

const updateOrganizationSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	logo: z.string().url().optional(),
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	timezone: z.string().optional(),
	currency: z.string().length(3).optional(),
	currencySymbol: z.string().optional(),
	fiscalYearStart: z.number().int().min(1).max(12).optional(),
	settings: z
		.object({
			payrollFrequency: z
				.enum(["weekly", "biweekly", "monthly", "semimonthly"])
				.optional(),
			payrollDayOfMonth: z.number().int().min(1).max(31).optional(),
			overtimeMultiplier: z.number().positive().optional(),
			annualLeaveDays: z.number().int().nonnegative().optional(),
			sickLeaveDays: z.number().int().nonnegative().optional(),
			carryoverAllowed: z.boolean().optional(),
			requiresPayrollApproval: z.boolean().optional(),
			requiresLeaveApproval: z.boolean().optional(),
			notifyOnPayrollRun: z.boolean().optional(),
			notifyOnLeaveRequest: z.boolean().optional(),
		})
		.optional(),
	isActive: z.boolean().optional(),
});

const updateMemberSchema = z.object({
	memberId: z.string().uuid(),
	role: z
		.enum([
			"owner",
			"admin",
			"hr_manager",
			"payroll_manager",
			"manager",
			"member",
		])
		.optional(),
	permissions: z
		.object({
			canManageOrganization: z.boolean().optional(),
			canManageEmployees: z.boolean().optional(),
			canManageDepartments: z.boolean().optional(),
			canManagePayroll: z.boolean().optional(),
			canViewReports: z.boolean().optional(),
			canApproveLeave: z.boolean().optional(),
			canApprovePayroll: z.boolean().optional(),
		})
		.optional(),
});

// ============================================================================
// PROCEDURES
// ============================================================================

/**
 * Create a new organization
 */
export const createOrganization = authedProcedure
	.input(createOrganizationSchema)
	.handler(async ({ input }) => {
		// Check if slug already exists
		const existing = await db.query.organizations.findFirst({
			where: eq(organizations.slug, input.slug),
		});

		if (existing) {
			throw new Error("Organization with this slug already exists");
		}

		const [organization] = await db
			.insert(organizations)
			.values(input as NewOrganization)
			.returning();

		return organization;
	});

/**
 * Get organization by ID
 */
export const getOrganization = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const organization = await db.query.organizations.findFirst({
			where: eq(organizations.id, input.id),
		});

		if (!organization) {
			throw new Error("Organization not found");
		}

		return organization;
	});

/**
 * List organizations with optional filtering
 */
export const listOrganizations = authedProcedure
	.input(
		z
			.object({
				search: z.string().optional(),
				isActive: z.boolean().optional(),
				limit: z.number().int().positive().max(100).default(50),
				offset: z.number().int().nonnegative().default(0),
			})
			.optional()
	)
	.handler(async ({ input }) => {
		const filters = [];

		if (input?.search) {
			filters.push(like(organizations.name, `%${input.search}%`));
		}

		if (input?.isActive !== undefined) {
			filters.push(eq(organizations.isActive, input.isActive));
		}

		const orgs = await db.query.organizations.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],
		});

		return orgs;
	});

/**
 * Update an organization
 */
export const updateOrganization = authedProcedure
	.input(updateOrganizationSchema)
	.handler(async ({ input }) => {
		const { id, ...updates } = input;

		const [updated] = await db
			.update(organizations)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(organizations.id, id))
			.returning();

		if (!updated) {
			throw new Error("Organization not found");
		}

		return updated;
	});

/**
 * Delete (soft delete by marking inactive) an organization
 */
export const deleteOrganization = authedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.update(organizations)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(eq(organizations.id, input.id))
			.returning();

		if (!deleted) {
			throw new Error("Organization not found");
		}

		return { success: true };
	});

/**
 * List members of an organization
 */
export const listMembers = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			limit: z.number().int().positive().max(100).default(50),
			offset: z.number().int().nonnegative().default(0),
		})
	)
	.handler(async ({ input }) => {
		const members = await db.query.organizationMembers.findMany({
			where: eq(organizationMembers.organizationId, input.organizationId),
			with: {
				user: true,
			},
			limit: input.limit,
			offset: input.offset,
			orderBy: (members, { desc }) => [desc(members.joinedAt)],
		});

		return members;
	});

/**
 * Update a member's role or permissions
 */
export const updateMember = authedProcedure
	.input(updateMemberSchema)
	.handler(async ({ input }) => {
		const { memberId, ...updates } = input;

		const [updated] = await db
			.update(organizationMembers)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(organizationMembers.id, memberId))
			.returning();

		if (!updated) {
			throw new Error("Member not found");
		}

		return updated;
	});

/**
 * Remove a member from an organization
 */
export const removeMember = authedProcedure
	.input(z.object({ memberId: z.string().uuid() }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.delete(organizationMembers)
			.where(eq(organizationMembers.id, input.memberId))
			.returning();

		if (!deleted) {
			throw new Error("Member not found");
		}

		return { success: true };
	});

/**
 * Get current user's organization memberships
 */
export const myOrganizations = authedProcedure.handler(async ({ context }) => {
	const userId = context.session.user.id;

	const memberships = await db.query.organizationMembers.findMany({
		where: and(
			eq(organizationMembers.userId, userId),
			eq(organizationMembers.isActive, true)
		),
		with: {
			organization: true,
		},
		orderBy: (members, { desc }) => [desc(members.joinedAt)],
	});

	return memberships;
});

// ============================================================================
// ROUTER
// ============================================================================

export const organizationsRouter = {
	create: createOrganization,
	get: getOrganization,
	list: listOrganizations,
	update: updateOrganization,
	delete: deleteOrganization,

	// Members
	listMembers,
	updateMember,
	removeMember,

	// Current user
	myOrganizations,
};
