import {
	db,
	type License,
	type LicenseInquiry,
	licenseInquiries,
	licenses,
	type Subscription,
	subscriptions,
} from "@PeopleFlow-HR-Suite/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure, publicProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const submitInquirySchema = z.object({
	name: z.string().min(1).max(255),
	email: z.string().email(),
	company: z.string().optional(),
	phone: z.string().optional(),
	inquiryType: z.enum(["on_prem", "enterprise", "custom", "partner"]),
	employeeCount: z.number().int().positive().optional(),
	message: z.string().optional(),
});

const validateLicenseSchema = z.object({
	licenseKey: z.string().min(1),
	organizationId: z.string().uuid(),
});

const updateLicenseSchema = z.object({
	licenseId: z.string().uuid(),
	organizationId: z.string().uuid(),
	seats: z.number().int().positive().optional(),
	isActive: z.boolean().optional(),
	salesNotes: z.string().optional(),
});

const createSubscriptionSchema = z.object({
	organizationId: z.string().uuid(),
	plan: z.enum([
		"starter_monthly",
		"starter_yearly",
		"pro_monthly",
		"pro_yearly",
		"enterprise",
	]),
	stripeSubscriptionId: z.string().optional(),
	stripeCustomerId: z.string().optional(),
});

// ============================================================================
// LICENSE INQUIRY PROCEDURES (Public)
// ============================================================================

/**
 * Submit a license inquiry for enterprise/on-prem pricing
 * Public endpoint - no auth required
 */
export const submitInquiry = publicProcedure
	.input(submitInquirySchema)
	.handler(async ({ input }) => {
		const [inquiry] = await db
			.insert(licenseInquiries)
			.values({
				name: input.name,
				email: input.email,
				company: input.company ?? null,
				phone: input.phone ?? null,
				inquiryType: input.inquiryType,
				employeeCount: input.employeeCount ?? null,
				message: input.message ?? null,
				status: "new",
			})
			.returning();

		return {
			success: true,
			inquiryId: inquiry?.id,
			message:
				"Thank you for your inquiry! Our sales team will contact you within 24 hours.",
		};
	});

// ============================================================================
// LICENSE MANAGEMENT PROCEDURES (Authenticated)
// ============================================================================

/**
 * Get current license for an organization
 */
export const getCurrentLicense = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
		})
	)
	.handler(async ({ input }): Promise<License | null> => {
		const license = await db.query.licenses.findFirst({
			where: and(
				eq(licenses.organizationId, input.organizationId),
				eq(licenses.isActive, true)
			),
			orderBy: [desc(licenses.createdAt)],
		});

		return license ?? null;
	});

/**
 * Validate a license key for on-prem deployment
 */
export const validateLicense = authedProcedure
	.input(validateLicenseSchema)
	.handler(async ({ input }) => {
		const license = await db.query.licenses.findFirst({
			where: and(
				eq(licenses.licenseKey, input.licenseKey),
				eq(licenses.organizationId, input.organizationId),
				eq(licenses.isActive, true)
			),
		});

		if (!license) {
			return {
				valid: false,
				message: "Invalid or inactive license key",
			};
		}

		// Check if license is expired
		if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
			return {
				valid: false,
				message: "License has expired",
			};
		}

		return {
			valid: true,
			license: {
				type: license.type,
				tier: license.tier,
				seats: license.seats,
				expiresAt: license.expiresAt,
			},
		};
	});

/**
 * Update license details (admin only)
 */
export const updateLicense = authedProcedure
	.input(updateLicenseSchema)
	.handler(async ({ input }) => {
		const [updated] = await db
			.update(licenses)
			.set({
				seats: input.seats,
				isActive: input.isActive,
				salesNotes: input.salesNotes,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(licenses.id, input.licenseId),
					eq(licenses.organizationId, input.organizationId)
				)
			)
			.returning();

		return {
			success: !!updated,
			license: updated,
		};
	});

/**
 * Create a new license (admin/sales only)
 */
export const createLicense = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			type: z.enum(["saas_monthly", "saas_yearly", "on_prem_perpetual"]),
			tier: z.enum(["starter", "professional", "enterprise"]),
			seats: z.number().int().positive().default(10),
			price: z.number().int().positive().optional(),
			licenseKey: z.string().optional(),
			expiresAt: z.string().datetime().optional(),
		})
	)
	.handler(async ({ input }) => {
		const [license] = await db
			.insert(licenses)
			.values({
				organizationId: input.organizationId,
				type: input.type,
				tier: input.tier,
				seats: input.seats,
				price: input.price ?? null,
				licenseKey: input.licenseKey ?? null,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				isActive: true,
			})
			.returning();

		return {
			success: true,
			license,
		};
	});

// ============================================================================
// SUBSCRIPTION MANAGEMENT PROCEDURES
// ============================================================================

/**
 * Get active subscription for an organization
 */
export const getActiveSubscription = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
		})
	)
	.handler(async ({ input }): Promise<Subscription | null> => {
		const subscription = await db.query.subscriptions.findFirst({
			where: and(
				eq(subscriptions.organizationId, input.organizationId),
				eq(subscriptions.status, "active")
			),
			orderBy: [desc(subscriptions.createdAt)],
		});

		return subscription ?? null;
	});

/**
 * Create a new subscription
 */
export const createSubscription = authedProcedure
	.input(createSubscriptionSchema)
	.handler(async ({ input }) => {
		// Determine billing cycle from plan
		const billingCycle = input.plan.includes("monthly") ? "monthly" : "yearly";

		// Set period dates
		const now = new Date();
		const periodEnd = new Date(now);
		if (billingCycle === "monthly") {
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		} else {
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		}

		const [subscription] = await db
			.insert(subscriptions)
			.values({
				organizationId: input.organizationId,
				plan: input.plan,
				billingCycle,
				amount: 0, // Will be set by payment processor
				status: "active",
				currentPeriodStart: now,
				currentPeriodEnd: periodEnd,
				stripeSubscriptionId: input.stripeSubscriptionId ?? null,
				stripeCustomerId: input.stripeCustomerId ?? null,
			})
			.returning();

		return {
			success: true,
			subscription,
		};
	});

/**
 * Cancel a subscription
 */
export const cancelSubscription = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			subscriptionId: z.string().uuid(),
			cancelImmediately: z.boolean().default(false),
		})
	)
	.handler(async ({ input }) => {
		const now = new Date();

		const [subscription] = await db
			.update(subscriptions)
			.set({
				status: input.cancelImmediately ? "canceled" : "active",
				cancelAt: input.cancelImmediately ? now : null,
				canceledAt: input.cancelImmediately ? now : null,
				updatedAt: now,
			})
			.where(
				and(
					eq(subscriptions.id, input.subscriptionId),
					eq(subscriptions.organizationId, input.organizationId)
				)
			)
			.returning();

		return {
			success: !!subscription,
			message: input.cancelImmediately
				? "Subscription canceled immediately"
				: "Subscription will cancel at end of billing period",
			subscription,
		};
	});

/**
 * List all inquiries (admin only)
 */
export const listInquiries = authedProcedure
	.input(
		z.object({
			status: z
				.enum(["new", "contacted", "in_progress", "converted", "closed"])
				.optional(),
			limit: z.number().int().positive().max(100).default(50),
		})
	)
	.handler(async ({ input }): Promise<LicenseInquiry[]> => {
		const whereClause = input.status
			? eq(licenseInquiries.status, input.status)
			: undefined;

		const results = await db.query.licenseInquiries.findMany({
			where: whereClause,
			orderBy: [desc(licenseInquiries.createdAt)],
			limit: input.limit,
		});

		return results;
	});

// ============================================================================
// ROUTER
// ============================================================================

export const licensingRouter = {
	// Public endpoints
	submitInquiry,

	// License management
	getCurrentLicense,
	validateLicense,
	updateLicense,
	createLicense,

	// Subscription management
	getActiveSubscription,
	createSubscription,
	cancelSubscription,

	// Admin
	listInquiries,
};
