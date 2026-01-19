import type {
	NewFilingRequirement,
	NewIncomeTaxRule,
	NewSocialSecurityRule,
	NewTaxJurisdiction,
} from "../schema";

/**
 * Guyana Tax Jurisdiction Seed Data (2024/2025 Tax Year)
 *
 * This seed data represents the Guyanese tax system with:
 * - Progressive income tax (PAYE) with two bands
 * - Social security contributions (NIS)
 * - Personal deduction formula
 * - Filing requirements for annual returns
 *
 * References:
 * - Guyana Revenue Authority (GRA) tax bands
 * - National Insurance Scheme (NIS) contribution rates
 */

export const guyanaJurisdiction: NewTaxJurisdiction = {
	countryCode: "GY",
	name: "Guyana",
	currency: "GYD",
	currencySymbol: "G$",
	timezone: "America/Guyana",
	fiscalYearStart: 1, // January
	isActive: true,
};

/**
 * Guyana Income Tax Rules (PAYE) for 2024/2025
 *
 * Tax Bands:
 * - 25% on income up to G$3,120,000 annually (G$260,000 monthly)
 * - 35% on income above G$3,120,000
 *
 * Personal Deduction:
 * - Greater of G$1,560,000 or 33.3% of annual gross income
 * - Formula: MAX(1560000, {annualGross} * 0.333)
 */
export const guyanaIncomeTaxRule: NewIncomeTaxRule = {
	taxYear: 2024,
	bands: [
		{
			from: 0,
			to: 3_120_000, // G$3.12M annually (G$260K monthly)
			rate: 0.25, // 25%
		},
		{
			from: 3_120_000,
			to: null, // No upper limit
			rate: 0.35, // 35%
		},
	],
	personalDeduction: {
		type: "formula",
		basis: "annual",
		formula: "MAX(1560000, {annualGross} * 0.333)",
		description:
			"Personal deduction is the greater of G$1,560,000 or 33.3% of annual gross income",
	},
	roundingMode: "nearest",
	periodization: {
		allowMonthly: true,
		allowBiweekly: true,
		allowWeekly: true,
	},
};

/**
 * Guyana Social Security Rules (NIS) for 2024/2025
 *
 * National Insurance Scheme (NIS) Contribution Rates:
 * - Employee: 5.6% of gross earnings
 * - Employer: 8.4% of gross earnings
 * - Total: 14.0% of gross earnings
 *
 * Contribution Ceiling:
 * - G$280,000 per month (G$3,360,000 annually)
 * - Contributions only apply up to this ceiling
 */
export const guyanaSocialSecurityRule: NewSocialSecurityRule = {
	taxYear: 2024,
	employeeRate: 0.056, // 5.6%
	employerRate: 0.084, // 8.4%
	ceiling: 280_000, // Monthly ceiling G$280K
	ceilingPeriod: "monthly",
	basis: "gross",
	description:
		"National Insurance Scheme (NIS) contributions with monthly ceiling of G$280,000",
};

/**
 * Guyana Tax Filing Requirements
 *
 * Annual tax return requirements for employers and employees
 */
export const guyanaFilingRequirements: NewFilingRequirement[] = [
	{
		formName: "IT 01 - Annual Income Tax Return",
		frequency: "annual",
		dueDate: {
			month: 4, // April
			day: 30,
		},
		requiredFields: {
			employeeInfo: ["name", "tin", "nisNumber"],
			incomeBreakdown: ["grossSalary", "allowances", "bonuses", "otherIncome"],
			deductions: [
				"personalDeduction",
				"incomeTax",
				"nisContributions",
				"otherDeductions",
			],
			yearToDate: ["totalGross", "totalDeductions", "totalTax", "totalNis"],
		},
		description:
			"Annual income tax return for employees, due April 30th following the tax year",
	},
	{
		formName: "NIS Form 2 - Monthly Employer Return",
		frequency: "monthly",
		dueDate: {
			day: 15, // 15th of following month
		},
		requiredFields: {
			employerInfo: ["name", "nisEmployerNumber"],
			employeesList: [
				"employeeName",
				"nisNumber",
				"grossEarnings",
				"employeeContribution",
				"employerContribution",
			],
			totals: ["totalEmployees", "totalGross", "totalContributions"],
		},
		description:
			"Monthly NIS employer return showing all employee contributions, due by the 15th of the following month",
	},
	{
		formName: "PAYE Return - Monthly Tax Remittance",
		frequency: "monthly",
		dueDate: {
			day: 15, // 15th of following month
		},
		requiredFields: {
			employerInfo: ["name", "tin"],
			employeesList: ["employeeName", "tin", "grossIncome", "taxWithheld"],
			totals: ["totalEmployees", "totalGross", "totalTaxWithheld"],
		},
		description:
			"Monthly PAYE return showing income tax withheld from employees, due by the 15th of the following month",
	},
];

/**
 * Helper function to seed Guyana tax data
 *
 * Usage:
 * ```typescript
 * import { db } from "@PeopleFlow-HR-Suite/db";
 * import { seedGuyanaData } from "@PeopleFlow-HR-Suite/db/seeds/guyana-tax-rules";
 *
 * await seedGuyanaData(db);
 * ```
 */
export async function seedGuyanaData(db: any): Promise<void> {
	// 1. Create jurisdiction
	const [jurisdiction] = await db
		.insert("taxJurisdictions")
		.values(guyanaJurisdiction)
		.returning();

	const jurisdictionId = jurisdiction.id;

	// 2. Create income tax rule
	await db.insert("incomeTaxRules").values({
		...guyanaIncomeTaxRule,
		jurisdictionId,
	});

	// 3. Create social security rule
	await db.insert("socialSecurityRules").values({
		...guyanaSocialSecurityRule,
		jurisdictionId,
	});

	// 4. Create filing requirements
	for (const requirement of guyanaFilingRequirements) {
		await db.insert("filingRequirements").values({
			...requirement,
			jurisdictionId,
		});
	}

	console.log("✅ Guyana tax data seeded successfully");
	console.log(
		`   - Jurisdiction: ${jurisdiction.name} (${jurisdiction.countryCode})`
	);
	console.log(`   - Tax Year: ${guyanaIncomeTaxRule.taxYear}`);
	console.log(
		`   - Tax Bands: ${guyanaIncomeTaxRule.bands.length} progressive bands`
	);
	console.log(
		`   - NIS Rates: ${guyanaSocialSecurityRule.employeeRate * 100}% employee, ${guyanaSocialSecurityRule.employerRate * 100}% employer`
	);
	console.log(
		`   - Filing Requirements: ${guyanaFilingRequirements.length} forms`
	);
}
