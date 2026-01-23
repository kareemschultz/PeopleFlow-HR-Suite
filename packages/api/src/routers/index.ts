import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { departmentsRouter } from "./departments";
import { employeesRouter } from "./employees";
import { licensingRouter } from "./licensing";
import { metricsRouter } from "./metrics";
import { organizationsRouter } from "./organizations";
import { payrollRouter } from "./payroll";
import { reportsRouter } from "./reports";
import { retroAdjustmentsRouter } from "./retro-adjustments";
import { taxJurisdictionsRouter } from "./tax-jurisdictions";

// ============================================================================
// APP ROUTER - Main API Router
// ============================================================================

export const appRouter = {
	// Health check
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	// Test authenticated endpoint
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),

	// TEMPORARY: Test endpoint to verify database connectivity (REMOVE BEFORE PRODUCTION)
	testDbConnection: publicProcedure.handler(async () => {
		const { db, organizations } = await import("@PeopleFlow-HR-Suite/db");
		const orgs = await db.select().from(organizations).limit(5);
		return {
			connected: true,
			organizationCount: orgs.length,
			organizations: orgs,
		};
	}),

	// Core HR routes
	organizations: organizationsRouter,
	departments: departmentsRouter,
	employees: employeesRouter,

	// Payroll & Tax
	payroll: payrollRouter,
	taxJurisdictions: taxJurisdictionsRouter,

	// Retroactive Adjustments & Metrics
	retroAdjustments: retroAdjustmentsRouter,
	metrics: metricsRouter,

	// Reports & Compliance
	reports: reportsRouter,

	// Licensing & Subscriptions
	licensing: licensingRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
