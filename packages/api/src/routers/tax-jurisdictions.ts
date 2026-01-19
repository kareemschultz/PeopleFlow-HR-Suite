import {
	db,
	filingRequirements,
	incomeTaxRules,
	type NewFilingRequirement,
	type NewIncomeTaxRule,
	type NewSocialSecurityRule,
	type NewTaxJurisdiction,
	socialSecurityRules,
	taxJurisdictions,
} from "@PeopleFlow-HR-Suite/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure, publicProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createJurisdictionSchema = z.object({
	countryCode: z.string().length(2),
	name: z.string().min(1).max(255),
	currency: z.string().length(3),
	currencySymbol: z.string().max(10),
	timezone: z.string(),
	fiscalYearStart: z.number().int().min(1).max(12).default(1),
});

const createIncomeTaxRuleSchema = z.object({
	jurisdictionId: z.string().uuid(),
	taxYear: z.number().int().min(2000).max(2100),
	bands: z.array(
		z.object({
			from: z.number().nonnegative(),
			to: z.number().nonnegative().nullable(),
			rate: z.number().min(0).max(1),
		})
	),
	personalDeduction: z.object({
		type: z.enum(["fixed", "formula"]),
		basis: z.enum(["annual", "monthly"]),
		amount: z.number().nonnegative().optional(),
		formula: z.string().optional(),
		description: z.string().optional(),
	}),
	roundingMode: z.enum(["nearest", "up", "down"]).default("nearest"),
	periodization: z
		.object({
			allowMonthly: z.boolean(),
			allowBiweekly: z.boolean(),
			allowWeekly: z.boolean(),
		})
		.optional(),
});

const createSocialSecurityRuleSchema = z.object({
	jurisdictionId: z.string().uuid(),
	taxYear: z.number().int().min(2000).max(2100),
	employeeRate: z.number().min(0).max(1),
	employerRate: z.number().min(0).max(1),
	ceiling: z.number().nonnegative().nullable(),
	ceilingPeriod: z.enum(["annual", "monthly", "weekly"]).nullable(),
	basis: z.enum(["gross", "taxable"]),
});

const createFilingRequirementSchema = z.object({
	jurisdictionId: z.string().uuid(),
	formName: z.string().min(1).max(255),
	description: z.string().optional(),
	frequency: z.enum(["monthly", "quarterly", "annual"]),
	dueDay: z.number().int().min(1).max(31),
	requiredFields: z.record(z.string(), z.any()),
});

// ============================================================================
// TAX JURISDICTION PROCEDURES
// ============================================================================

/**
 * Create a new tax jurisdiction
 */
export const createJurisdiction = authedProcedure
	.input(createJurisdictionSchema)
	.handler(async ({ input }) => {
		const newJurisdiction: NewTaxJurisdiction = {
			countryCode: input.countryCode,
			name: input.name,
			currency: input.currency,
			currencySymbol: input.currencySymbol,
			timezone: input.timezone,
			fiscalYearStart: input.fiscalYearStart,
			isActive: true,
		};

		const [jurisdiction] = await db
			.insert(taxJurisdictions)
			.values(newJurisdiction)
			.returning();

		if (!jurisdiction) {
			throw new Error("Failed to create tax jurisdiction");
		}

		return jurisdiction;
	});

/**
 * List all tax jurisdictions
 */
export const listJurisdictions = publicProcedure.handler(async () => {
	const jurisdictions = await db.query.taxJurisdictions.findMany({
		where: eq(taxJurisdictions.isActive, true),
		orderBy: (jurisdictions, { asc }) => [asc(jurisdictions.name)],
	});

	return jurisdictions;
});

/**
 * Get jurisdiction by ID with all tax rules
 */
export const getJurisdiction = publicProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ input }) => {
		const jurisdiction = await db.query.taxJurisdictions.findFirst({
			where: eq(taxJurisdictions.id, input.id),
		});

		if (!jurisdiction) {
			throw new Error("Tax jurisdiction not found");
		}

		// Get all tax rules for this jurisdiction
		const taxRules = await db.query.incomeTaxRules.findMany({
			where: eq(incomeTaxRules.jurisdictionId, input.id),
			orderBy: (rules, { desc }) => [desc(rules.taxYear)],
		});

		const nisRules = await db.query.socialSecurityRules.findMany({
			where: eq(socialSecurityRules.jurisdictionId, input.id),
			orderBy: (rules, { desc }) => [desc(rules.taxYear)],
		});

		const filings = await db.query.filingRequirements.findMany({
			where: eq(filingRequirements.jurisdictionId, input.id),
		});

		return {
			...jurisdiction,
			incomeTaxRules: taxRules,
			socialSecurityRules: nisRules,
			filingRequirements: filings,
		};
	});

// ============================================================================
// INCOME TAX RULES
// ============================================================================

/**
 * Create income tax rule for a jurisdiction
 */
export const createIncomeTaxRule = authedProcedure
	.input(createIncomeTaxRuleSchema)
	.handler(async ({ input }) => {
		// Check if rule already exists for this jurisdiction and year
		const existing = await db.query.incomeTaxRules.findFirst({
			where: and(
				eq(incomeTaxRules.jurisdictionId, input.jurisdictionId),
				eq(incomeTaxRules.taxYear, input.taxYear)
			),
		});

		if (existing) {
			throw new Error(
				`Income tax rule already exists for ${input.taxYear}. Update the existing rule instead.`
			);
		}

		const newRule: NewIncomeTaxRule = {
			jurisdictionId: input.jurisdictionId,
			taxYear: input.taxYear,
			bands: input.bands,
			personalDeduction: input.personalDeduction,
			roundingMode: input.roundingMode,
			periodization: input.periodization || {
				allowMonthly: true,
				allowBiweekly: true,
				allowWeekly: true,
			},
		};

		const [rule] = await db.insert(incomeTaxRules).values(newRule).returning();

		if (!rule) {
			throw new Error("Failed to create income tax rule");
		}

		return rule;
	});

/**
 * Get income tax rules for a jurisdiction and year
 */
export const getIncomeTaxRule = publicProcedure
	.input(
		z.object({
			jurisdictionId: z.string().uuid(),
			taxYear: z.number().int().min(2000).max(2100),
		})
	)
	.handler(async ({ input }) => {
		const rule = await db.query.incomeTaxRules.findFirst({
			where: and(
				eq(incomeTaxRules.jurisdictionId, input.jurisdictionId),
				eq(incomeTaxRules.taxYear, input.taxYear)
			),
		});

		if (!rule) {
			throw new Error(
				`No income tax rule found for ${input.taxYear} in this jurisdiction`
			);
		}

		return rule;
	});

// ============================================================================
// SOCIAL SECURITY RULES
// ============================================================================

/**
 * Create social security rule for a jurisdiction
 */
export const createSocialSecurityRule = authedProcedure
	.input(createSocialSecurityRuleSchema)
	.handler(async ({ input }) => {
		const existing = await db.query.socialSecurityRules.findFirst({
			where: and(
				eq(socialSecurityRules.jurisdictionId, input.jurisdictionId),
				eq(socialSecurityRules.taxYear, input.taxYear)
			),
		});

		if (existing) {
			throw new Error(
				`Social security rule already exists for ${input.taxYear}. Update the existing rule instead.`
			);
		}

		const newRule: NewSocialSecurityRule = {
			jurisdictionId: input.jurisdictionId,
			taxYear: input.taxYear,
			employeeRate: input.employeeRate,
			employerRate: input.employerRate,
			ceiling: input.ceiling,
			ceilingPeriod: input.ceilingPeriod,
			basis: input.basis,
		};

		const [rule] = await db
			.insert(socialSecurityRules)
			.values(newRule)
			.returning();

		if (!rule) {
			throw new Error("Failed to create social security rule");
		}

		return rule;
	});

/**
 * Get social security rule for a jurisdiction and year
 */
export const getSocialSecurityRule = publicProcedure
	.input(
		z.object({
			jurisdictionId: z.string().uuid(),
			taxYear: z.number().int().min(2000).max(2100),
		})
	)
	.handler(async ({ input }) => {
		const rule = await db.query.socialSecurityRules.findFirst({
			where: and(
				eq(socialSecurityRules.jurisdictionId, input.jurisdictionId),
				eq(socialSecurityRules.taxYear, input.taxYear)
			),
		});

		if (!rule) {
			throw new Error(
				`No social security rule found for ${input.taxYear} in this jurisdiction`
			);
		}

		return rule;
	});

// ============================================================================
// FILING REQUIREMENTS
// ============================================================================

/**
 * Create filing requirement for a jurisdiction
 */
export const createFilingRequirement = authedProcedure
	.input(createFilingRequirementSchema)
	.handler(async ({ input }) => {
		const newFiling: NewFilingRequirement = {
			jurisdictionId: input.jurisdictionId,
			formName: input.formName,
			description: input.description || null,
			frequency: input.frequency,
			dueDay: input.dueDay,
			requiredFields: input.requiredFields,
		};

		const [filing] = await db
			.insert(filingRequirements)
			.values(newFiling)
			.returning();

		if (!filing) {
			throw new Error("Failed to create filing requirement");
		}

		return filing;
	});

/**
 * List filing requirements for a jurisdiction
 */
export const listFilingRequirements = publicProcedure
	.input(z.object({ jurisdictionId: z.string().uuid() }))
	.handler(async ({ input }) => {
		const filings = await db.query.filingRequirements.findMany({
			where: eq(filingRequirements.jurisdictionId, input.jurisdictionId),
		});

		return filings;
	});

// ============================================================================
// ROUTER
// ============================================================================

export const taxJurisdictionsRouter = {
	// Jurisdictions
	createJurisdiction,
	listJurisdictions,
	getJurisdiction,

	// Income tax rules
	createIncomeTaxRule,
	getIncomeTaxRule,

	// Social security rules
	createSocialSecurityRule,
	getSocialSecurityRule,

	// Filing requirements
	createFilingRequirement,
	listFilingRequirements,
};
