import { zValidator } from "@hono/zod-validator";
import { db } from "@PeopleFlow-HR-Suite/db";
import {
	type NewOrganization,
	type Organization,
	organizations,
} from "@PeopleFlow-HR-Suite/db/schema";
import { oz } from "@orpc/zod";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from "../context";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createOrganizationSchema = oz.input(
	z.object({
		name: z.string().min(1).max(255),
		slug: z.string().min(1).max(100),
		description: z.string().optional(),
		logo: z.string().url().optional(),
		primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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
	})
);

const updateOrganizationSchema = oz.input(
	z.object({
		id: z.string().uuid(),
		name: z.string().min(1).max(255).optional(),
		description: z.string().optional(),
		logo: z.string().url().optional(),
		primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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
	})
);

// ============================================================================
// PROCEDURES
// ============================================================================

/**
 * Create a new organization
 */
export const createOrganization = authedProcedure
	.input(createOrganizationSchema)
	.use(async ({ next, context, input }) => {
		// Check if slug already exists
		const existing = await db.query.organizations.findFirst({
			where: eq(organizations.slug, input.slug),
		});

		if (existing) {
			throw new Error("Organization with this slug already exists");
		}

		return next({ context });
	})
	.handler(async ({ input }) => {
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
	.input(oz.input(z.object({ id: z.string().uuid() })))
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
		oz.input(
			z
				.object({
					search: z.string().optional(),
					isActive: z.boolean().optional(),
					limit: z.number().int().positive().max(100).default(50),
					offset: z.number().int().nonnegative().default(0),
				})
				.optional()
		)
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
	.input(oz.input(z.object({ id: z.string().uuid() })))
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

// ============================================================================
// ROUTER
// ============================================================================

export const organizationsRouter = {
	create: createOrganization,
	get: getOrganization,
	list: listOrganizations,
	update: updateOrganization,
	delete: deleteOrganization,
};
