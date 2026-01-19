import {
	filingRequirements,
	incomeTaxRules,
	type NewFilingRequirement,
	type NewIncomeTaxRule,
	type NewSocialSecurityRule,
	type NewTaxJurisdiction,
	socialSecurityRules,
	taxJurisdictions,
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
	code: "GY", // Unique jurisdiction code
	name: "Guyana",
	country: "GY", // ISO 3166-1 alpha-2
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
	effectiveFrom: new Date("2024-01-01"), // Effective from start of 2024 tax year
	effectiveTo: new Date("2024-12-31"), // Effective until end of 2024
	taxBands: [
		{
			order: 1,
			name: "First Band",
			minAmount: 0,
			maxAmount: 3_120_000, // G$3.12M annually (G$260K monthly)
			rate: 0.25, // 25%
		},
		{
			order: 2,
			name: "Second Band",
			minAmount: 3_120_000,
			maxAmount: null, // No upper limit
			rate: 0.35, // 35%
		},
	],
	personalDeduction: {
		type: "formula",
		basis: "annual",
		formula: "MAX(1560000, {annualGross} * 0.333)",
	},
	roundingMode: "nearest",
	periodization: "annualized", // Calculate annual, divide by periods
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
	name: "National Insurance Scheme",
	code: "NIS",
	year: 2024,
	effectiveFrom: new Date("2024-01-01"),
	effectiveTo: new Date("2024-12-31"),
	employeeRate: "0.0560", // 5.6%
	employerRate: "0.0840", // 8.4%
	earningsCeiling: 280_000, // Monthly ceiling G$280K
	includedEarnings: ["basic", "overtime", "allowances"],
	roundingMode: "nearest",
	notes:
		"National Insurance Scheme (NIS) contributions with monthly ceiling of G$280,000",
};

/**
 * Guyana Tax Filing Requirements
 *
 * Annual tax return requirements for employers and employees
 */
export const guyanaFilingRequirements: NewFilingRequirement[] = [
	{
		code: "IT01",
		name: "IT 01 - Annual Income Tax Return",
		filingType: "income_tax_annual",
		frequency: "annual",
		dueDayOfMonth: 30, // April 30th (month determined by fiscal year)
		requiredFields: [
			{
				fieldName: "employeeName",
				source: "employee.fullName",
				label: "Employee Name",
				format: "string",
			},
			{
				fieldName: "taxId",
				source: "employee.taxId",
				label: "Tax Identification Number",
				format: "string",
			},
			{
				fieldName: "nisNumber",
				source: "employee.nisNumber",
				label: "NIS Number",
				format: "string",
			},
			{
				fieldName: "grossSalary",
				source: "payslip.grossEarnings",
				label: "Gross Salary",
				format: "currency",
			},
			{
				fieldName: "incomeTax",
				source: "payslip.incomeTax",
				label: "Income Tax Withheld",
				format: "currency",
			},
			{
				fieldName: "nisContributions",
				source: "payslip.nisEmployee",
				label: "NIS Contributions",
				format: "currency",
			},
		],
		description:
			"Annual income tax return for employees, due April 30th following the tax year",
	},
	{
		code: "NIS_FORM_2",
		name: "NIS Form 2 - Monthly Employer Return",
		filingType: "social_security",
		frequency: "monthly",
		dueDaysAfterPeriod: 15, // 15th of following month
		requiredFields: [
			{
				fieldName: "employerName",
				source: "organization.name",
				label: "Employer Name",
				format: "string",
			},
			{
				fieldName: "nisEmployerNumber",
				source: "organization.nisNumber",
				label: "NIS Employer Number",
				format: "string",
			},
			{
				fieldName: "employeeName",
				source: "employee.fullName",
				label: "Employee Name",
				format: "string",
			},
			{
				fieldName: "nisNumber",
				source: "employee.nisNumber",
				label: "NIS Number",
				format: "string",
			},
			{
				fieldName: "grossEarnings",
				source: "payslip.grossEarnings",
				label: "Gross Earnings",
				format: "currency",
			},
			{
				fieldName: "employeeContribution",
				source: "payslip.nisEmployee",
				label: "Employee Contribution",
				format: "currency",
			},
			{
				fieldName: "employerContribution",
				source: "payslip.nisEmployer",
				label: "Employer Contribution",
				format: "currency",
			},
		],
		description:
			"Monthly NIS employer return showing all employee contributions, due by the 15th of the following month",
	},
	{
		code: "PAYE_MONTHLY",
		name: "PAYE Return - Monthly Tax Remittance",
		filingType: "income_tax_monthly",
		frequency: "monthly",
		dueDaysAfterPeriod: 15, // 15th of following month
		requiredFields: [
			{
				fieldName: "employerName",
				source: "organization.name",
				label: "Employer Name",
				format: "string",
			},
			{
				fieldName: "employerTin",
				source: "organization.taxId",
				label: "Employer TIN",
				format: "string",
			},
			{
				fieldName: "employeeName",
				source: "employee.fullName",
				label: "Employee Name",
				format: "string",
			},
			{
				fieldName: "employeeTin",
				source: "employee.taxId",
				label: "Employee TIN",
				format: "string",
			},
			{
				fieldName: "grossIncome",
				source: "payslip.grossEarnings",
				label: "Gross Income",
				format: "currency",
			},
			{
				fieldName: "taxWithheld",
				source: "payslip.incomeTax",
				label: "Tax Withheld",
				format: "currency",
			},
		],
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
	// 0. Clean up existing Guyana data (foreign keys will cascade)
	try {
		await db.delete(taxJurisdictions).where(eq(taxJurisdictions.code, "GY"));
		console.log("   - Removed existing Guyana jurisdiction");
	} catch (error) {
		// No existing data or table doesn't exist yet
	}

	// 1. Create jurisdiction
	const [jurisdiction] = await db
		.insert(taxJurisdictions)
		.values(guyanaJurisdiction)
		.returning();

	const jurisdictionId = jurisdiction.id;

	// 2. Create income tax rule
	await db.insert(incomeTaxRules).values({
		...guyanaIncomeTaxRule,
		jurisdictionId,
	});

	// 3. Create social security rule
	await db.insert(socialSecurityRules).values({
		...guyanaSocialSecurityRule,
		jurisdictionId,
	});

	// 4. Create filing requirements
	for (const requirement of guyanaFilingRequirements) {
		await db.insert(filingRequirements).values({
			...requirement,
			jurisdictionId,
		});
	}

	console.log("✅ Guyana tax data seeded successfully");
	console.log(`   - Jurisdiction: ${jurisdiction.name} (${jurisdiction.code})`);
	console.log(`   - Tax Year: ${guyanaIncomeTaxRule.taxYear}`);
	console.log(
		`   - Tax Bands: ${guyanaIncomeTaxRule.taxBands.length} progressive bands`
	);
	console.log(
		`   - NIS Rates: ${Number(guyanaSocialSecurityRule.employeeRate) * 100}% employee, ${Number(guyanaSocialSecurityRule.employerRate) * 100}% employer`
	);
	console.log(
		`   - Filing Requirements: ${guyanaFilingRequirements.length} forms`
	);
}
