import { db, employees, payrollRuns, payslips } from "@PeopleFlow-HR-Suite/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

/**
 * Report type definitions
 */
export interface PayrollSummaryReport {
	period: string;
	totalGrossEarnings: number;
	totalNetPay: number;
	totalPaye: number;
	totalNisEmployee: number;
	totalNisEmployer: number;
	totalDeductions: number;
	employeeCount: number;
	payrollRunCount: number;
}

export interface EmployeeSummaryReport {
	totalEmployees: number;
	activeEmployees: number;
	onLeaveEmployees: number;
	terminatedEmployees: number;
	byDepartment: Array<{
		departmentId: string;
		departmentName: string;
		count: number;
	}>;
	byEmploymentType: Array<{
		type: string;
		count: number;
	}>;
}

export interface YTDTaxReport {
	employeeId: string;
	employeeName: string;
	employeeNumber: string;
	totalGross: number;
	totalPaye: number;
	totalNis: number;
	totalNet: number;
	payslipCount: number;
}

/**
 * Get payroll summary for a date range
 */
export async function getPayrollSummary(
	organizationId: string,
	startDate: string,
	endDate: string
): Promise<PayrollSummaryReport> {
	const runs = await db.query.payrollRuns.findMany({
		where: and(
			eq(payrollRuns.organizationId, organizationId),
			gte(payrollRuns.periodStart, startDate),
			lte(payrollRuns.periodEnd, endDate)
		),
	});

	const totals = runs.reduce(
		(acc, run) => ({
			totalGrossEarnings:
				acc.totalGrossEarnings + (run.totalGrossEarnings ?? 0),
			totalNetPay: acc.totalNetPay + (run.totalNetPay ?? 0),
			totalPaye: acc.totalPaye + (run.totalPaye ?? 0),
			totalNisEmployee: acc.totalNisEmployee + (run.totalNisEmployee ?? 0),
			totalNisEmployer: acc.totalNisEmployer + (run.totalNisEmployer ?? 0),
			totalDeductions: acc.totalDeductions + (run.totalDeductions ?? 0),
			employeeCount: acc.employeeCount + (run.employeeCount ?? 0),
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

	return {
		period: `${startDate} to ${endDate}`,
		...totals,
		payrollRunCount: runs.length,
	};
}

/**
 * Get employee summary statistics
 */
export async function getEmployeeSummary(
	organizationId: string
): Promise<EmployeeSummaryReport> {
	const allEmployees = await db.query.employees.findMany({
		where: eq(employees.organizationId, organizationId),
		with: {
			department: true,
		},
	});

	const statusCounts = allEmployees.reduce(
		(acc, emp) => {
			if (emp.employmentStatus === "active") {
				acc.active++;
			} else if (emp.employmentStatus === "on_leave") {
				acc.onLeave++;
			} else if (emp.employmentStatus === "terminated") {
				acc.terminated++;
			}
			return acc;
		},
		{ active: 0, onLeave: 0, terminated: 0 }
	);

	// Group by department
	const deptMap = new Map<string, { name: string; count: number }>();
	for (const emp of allEmployees) {
		if (emp.departmentId) {
			const current = deptMap.get(emp.departmentId) ?? {
				name: emp.department?.name ?? "Unknown",
				count: 0,
			};
			current.count++;
			deptMap.set(emp.departmentId, current);
		}
	}

	// Group by employment type
	const typeMap = new Map<string, number>();
	for (const emp of allEmployees) {
		const count = typeMap.get(emp.employmentType) ?? 0;
		typeMap.set(emp.employmentType, count + 1);
	}

	return {
		totalEmployees: allEmployees.length,
		activeEmployees: statusCounts.active,
		onLeaveEmployees: statusCounts.onLeave,
		terminatedEmployees: statusCounts.terminated,
		byDepartment: Array.from(deptMap.entries()).map(([id, data]) => ({
			departmentId: id,
			departmentName: data.name,
			count: data.count,
		})),
		byEmploymentType: Array.from(typeMap.entries()).map(([type, count]) => ({
			type,
			count,
		})),
	};
}

/**
 * Get YTD tax report for all employees
 */
export async function getYTDTaxReport(
	organizationId: string,
	year: number
): Promise<YTDTaxReport[]> {
	const startDate = `${year}-01-01`;
	const endDate = `${year}-12-31`;

	// Get all payslips for the year
	const slips = await db.query.payslips.findMany({
		where: and(
			gte(payslips.periodStart, startDate),
			lte(payslips.periodEnd, endDate)
		),
		with: {
			employee: true,
		},
	});

	// Filter by organization and aggregate
	const employeeMap = new Map<
		string,
		{
			employeeName: string;
			employeeNumber: string;
			totalGross: number;
			totalPaye: number;
			totalNis: number;
			totalNet: number;
			payslipCount: number;
		}
	>();

	for (const slip of slips) {
		if (slip.employee?.organizationId !== organizationId) {
			continue;
		}

		const current = employeeMap.get(slip.employeeId) ?? {
			employeeName:
				`${slip.employee?.firstName ?? ""} ${slip.employee?.lastName ?? ""}`.trim(),
			employeeNumber: slip.employee?.employeeNumber ?? "",
			totalGross: 0,
			totalPaye: 0,
			totalNis: 0,
			totalNet: 0,
			payslipCount: 0,
		};

		current.totalGross += slip.grossEarnings ?? 0;
		current.totalPaye += slip.payeAmount ?? 0;
		current.totalNis += slip.nisEmployee ?? 0;
		current.totalNet += slip.netPay ?? 0;
		current.payslipCount++;

		employeeMap.set(slip.employeeId, current);
	}

	return Array.from(employeeMap.entries()).map(([employeeId, data]) => ({
		employeeId,
		...data,
	}));
}

/**
 * Get recent payroll runs
 */
export function getRecentPayrollRuns(organizationId: string, limit = 10) {
	return db.query.payrollRuns.findMany({
		where: eq(payrollRuns.organizationId, organizationId),
		orderBy: [desc(payrollRuns.createdAt)],
		limit,
	});
}
