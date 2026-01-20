import { z } from "zod";
import { authedProcedure } from "..";
import {
	getEmployeeSummary,
	getPayrollSummary,
	getRecentPayrollRuns,
	getYTDTaxReport,
} from "../services/reports-service";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const payrollSummarySchema = z.object({
	organizationId: z.string().uuid(),
	startDate: z.string().date(),
	endDate: z.string().date(),
});

const employeeSummarySchema = z.object({
	organizationId: z.string().uuid(),
});

const ytdTaxReportSchema = z.object({
	organizationId: z.string().uuid(),
	year: z.number().int().min(2000).max(2100),
});

const recentPayrollRunsSchema = z.object({
	organizationId: z.string().uuid(),
	limit: z.number().int().positive().max(50).default(10),
});

// ============================================================================
// REPORT PROCEDURES
// ============================================================================

/**
 * Get payroll summary for a date range
 */
export const payrollSummary = authedProcedure
	.input(payrollSummarySchema)
	.handler(({ input }) => {
		return getPayrollSummary(
			input.organizationId,
			input.startDate,
			input.endDate
		);
	});

/**
 * Get employee summary statistics
 */
export const employeeSummary = authedProcedure
	.input(employeeSummarySchema)
	.handler(({ input }) => {
		return getEmployeeSummary(input.organizationId);
	});

/**
 * Get YTD tax report for all employees
 */
export const ytdTaxReport = authedProcedure
	.input(ytdTaxReportSchema)
	.handler(({ input }) => {
		return getYTDTaxReport(input.organizationId, input.year);
	});

/**
 * Get recent payroll runs
 */
export const recentPayrollRuns = authedProcedure
	.input(recentPayrollRunsSchema)
	.handler(({ input }) => {
		return getRecentPayrollRuns(input.organizationId, input.limit);
	});

// ============================================================================
// ROUTER
// ============================================================================

export const reportsRouter = {
	payrollSummary,
	employeeSummary,
	ytdTaxReport,
	recentPayrollRuns,
};
