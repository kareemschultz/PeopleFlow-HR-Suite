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
	code: z.string().min(1).max(10), // "GY", "TT", "US-CA"
	name: z.string().min(1).max(255),
	country: z.string().length(2), // ISO 3166-1 alpha-2
	region: z.string().optional(),
	currency: z.string().length(3),
	currencySymbol: z.string().max(10),
	timezone: z.string(),
	fiscalYearStart: z.number().int().min(1).max(12).default(1),
});

const createIncomeTaxRuleSchema = z.object({
	jurisdictionId: z.string().uuid(),
	taxYear: z.number().int().min(2000).max(2100),
	effectiveFrom: z.string().date(),
	effectiveTo: z.string().date().optional(),
	taxBands: z.array(
		z.object({
			order: z.number().int(),
			name: z.string(),
			minAmount: z.number().nonnegative(),
			maxAmount: z.number().nonnegative().nullable(),
			rate: z.number().min(0).max(1),
			flatAmount: z.number().optional(),
		})
	),
	personalDeduction: z.object({
		type: z.enum(["fixed", "percentage", "formula"]),
		fixedAmount: z.number().nonnegative().optional(),
		percentage: z.number().min(0).max(1).optional(),
		formula: z.string().optional(),
		minAmount: z.number().optional(),
		maxAmount: z.number().optional(),
		basis: z.enum(["annual", "monthly"]),
	}),
	roundingMode: z
		.enum(["nearest", "floor", "ceil", "banker"])
		.default("nearest"),
	roundingPrecision: z.number().int().positive().default(1),
	periodization: z
		.enum(["annualized", "true_period", "cumulative"])
		.default("annualized"),
});

const createSocialSecurityRuleSchema = z.object({
	jurisdictionId: z.string().uuid(),
	name: z.string().min(1),
	code: z.string().min(1),
	year: z.number().int().min(2000).max(2100),
	effectiveFrom: z.string().date(),
	effectiveTo: z.string().date().optional(),
	employeeRate: z.string(), // numeric stored as string
	employerRate: z.string(), // numeric stored as string
	selfEmployedRate: z.string().optional(),
	earningsFloor: z.number().int().nonnegative().optional(),
	earningsCeiling: z.number().int().nonnegative().optional(),
	roundingMode: z
		.enum(["nearest", "floor", "ceil", "banker"])
		.default("nearest"),
	roundingPrecision: z.number().int().positive().default(1),
});

const createFilingRequirementSchema = z.object({
	jurisdictionId: z.string().uuid(),
	code: z.string().min(1),
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	filingType: z.string().min(1),
	frequency: z.enum(["monthly", "quarterly", "annual"]),
	dueDayOfMonth: z.number().int().min(1).max(31).optional(),
	dueDaysAfterPeriod: z.number().int().min(1).max(90).optional(),
	requiredFields: z
		.array(
			z.object({
				fieldName: z.string(),
				source: z.string(),
				label: z.string(),
				format: z.enum(["string", "number", "currency", "date"]),
			})
		)
		.optional(),
	exportFormats: z.array(z.string()).optional(),
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
			code: input.code,
			name: input.name,
			country: input.country,
			region: input.region ?? null,
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
			orderBy: (rules, { desc }) => [desc(rules.year)],
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
			effectiveFrom: input.effectiveFrom,
			effectiveTo: input.effectiveTo ?? null,
			taxBands: input.taxBands,
			personalDeduction: input.personalDeduction,
			roundingMode: input.roundingMode,
			roundingPrecision: input.roundingPrecision,
			periodization: input.periodization,
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
				eq(socialSecurityRules.year, input.year)
			),
		});

		if (existing) {
			throw new Error(
				`Social security rule already exists for ${input.year}. Update the existing rule instead.`
			);
		}

		const newRule: NewSocialSecurityRule = {
			jurisdictionId: input.jurisdictionId,
			name: input.name,
			code: input.code,
			year: input.year,
			effectiveFrom: input.effectiveFrom,
			effectiveTo: input.effectiveTo ?? null,
			employeeRate: input.employeeRate,
			employerRate: input.employerRate,
			selfEmployedRate: input.selfEmployedRate ?? null,
			earningsFloor: input.earningsFloor ?? null,
			earningsCeiling: input.earningsCeiling ?? null,
			roundingMode: input.roundingMode,
			roundingPrecision: input.roundingPrecision,
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
			year: z.number().int().min(2000).max(2100),
		})
	)
	.handler(async ({ input }) => {
		const rule = await db.query.socialSecurityRules.findFirst({
			where: and(
				eq(socialSecurityRules.jurisdictionId, input.jurisdictionId),
				eq(socialSecurityRules.year, input.year)
			),
		});

		if (!rule) {
			throw new Error(
				`No social security rule found for ${input.year} in this jurisdiction`
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
			code: input.code,
			name: input.name,
			description: input.description ?? null,
			filingType: input.filingType,
			frequency: input.frequency,
			dueDayOfMonth: input.dueDayOfMonth ?? null,
			dueDaysAfterPeriod: input.dueDaysAfterPeriod ?? null,
			requiredFields: input.requiredFields ?? null,
			exportFormats: input.exportFormats ?? null,
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
