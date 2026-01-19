import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { departmentsRouter } from "./departments";
import { employeesRouter } from "./employees";
import { organizationsRouter } from "./organizations";

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

	// Core HR routes
	organizations: organizationsRouter,
	departments: departmentsRouter,
	employees: employeesRouter,

	// Future routes will be added here:
	// positions: positionsRouter,
	// taxJurisdictions: taxJurisdictionsRouter,
	// payroll: payrollRouter,
	// reports: reportsRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
