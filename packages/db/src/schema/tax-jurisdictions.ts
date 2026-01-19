import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";

// ============================================================================
// TAX JURISDICTIONS - Multi-Country Support
// ============================================================================

/**
 * Tax jurisdictions - master list of countries/regions with their tax rules.
 * Each organization selects which jurisdiction's tax rules to use.
 */
export const taxJurisdictions = pgTable("tax_jurisdictions", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Identity
	code: text("code").notNull().unique(), // "GY", "TT", "BB", "US-CA"
	name: text("name").notNull(), // "Guyana", "Trinidad & Tobago"
	country: text("country").notNull(), // ISO 3166-1 alpha-2
	region: text("region"), // For sub-national (e.g., US states)

	// Currency
	currency: text("currency").notNull(), // "GYD", "TTD", "USD"
	currencySymbol: text("currency_symbol").notNull(), // "G$", "TT$", "$"

	// Timezone
	timezone: text("timezone").notNull(), // "America/Guyana"

	// Fiscal year
	fiscalYearStart: integer("fiscal_year_start").notNull().default(1), // Month (1-12)

	// Status
	isActive: boolean("is_active").notNull().default(true),
	isDefault: boolean("is_default").notNull().default(false), // Only one can be default

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// INCOME TAX RULES (PAYE equivalent)
// ============================================================================

/**
 * Income tax rules - defines progressive tax bands and personal deductions.
 * Supports configurable formulas for maximum flexibility.
 */
export const incomeTaxRules = pgTable(
	"income_tax_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jurisdictionId: uuid("jurisdiction_id")
			.notNull()
			.references(() => taxJurisdictions.id, { onDelete: "cascade" }),

		// Effective period
		taxYear: integer("tax_year").notNull(),
		effectiveFrom: date("effective_from").notNull(),
		effectiveTo: date("effective_to"),

		// Tax bands (progressive rates)
		taxBands: jsonb("tax_bands")
			.$type<
				{
					order: number;
					name: string; // "First band", "Second band"
					minAmount: number; // 0
					maxAmount: number | null; // null = unlimited
					rate: number; // 0.25 = 25%
					flatAmount?: number; // For flat + percentage systems
				}[]
			>()
			.notNull(),

		// Personal deductions (configurable formula)
		personalDeduction: jsonb("personal_deduction")
			.$type<{
				type: "fixed" | "percentage" | "formula";
				fixedAmount?: number;
				percentage?: number;
				formula?: string; // "MAX(1560000, {annualGross} * 0.333)"
				minAmount?: number;
				maxAmount?: number;
				basis: "annual" | "monthly";
			}>()
			.notNull(),

		// Allowances / Exemptions
		allowances:
			jsonb("allowances").$type<
				{
					code: string; // "OVERTIME_EXEMPT", "CHILD_ALLOWANCE"
					name: string;
					description: string;
					type: "fixed" | "percentage" | "formula";
					value: number;
					formula?: string;
					monthlyCap?: number;
					annualCap?: number;
					conditions?: {
						field: string;
						operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte";
						value: unknown;
					}[];
					reducesTaxableIncome: boolean;
				}[]
			>(),

		// Calculation settings
		periodization: text("periodization").notNull().default("annualized"),
		// "annualized" = calculate annual, divide by periods
		// "true_period" = calculate for actual period
		// "cumulative" = YTD calculation

		// Rounding (CRITICAL for audits)
		roundingMode: text("rounding_mode").notNull().default("nearest"),
		// "nearest" = Math.round
		// "floor" = Math.floor (always round down)
		// "ceil" = Math.ceil (always round up)
		// "banker" = Round half to even

		roundingPrecision: integer("rounding_precision").notNull().default(1),
		// 1 = round to nearest cent
		// 5 = round to nearest 5 cents
		// 10 = round to nearest 10 cents
		// 100 = round to nearest dollar

		// Metadata
		sourceUrl: text("source_url"), // Link to official tax authority
		notes: text("notes"),

		// Audit
		createdBy: uuid("created_by").references(() => employees.id),
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique().on(table.jurisdictionId, table.taxYear),
		index("income_tax_jurisdiction_idx").on(table.jurisdictionId),
	]
);

// ============================================================================
// SOCIAL SECURITY RULES (NIS equivalent)
// ============================================================================

/**
 * Social security rules - employee and employer contribution rates.
 * Supports earnings ceilings and multiple contribution types.
 */
export const socialSecurityRules = pgTable(
	"social_security_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jurisdictionId: uuid("jurisdiction_id")
			.notNull()
			.references(() => taxJurisdictions.id, { onDelete: "cascade" }),

		// Identity
		name: text("name").notNull(), // "National Insurance Scheme", "Social Security"
		code: text("code").notNull(), // "NIS", "SSA"

		// Effective period
		year: integer("year").notNull(),
		effectiveFrom: date("effective_from").notNull(),
		effectiveTo: date("effective_to"),

		// Contribution rates
		employeeRate: numeric("employee_rate", {
			precision: 6,
			scale: 4,
		}).notNull(),
		// 0.0560 = 5.6%

		employerRate: numeric("employer_rate", {
			precision: 6,
			scale: 4,
		}).notNull(),
		// 0.0840 = 8.4%

		selfEmployedRate: numeric("self_employed_rate", {
			precision: 6,
			scale: 4,
		}),

		// Earnings limits
		earningsFloor: integer("earnings_floor"), // null = no minimum
		earningsCeiling: integer("earnings_ceiling"), // null = no ceiling

		// Calculation settings
		includedEarnings: jsonb("included_earnings").$type<string[]>(),
		// ["basic", "overtime", "allowances"] or ["all"]

		excludedEarnings: jsonb("excluded_earnings").$type<string[]>(),
		// ["reimbursements", "severance"]

		// Rounding
		roundingMode: text("rounding_mode").notNull().default("nearest"),
		roundingPrecision: integer("rounding_precision").notNull().default(1),

		// Metadata
		sourceUrl: text("source_url"),
		notes: text("notes"),

		// Audit
		createdBy: uuid("created_by").references(() => employees.id),
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique().on(table.jurisdictionId, table.year),
		index("social_security_jurisdiction_idx").on(table.jurisdictionId),
	]
);

// ============================================================================
// FILING REQUIREMENTS (GRA Form equivalent)
// ============================================================================

/**
 * Filing requirements - government forms and reporting obligations.
 * Defines what data needs to be reported and when.
 */
export const filingRequirements = pgTable("filing_requirements", {
	id: uuid("id").primaryKey().defaultRandom(),
	jurisdictionId: uuid("jurisdiction_id")
		.notNull()
		.references(() => taxJurisdictions.id, { onDelete: "cascade" }),

	// Identity
	code: text("code").notNull(), // "GRA_FORM_2", "BIR_P9"
	name: text("name").notNull(), // "Monthly PAYE Return"
	description: text("description"),

	// Type
	filingType: text("filing_type").notNull(),
	// "income_tax_monthly", "income_tax_annual", "social_security", "other"

	// Frequency
	frequency: text("frequency").notNull(),
	// "monthly", "quarterly", "annual"

	// Due date calculation
	dueDayOfMonth: integer("due_day_of_month"), // 15 = due on 15th
	dueDaysAfterPeriod: integer("due_days_after_period"), // 15 = 15 days after period ends

	// Required fields
	requiredFields:
		jsonb("required_fields").$type<
			{
				fieldName: string;
				source: string; // "employee.taxId", "payslip.grossEarnings"
				label: string;
				format: "string" | "number" | "currency" | "date";
			}[]
		>(),

	// Export format
	exportFormats: jsonb("export_formats").$type<string[]>(),
	// ["csv", "xlsx", "xml", "pdf"]

	// Template (for PDF/custom formats)
	templateUrl: text("template_url"),

	// Status
	isActive: boolean("is_active").notNull().default(true),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const taxJurisdictionsRelations = relations(
	taxJurisdictions,
	({ many }) => ({
		incomeTaxRules: many(incomeTaxRules),
		socialSecurityRules: many(socialSecurityRules),
		filingRequirements: many(filingRequirements),
		// Future: organizations: many(organizations),
	})
);

export const incomeTaxRulesRelations = relations(incomeTaxRules, ({ one }) => ({
	jurisdiction: one(taxJurisdictions, {
		fields: [incomeTaxRules.jurisdictionId],
		references: [taxJurisdictions.id],
	}),
}));

export const socialSecurityRulesRelations = relations(
	socialSecurityRules,
	({ one }) => ({
		jurisdiction: one(taxJurisdictions, {
			fields: [socialSecurityRules.jurisdictionId],
			references: [taxJurisdictions.id],
		}),
	})
);

export const filingRequirementsRelations = relations(
	filingRequirements,
	({ one }) => ({
		jurisdiction: one(taxJurisdictions, {
			fields: [filingRequirements.jurisdictionId],
			references: [taxJurisdictions.id],
		}),
	})
);

// ============================================================================
// TYPES
// ============================================================================

export type TaxJurisdiction = typeof taxJurisdictions.$inferSelect;
export type NewTaxJurisdiction = typeof taxJurisdictions.$inferInsert;

export type IncomeTaxRule = typeof incomeTaxRules.$inferSelect;
export type NewIncomeTaxRule = typeof incomeTaxRules.$inferInsert;

export type SocialSecurityRule = typeof socialSecurityRules.$inferSelect;
export type NewSocialSecurityRule = typeof socialSecurityRules.$inferInsert;

export type FilingRequirement = typeof filingRequirements.$inferSelect;
export type NewFilingRequirement = typeof filingRequirements.$inferInsert;

// Helper types
export type TaxBand = NonNullable<IncomeTaxRule["taxBands"]>[number];
export type PersonalDeduction = NonNullable<IncomeTaxRule["personalDeduction"]>;
export type TaxAllowance = NonNullable<IncomeTaxRule["allowances"]>[number];
export type RequiredField = NonNullable<
	FilingRequirement["requiredFields"]
>[number];
