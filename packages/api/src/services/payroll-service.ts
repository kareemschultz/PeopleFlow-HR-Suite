import type {
	Employee,
	IncomeTaxRule,
	NewPayrollRun,
	NewPayslip,
	PayrollRun,
	Payslip,
	SocialSecurityRule,
} from "@PeopleFlow-HR-Suite/db";
import { calculateNIS, calculatePAYE } from "./tax-calculator";

// ============================================================================
// PAYROLL SERVICE
// ============================================================================

/**
 * Payroll processing service for creating payroll runs and calculating payslips.
 */

// ============================================================================
// PAYSLIP CALCULATION
// ============================================================================

export interface CalculatePayslipInput {
	employee: Employee;
	payrollRun: PayrollRun;
	incomeTaxRule: IncomeTaxRule;
	nisRule: SocialSecurityRule;
	ytdGrossEarnings?: number;
	ytdPaye?: number;
	ytdNis?: number;
}

export interface CalculatePayslipResult {
	payslip: NewPayslip;
	warnings: string[];
}

/**
 * Calculate a complete payslip for an employee.
 * Includes base pay, allowances, deductions, PAYE, and NIS.
 */
export function calculatePayslip(
	input: CalculatePayslipInput
): CalculatePayslipResult {
	const {
		employee,
		payrollRun,
		incomeTaxRule,
		nisRule,
		ytdGrossEarnings = 0,
		ytdPaye = 0,
		ytdNis = 0,
	} = input;

	const warnings: string[] = [];

	// ============================================================================
	// EARNINGS CALCULATION
	// ============================================================================

	// Base pay (convert annual salary to monthly/period)
	let basePay = employee.baseSalary;

	// Adjust based on salary frequency
	if (employee.salaryFrequency === "annual") {
		basePay = Math.round(employee.baseSalary / 12);
	} else if (employee.salaryFrequency === "biweekly") {
		basePay = Math.round(employee.baseSalary * 2); // Assuming monthly run
	}

	// Allowances
	const earningsBreakdown: {
		code: string;
		name: string;
		amount: number;
		isTaxable: boolean;
		isNisable: boolean;
	}[] = [
		{
			code: "BASE",
			name: "Base Salary",
			amount: basePay,
			isTaxable: true,
			isNisable: true,
		},
	];

	let totalAllowances = 0;
	let _taxableAllowances = 0;
	let nisableAllowances = 0;

	if (employee.allowances) {
		for (const allowance of employee.allowances) {
			let allowanceAmount = allowance.amount;

			// Adjust frequency
			if (allowance.frequency === "annual") {
				allowanceAmount = Math.round(allowance.amount / 12);
			}

			totalAllowances += allowanceAmount;

			if (allowance.isTaxable) {
				_taxableAllowances += allowanceAmount;
			}

			// Allowances are typically NIS-able
			nisableAllowances += allowanceAmount;

			earningsBreakdown.push({
				code: allowance.code,
				name: allowance.name,
				amount: allowanceAmount,
				isTaxable: allowance.isTaxable,
				isNisable: true,
			});
		}
	}

	// Gross earnings
	const grossEarnings = basePay + totalAllowances;

	// ============================================================================
	// STATUTORY DEDUCTIONS (PAYE)
	// ============================================================================

	// Annualize salary for PAYE calculation
	const annualGross = grossEarnings * 12;

	// Calculate PAYE
	const payeResult = calculatePAYE({
		annualGrossSalary: annualGross,
		taxRule: incomeTaxRule,
		dependents: employee.taxSettings?.numberOfDependents ?? 0,
	});

	const payeAmount = payeResult.monthlyTax;
	const taxableIncome = Math.round(payeResult.taxableIncome / 12);

	// ============================================================================
	// STATUTORY DEDUCTIONS (NIS)
	// ============================================================================

	// Calculate NIS-able earnings
	const nisableEarnings = basePay + nisableAllowances;

	// Calculate NIS contributions
	const nisResult = calculateNIS({
		grossEarnings: nisableEarnings,
		nisRule,
	});

	const nisEmployee = nisResult.employeeContribution;
	const nisEmployer = nisResult.employerContribution;

	// ============================================================================
	// OTHER DEDUCTIONS
	// ============================================================================

	const deductionsBreakdown: {
		code: string;
		name: string;
		amount: number;
	}[] = [];

	let otherDeductionsTotal = 0;

	if (employee.deductions) {
		for (const deduction of employee.deductions) {
			let deductionAmount = deduction.amount;

			// Adjust frequency
			if (deduction.frequency === "annual") {
				deductionAmount = Math.round(deduction.amount / 12);
			}

			otherDeductionsTotal += deductionAmount;

			deductionsBreakdown.push({
				code: deduction.code,
				name: deduction.name,
				amount: deductionAmount,
			});
		}
	}

	// ============================================================================
	// TOTALS
	// ============================================================================

	const totalDeductions = payeAmount + nisEmployee + otherDeductionsTotal;
	const netPay = grossEarnings - totalDeductions;

	// YTD calculations
	const newYtdGrossEarnings = ytdGrossEarnings + grossEarnings;
	const newYtdPaye = ytdPaye + payeAmount;
	const newYtdNis = ytdNis + nisEmployee;
	const newYtdNetPay = newYtdGrossEarnings - newYtdPaye - newYtdNis;

	// ============================================================================
	// WARNINGS
	// ============================================================================

	if (netPay < 0) {
		warnings.push(
			`Negative net pay (${netPay / 100}) - deductions exceed gross earnings`
		);
	}

	if (!employee.taxId) {
		warnings.push("Employee missing Tax ID (TIN)");
	}

	if (!employee.nisNumber) {
		warnings.push("Employee missing NIS Number");
	}

	// ============================================================================
	// BUILD PAYSLIP
	// ============================================================================

	const payslip: NewPayslip = {
		payrollRunId: payrollRun.id,
		employeeId: employee.id,
		organizationId: employee.organizationId,

		// Period
		periodStart: payrollRun.periodStart,
		periodEnd: payrollRun.periodEnd,
		payDate: payrollRun.payDate,

		// Earnings
		basePay,
		overtimePay: 0,
		allowances: totalAllowances,
		bonuses: 0,
		commissions: 0,
		otherEarnings: 0,
		grossEarnings,

		earningsBreakdown,

		// Statutory
		taxableIncome,
		payeAmount: Math.round(payeAmount),
		nisableEarnings,
		nisEmployee: Math.round(nisEmployee),
		nisEmployer: Math.round(nisEmployer),

		taxDetails: {
			jurisdictionId: incomeTaxRule.jurisdictionId,
			taxYear: incomeTaxRule.taxYear,
			annualGross,
			personalDeduction: payeResult.personalDeduction,
			taxableBands: payeResult.taxBands,
			annualTax: payeResult.annualTax,
			monthlyTax: payeResult.monthlyTax,
		},

		// Other deductions
		unionDues: 0,
		loanRepayments: 0,
		advanceDeductions: 0,
		otherDeductions: otherDeductionsTotal,

		deductionsBreakdown,

		// Totals
		totalDeductions: Math.round(totalDeductions),
		netPay: Math.round(netPay),

		// YTD
		ytdGrossEarnings: newYtdGrossEarnings,
		ytdNetPay: newYtdNetPay,
		ytdPaye: newYtdPaye,
		ytdNis: newYtdNis,

		// Payment
		paymentMethod: "bank_transfer",
		paymentStatus: "pending",

		// Retro
		hasRetroAdjustments: 0,
		retroAdjustmentAmount: 0,
	};

	return {
		payslip,
		warnings,
	};
}

// ============================================================================
// PAYROLL RUN MANAGEMENT
// ============================================================================

export interface CreatePayrollRunInput {
	organizationId: string;
	periodStart: string; // ISO date
	periodEnd: string; // ISO date
	payDate: string; // ISO date
	runType?: string;
	createdBy?: string;
}

export function createPayrollRunData(
	input: CreatePayrollRunInput
): NewPayrollRun {
	return {
		organizationId: input.organizationId,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		payDate: input.payDate,
		status: "draft",
		runType: input.runType ?? "regular",
		totalGrossEarnings: 0,
		totalNetPay: 0,
		totalPaye: 0,
		totalNisEmployee: 0,
		totalNisEmployer: 0,
		totalDeductions: 0,
		employeeCount: 0,
		createdBy: input.createdBy,
	};
}

// ============================================================================
// PAYROLL TOTALS
// ============================================================================

export interface PayrollTotals {
	totalGrossEarnings: number;
	totalNetPay: number;
	totalPaye: number;
	totalNisEmployee: number;
	totalNisEmployer: number;
	totalDeductions: number;
	employeeCount: number;
}

export function calculatePayrollTotals(payslips: Payslip[]): PayrollTotals {
	return payslips.reduce(
		(totals, payslip) => ({
			totalGrossEarnings: totals.totalGrossEarnings + payslip.grossEarnings,
			totalNetPay: totals.totalNetPay + payslip.netPay,
			totalPaye: totals.totalPaye + payslip.payeAmount,
			totalNisEmployee: totals.totalNisEmployee + payslip.nisEmployee,
			totalNisEmployer: totals.totalNisEmployer + payslip.nisEmployer,
			totalDeductions: totals.totalDeductions + payslip.totalDeductions,
			employeeCount: totals.employeeCount + 1,
		}),
		{
			totalGrossEarnings: 0,
			totalNetPay: 0,
			totalPaye: 0,
			totalNisEmployee: 0,
			totalNisEmployer: 0,
			totalDeductions: 0,
			employeeCount: 0,
		}
	);
}
