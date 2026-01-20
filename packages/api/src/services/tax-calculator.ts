import type {
	IncomeTaxRule,
	SocialSecurityRule,
} from "@PeopleFlow-HR-Suite/db";

// ============================================================================
// TAX CALCULATION SERVICE
// ============================================================================

/**
 * Comprehensive tax calculation service for PAYE (income tax) and NIS (social security).
 * Supports multi-jurisdiction tax rules with configurable formulas.
 */

// ============================================================================
// FORMULA EVALUATOR
// ============================================================================

/**
 * Safe formula evaluator supporting basic math operations and functions.
 * Variables: {gross}, {annualGross}, {dependents}, {age}, etc.
 * Functions: MAX, MIN, IF, ROUND
 */
export function evaluateFormula(
	formula: string,
	variables: Record<string, number>
): number {
	// Replace variables with values
	let expression = formula;

	for (const [key, value] of Object.entries(variables)) {
		const regex = new RegExp(`\\{${key}\\}`, "g");
		expression = expression.replace(regex, value.toString());
	}

	// Handle MAX function: MAX(a, b, ...)
	expression = expression.replace(
		/MAX\(([^)]+)\)/gi,
		(_match, args: string) => {
			const values = args.split(",").map((v) => Number.parseFloat(v.trim()));
			return Math.max(...values).toString();
		}
	);

	// Handle MIN function: MIN(a, b, ...)
	expression = expression.replace(
		/MIN\(([^)]+)\)/gi,
		(_match, args: string) => {
			const values = args.split(",").map((v) => Number.parseFloat(v.trim()));
			return Math.min(...values).toString();
		}
	);

	// Handle ROUND function: ROUND(value)
	expression = expression.replace(/ROUND\(([^)]+)\)/gi, (_match, value) => {
		return Math.round(Number.parseFloat(value)).toString();
	});

	// Handle IF function: IF(condition, trueValue, falseValue)
	// Note: Simple comparison operators only
	expression = expression.replace(/IF\(([^)]+)\)/gi, (_match, args: string) => {
		const parts = args.split(",").map((s) => s.trim());
		if (parts.length !== 3) {
			return "0";
		}

		const condition = parts[0];
		const trueVal = parts[1];
		const falseVal = parts[2];

		if (!(condition && trueVal && falseVal)) {
			return "0";
		}

		// Parse condition (e.g., "value > 100")
		const comparisonMatch = condition.match(/(.+?)(>=|<=|>|<|==|!=)(.+)/);
		if (!comparisonMatch) {
			return falseVal;
		}

		const leftStr = comparisonMatch[1];
		const operator = comparisonMatch[2];
		const rightStr = comparisonMatch[3];

		if (!(leftStr && operator && rightStr)) {
			return falseVal;
		}

		const left = Number.parseFloat(leftStr.trim());
		const right = Number.parseFloat(rightStr.trim());

		let conditionResult = false;
		switch (operator) {
			case ">":
				conditionResult = left > right;
				break;
			case "<":
				conditionResult = left < right;
				break;
			case ">=":
				conditionResult = left >= right;
				break;
			case "<=":
				conditionResult = left <= right;
				break;
			case "==":
				conditionResult = left === right;
				break;
			case "!=":
				conditionResult = left !== right;
				break;
		}

		return conditionResult ? trueVal : falseVal;
	});

	// Evaluate the final mathematical expression
	try {
		// biome-ignore lint/security/noGlobalEval: Safe formula evaluation with sanitized input
		const result = eval(expression);
		return Number.parseFloat(result);
	} catch {
		return 0;
	}
}

// ============================================================================
// ROUNDING UTILITIES
// ============================================================================

export function roundAmount(
	amount: number,
	mode: "nearest" | "floor" | "ceil" | "banker" = "nearest",
	precision = 1
): number {
	const factor = 1 / precision;

	switch (mode) {
		case "floor":
			return Math.floor(amount * factor) / factor;
		case "ceil":
			return Math.ceil(amount * factor) / factor;
		case "banker": {
			// Banker's rounding (round half to even)
			const rounded = Math.round(amount * factor);
			const remainder = amount * factor - Math.floor(amount * factor);
			if (remainder === 0.5) {
				return rounded % 2 === 0 ? rounded / factor : (rounded - 1) / factor;
			}
			return rounded / factor;
		}
		default:
			return Math.round(amount * factor) / factor;
	}
}

// ============================================================================
// PAYE (INCOME TAX) CALCULATION
// ============================================================================

export interface PayeCalculationInput {
	annualGrossSalary: number; // In cents
	taxRule: IncomeTaxRule;
	dependents?: number;
	customDeduction?: number; // In cents
}

export interface PayeCalculationResult {
	// Income breakdown
	annualGross: number;
	personalDeduction: number;
	taxableIncome: number;

	// Tax calculation
	taxBands: {
		bandName: string;
		amount: number; // Amount in this band
		rate: number;
		tax: number;
	}[];

	// Totals
	annualTax: number;
	monthlyTax: number;

	// Metadata
	effectiveTaxRate: number; // Percentage
	marginalTaxRate: number; // Percentage
	jurisdictionId: string;
	taxYear: number;
}

export function calculatePAYE(
	input: PayeCalculationInput
): PayeCalculationResult {
	const {
		annualGrossSalary,
		taxRule,
		dependents = 0,
		customDeduction = 0,
	} = input;

	// Calculate personal deduction
	let personalDeduction = 0;

	if (taxRule.personalDeduction) {
		const { type, basis } = taxRule.personalDeduction;

		switch (type) {
			case "fixed":
				personalDeduction = taxRule.personalDeduction.fixedAmount ?? 0;
				break;

			case "percentage":
				personalDeduction =
					annualGrossSalary * (taxRule.personalDeduction.percentage ?? 0);
				break;

			case "formula":
				if (taxRule.personalDeduction.formula) {
					const variables = {
						gross: annualGrossSalary / 12, // Monthly
						annualGross: annualGrossSalary,
						dependents,
					};
					personalDeduction = evaluateFormula(
						taxRule.personalDeduction.formula,
						variables
					);
				}
				break;
		}

		// Apply min/max caps
		if (
			taxRule.personalDeduction.minAmount &&
			personalDeduction < taxRule.personalDeduction.minAmount
		) {
			personalDeduction = taxRule.personalDeduction.minAmount;
		}
		if (
			taxRule.personalDeduction.maxAmount &&
			personalDeduction > taxRule.personalDeduction.maxAmount
		) {
			personalDeduction = taxRule.personalDeduction.maxAmount;
		}

		// Convert to annual if basis is monthly
		if (basis === "monthly") {
			personalDeduction *= 12;
		}
	}

	// Add custom deduction
	personalDeduction += customDeduction;

	// Calculate taxable income
	const taxableIncome = Math.max(0, annualGrossSalary - personalDeduction);

	// Calculate tax using progressive bands
	const taxBands: PayeCalculationResult["taxBands"] = [];
	let remainingIncome = taxableIncome;
	let totalTax = 0;

	for (const band of taxRule.taxBands) {
		if (remainingIncome <= 0) {
			break;
		}

		const bandMin = band.minAmount;
		const bandMax = band.maxAmount ?? Number.POSITIVE_INFINITY;
		const bandWidth = bandMax - bandMin;

		// How much income falls in this band?
		const amountInBand = Math.min(remainingIncome, bandWidth);

		// Calculate tax for this band
		const bandTax = amountInBand * band.rate;

		taxBands.push({
			bandName: band.name,
			amount: amountInBand,
			rate: band.rate,
			tax: bandTax,
		});

		totalTax += bandTax;
		remainingIncome -= amountInBand;
	}

	// Round annual tax
	const roundingMode =
		(taxRule.roundingMode as "nearest" | "floor" | "ceil" | "banker") ??
		"nearest";
	const roundingPrecision = taxRule.roundingPrecision ?? 1;

	const annualTax = roundAmount(totalTax, roundingMode, roundingPrecision);
	const monthlyTax = roundAmount(
		annualTax / 12,
		roundingMode,
		roundingPrecision
	);

	// Calculate effective and marginal tax rates
	const effectiveTaxRate =
		annualGrossSalary > 0 ? (annualTax / annualGrossSalary) * 100 : 0;

	// Marginal rate is the rate of the highest band reached
	const lastBand = taxBands.at(-1);
	const marginalTaxRate = lastBand ? lastBand.rate * 100 : 0;

	return {
		annualGross: annualGrossSalary,
		personalDeduction,
		taxableIncome,
		taxBands,
		annualTax,
		monthlyTax,
		effectiveTaxRate,
		marginalTaxRate,
		jurisdictionId: taxRule.jurisdictionId,
		taxYear: taxRule.taxYear,
	};
}

// ============================================================================
// NIS (SOCIAL SECURITY) CALCULATION
// ============================================================================

export interface NisCalculationInput {
	grossEarnings: number; // In cents (monthly or per-period)
	nisRule: SocialSecurityRule;
	isEmployer?: boolean; // Calculate employer contribution?
}

export interface NisCalculationResult {
	// Earnings
	grossEarnings: number;
	nisableEarnings: number; // After applying ceiling

	// Contributions
	employeeContribution: number;
	employerContribution: number;
	totalContribution: number;

	// Rates
	employeeRate: number;
	employerRate: number;

	// Ceiling applied?
	ceilingApplied: boolean;
	earningsCeiling: number | null;

	// Metadata
	jurisdictionId: string;
	year: number;
}

export function calculateNIS(input: NisCalculationInput): NisCalculationResult {
	const { grossEarnings, nisRule } = input;

	// Determine NIS-able earnings (apply ceiling if exists)
	let nisableEarnings = grossEarnings;
	let ceilingApplied = false;

	if (nisRule.earningsCeiling && grossEarnings > nisRule.earningsCeiling) {
		nisableEarnings = nisRule.earningsCeiling;
		ceilingApplied = true;
	}

	// Apply floor if exists
	if (nisRule.earningsFloor && nisableEarnings < nisRule.earningsFloor) {
		nisableEarnings = 0; // Below minimum, no contributions
	}

	// Calculate contributions
	const employeeRate = Number.parseFloat(nisRule.employeeRate.toString());
	const employerRate = Number.parseFloat(nisRule.employerRate.toString());

	const employeeContribution = nisableEarnings * employeeRate;
	const employerContribution = nisableEarnings * employerRate;
	const totalContribution = employeeContribution + employerContribution;

	// Round amounts
	const roundingMode =
		(nisRule.roundingMode as "nearest" | "floor" | "ceil" | "banker") ??
		"nearest";
	const roundingPrecision = nisRule.roundingPrecision ?? 1;

	return {
		grossEarnings,
		nisableEarnings,
		employeeContribution: roundAmount(
			employeeContribution,
			roundingMode,
			roundingPrecision
		),
		employerContribution: roundAmount(
			employerContribution,
			roundingMode,
			roundingPrecision
		),
		totalContribution: roundAmount(
			totalContribution,
			roundingMode,
			roundingPrecision
		),
		employeeRate,
		employerRate,
		ceilingApplied,
		earningsCeiling: nisRule.earningsCeiling,
		jurisdictionId: nisRule.jurisdictionId,
		year: nisRule.year,
	};
}

// ============================================================================
// PERIODIZATION - Convert between annual and monthly
// ============================================================================

export function annualizeMonthlyAmount(monthlyAmount: number): number {
	return monthlyAmount * 12;
}

export function monthlyFromAnnualAmount(annualAmount: number): number {
	return annualAmount / 12;
}

/**
 * Calculate YTD (Year-to-Date) tax based on cumulative method.
 * This is more accurate for varying salaries throughout the year.
 */
export function calculateYtdPaye(
	ytdGrossEarnings: number,
	taxRule: IncomeTaxRule,
	dependents = 0
): number {
	const result = calculatePAYE({
		annualGrossSalary: ytdGrossEarnings,
		taxRule,
		dependents,
	});

	// For YTD, we don't divide by 12 - return cumulative tax
	return result.annualTax;
}
