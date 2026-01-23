import {
	dataFreshness,
	db,
	metricDependencies,
	metricValues,
	type NewDataFreshness,
	type NewMetricDependency,
	type NewMetricValue,
} from "@PeopleFlow-HR-Suite/db";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure, publicProcedure } from "..";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createMetricDependencySchema = z.object({
	metricKey: z.string().min(1),
	dependsOnType: z.enum(["metric", "table", "calculation", "external_api"]),
	dependsOnKey: z.string().min(1),
	relationship: z
		.enum(["input", "filter", "aggregation", "transformer"])
		.default("input"),
	description: z.string().optional(),
	importance: z.number().min(1).max(10).default(5),
});

const listMetricDependenciesSchema = z
	.object({
		metricKey: z.string().min(1).optional(),
		dependsOnKey: z.string().min(1).optional(),
	})
	.optional();

const updateDataFreshnessSchema = z.object({
	organizationId: z.string().uuid(),
	dataType: z.string().min(1),
	entityName: z.string().optional(),
	periodStart: z.string().date().optional(),
	periodEnd: z.string().date().optional(),
	status: z
		.enum(["current", "stale", "calculating", "locked", "error"])
		.default("current"),
	isLocked: z.boolean().optional(),
	autoRefresh: z.boolean().optional(),
	stalenessThreshold: z.number().positive().optional(),
	updateMetadata: z
		.object({
			recordsUpdated: z.number().optional(),
			updateDuration: z.number().optional(),
			source: z.string().optional(),
			errors: z.array(z.string()).optional(),
		})
		.optional(),
});

const getDataFreshnessSchema = z.object({
	organizationId: z.string().uuid(),
	dataType: z.string().min(1).optional(),
	entityName: z.string().optional(),
});

const createMetricValueSchema = z.object({
	organizationId: z.string().uuid(),
	metricKey: z.string().min(1),
	metricName: z.string().min(1),
	category: z
		.enum(["payroll", "hr", "compliance", "finance", "operations"])
		.optional(),
	periodStart: z.string().date(),
	periodEnd: z.string().date(),
	value: z.number(),
	valueType: z
		.enum(["number", "currency", "percentage", "count", "ratio"])
		.default("number"),
	unit: z.string().optional(),
	previousValue: z.number().optional(),
	dimensions: z.record(z.string(), z.unknown()).optional(),
	calculationDetails: z
		.object({
			formula: z.string().optional(),
			dataPoints: z.number().optional(),
			dataSources: z.array(z.string()).optional(),
			calculatedAt: z.string().optional(),
			calculationDuration: z.number().optional(),
		})
		.optional(),
	confidence: z.number().min(0).max(1).default(1.0),
	isEstimated: z.boolean().default(false),
	status: z
		.enum(["current", "historical", "provisional", "deprecated"])
		.default("current"),
});

const listMetricValuesSchema = z
	.object({
		organizationId: z.string().uuid(),
		metricKey: z.string().min(1).optional(),
		category: z
			.enum(["payroll", "hr", "compliance", "finance", "operations"])
			.optional(),
		periodStart: z.string().date().optional(),
		periodEnd: z.string().date().optional(),
		status: z
			.enum(["current", "historical", "provisional", "deprecated"])
			.optional(),
		limit: z.number().int().positive().max(100).default(50),
		offset: z.number().int().nonnegative().default(0),
	})
	.optional();

const getMetricTrendSchema = z.object({
	organizationId: z.string().uuid(),
	metricKey: z.string().min(1),
	periodStart: z.string().date(),
	periodEnd: z.string().date(),
});

// ============================================================================
// METRIC DEPENDENCY PROCEDURES
// ============================================================================

/**
 * Create a new metric dependency relationship
 */
export const createMetricDependency = authedProcedure
	.input(createMetricDependencySchema)
	.handler(async ({ input }) => {
		const newDependency: NewMetricDependency = {
			metricKey: input.metricKey,
			dependsOnType: input.dependsOnType,
			dependsOnKey: input.dependsOnKey,
			relationship: input.relationship,
			description: input.description || null,
			importance: input.importance.toString(),
		};

		const [dependency] = await db
			.insert(metricDependencies)
			.values(newDependency)
			.returning();

		if (!dependency) {
			throw new Error("Failed to create metric dependency");
		}

		return dependency;
	});

/**
 * List metric dependencies
 */
export const listMetricDependencies = publicProcedure
	.input(listMetricDependenciesSchema)
	.handler(async ({ input }) => {
		const filters: SQL[] = [];

		if (input?.metricKey) {
			filters.push(eq(metricDependencies.metricKey, input.metricKey));
		}

		if (input?.dependsOnKey) {
			filters.push(eq(metricDependencies.dependsOnKey, input.dependsOnKey));
		}

		const dependencies = await db.query.metricDependencies.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			orderBy: [desc(metricDependencies.importance)],
		});

		return dependencies;
	});

/**
 * Get full dependency tree for a metric
 */
export const getMetricDependencyTree = publicProcedure
	.input(z.object({ metricKey: z.string().min(1) }))
	.handler(async ({ input }) => {
		const dependencies = await db.query.metricDependencies.findMany({
			where: eq(metricDependencies.metricKey, input.metricKey),
			orderBy: [desc(metricDependencies.importance)],
		});

		// Recursively get dependencies of dependencies
		const tree: Record<
			string,
			{ dependency: (typeof dependencies)[0]; children: unknown[] }
		> = {};

		for (const dep of dependencies) {
			if (dep.dependsOnType === "metric") {
				const childDeps = await db.query.metricDependencies.findMany({
					where: eq(metricDependencies.metricKey, dep.dependsOnKey),
				});
				tree[dep.dependsOnKey] = {
					dependency: dep,
					children: childDeps,
				};
			} else {
				tree[dep.dependsOnKey] = {
					dependency: dep,
					children: [],
				};
			}
		}

		return tree;
	});

// ============================================================================
// DATA FRESHNESS PROCEDURES
// ============================================================================

// Helper function to build update fields for data freshness
function buildUpdateFreshnessFields(
	input: z.infer<typeof updateDataFreshnessSchema>,
	existing: typeof dataFreshness.$inferSelect,
	userId: string | undefined
) {
	return {
		lastUpdatedAt: new Date(),
		lastUpdatedBy: userId,
		status: input.status,
		isLocked: input.isLocked ?? existing.isLocked,
		lockedAt:
			input.isLocked && !existing.isLocked ? new Date() : existing.lockedAt,
		lockedBy: input.isLocked && !existing.isLocked ? userId : existing.lockedBy,
		autoRefresh: input.autoRefresh ?? existing.autoRefresh,
		stalenessThreshold:
			input.stalenessThreshold?.toString() ?? existing.stalenessThreshold,
		updateMetadata: input.updateMetadata ?? existing.updateMetadata,
		updatedAt: new Date(),
	};
}

// Helper function to build new data freshness record
function buildNewFreshnessRecord(
	input: z.infer<typeof updateDataFreshnessSchema>,
	userId: string | undefined
): NewDataFreshness {
	return {
		organizationId: input.organizationId,
		dataType: input.dataType,
		entityName: input.entityName || null,
		lastUpdatedAt: new Date(),
		lastUpdatedBy: userId,
		status: input.status,
		isLocked: input.isLocked ?? false,
		lockedAt: input.isLocked ? new Date() : null,
		lockedBy: input.isLocked ? userId : null,
		periodStart: input.periodStart ?? null,
		periodEnd: input.periodEnd ?? null,
		autoRefresh: input.autoRefresh ?? false,
		stalenessThreshold: input.stalenessThreshold?.toString() ?? null,
		updateMetadata: input.updateMetadata ?? null,
	};
}

/**
 * Update data freshness status
 */
export const updateDataFreshness = authedProcedure
	.input(updateDataFreshnessSchema)
	.handler(async ({ input, context }) => {
		// Check if freshness record exists
		const existing = await db.query.dataFreshness.findFirst({
			where: and(
				eq(dataFreshness.organizationId, input.organizationId),
				eq(dataFreshness.dataType, input.dataType),
				input.entityName
					? eq(dataFreshness.entityName, input.entityName)
					: undefined,
				input.periodStart
					? eq(dataFreshness.periodStart, input.periodStart)
					: undefined
			),
		});

		if (existing) {
			// Update existing record
			const [updated] = await db
				.update(dataFreshness)
				.set(
					buildUpdateFreshnessFields(input, existing, context.session?.user.id)
				)
				.where(eq(dataFreshness.id, existing.id))
				.returning();

			return updated;
		}
		// Create new record
		const [freshness] = await db
			.insert(dataFreshness)
			.values(buildNewFreshnessRecord(input, context.session?.user.id))
			.returning();

		if (!freshness) {
			throw new Error("Failed to create data freshness record");
		}

		return freshness;
	});

/**
 * Get data freshness status
 */
export const getDataFreshness = publicProcedure
	.input(getDataFreshnessSchema)
	.handler(async ({ input }) => {
		const filters = [eq(dataFreshness.organizationId, input.organizationId)];

		if (input.dataType) {
			filters.push(eq(dataFreshness.dataType, input.dataType));
		}

		if (input.entityName) {
			filters.push(eq(dataFreshness.entityName, input.entityName));
		}

		const records = await db.query.dataFreshness.findMany({
			where: and(...filters),
			orderBy: [desc(dataFreshness.lastUpdatedAt)],
			with: {
				updater: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				locker: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return records;
	});

// ============================================================================
// METRIC VALUE PROCEDURES
// ============================================================================

/**
 * Create or update a metric value
 */
export const createMetricValue = authedProcedure
	.input(createMetricValueSchema)
	.handler(async ({ input, context }) => {
		// Calculate changes if previous value provided
		let changeAbsolute: number | null = null;
		let changePercent: number | null = null;

		if (input.previousValue !== undefined) {
			changeAbsolute = input.value - input.previousValue;
			if (input.previousValue !== 0) {
				changePercent = (changeAbsolute / input.previousValue) * 100;
			}
		}

		const newMetric: NewMetricValue = {
			organizationId: input.organizationId,
			metricKey: input.metricKey,
			metricName: input.metricName,
			category: input.category || null,
			periodStart: input.periodStart,
			periodEnd: input.periodEnd,
			value: input.value.toString(),
			valueType: input.valueType,
			unit: input.unit || null,
			previousValue: input.previousValue?.toString() ?? null,
			changeAbsolute: changeAbsolute?.toString() ?? null,
			changePercent: changePercent?.toString() ?? null,
			dimensions: input.dimensions ?? null,
			calculationDetails: input.calculationDetails ?? null,
			confidence: input.confidence.toString(),
			isEstimated: input.isEstimated,
			status: input.status,
			calculatedBy: context.session?.user.id,
		};

		const [metric] = await db
			.insert(metricValues)
			.values(newMetric)
			.returning();

		if (!metric) {
			throw new Error("Failed to create metric value");
		}

		return metric;
	});

/**
 * List metric values with filtering
 */
export const listMetricValues = publicProcedure
	.input(listMetricValuesSchema)
	.handler(async ({ input }) => {
		const filters: SQL[] = [];

		if (input?.organizationId) {
			filters.push(eq(metricValues.organizationId, input.organizationId));
		}

		if (input?.metricKey) {
			filters.push(eq(metricValues.metricKey, input.metricKey));
		}

		if (input?.category) {
			filters.push(eq(metricValues.category, input.category));
		}

		if (input?.status) {
			filters.push(eq(metricValues.status, input.status));
		}

		if (input?.periodStart) {
			filters.push(gte(metricValues.periodStart, input.periodStart));
		}

		if (input?.periodEnd) {
			filters.push(lte(metricValues.periodEnd, input.periodEnd));
		}

		const metrics = await db.query.metricValues.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: [desc(metricValues.periodStart)],
			with: {
				calculator: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return metrics;
	});

/**
 * Get metric by key for specific period
 */
export const getMetricValue = publicProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			metricKey: z.string().min(1),
			periodStart: z.string().date(),
			periodEnd: z.string().date(),
		})
	)
	.handler(async ({ input }) => {
		const metric = await db.query.metricValues.findFirst({
			where: and(
				eq(metricValues.organizationId, input.organizationId),
				eq(metricValues.metricKey, input.metricKey),
				eq(metricValues.periodStart, input.periodStart),
				eq(metricValues.periodEnd, input.periodEnd)
			),
			with: {
				calculator: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		if (!metric) {
			throw new Error("Metric value not found");
		}

		return metric;
	});

/**
 * Get metric trend over time
 */
export const getMetricTrend = publicProcedure
	.input(getMetricTrendSchema)
	.handler(async ({ input }) => {
		const metrics = await db.query.metricValues.findMany({
			where: and(
				eq(metricValues.organizationId, input.organizationId),
				eq(metricValues.metricKey, input.metricKey),
				gte(metricValues.periodStart, input.periodStart),
				lte(metricValues.periodEnd, input.periodEnd)
			),
			orderBy: [desc(metricValues.periodStart)],
		});

		return metrics;
	});

// ============================================================================
// ROUTER
// ============================================================================

export const metricsRouter = {
	// Dependencies
	createDependency: createMetricDependency,
	listDependencies: listMetricDependencies,
	getDependencyTree: getMetricDependencyTree,

	// Data freshness
	updateFreshness: updateDataFreshness,
	getFreshness: getDataFreshness,

	// Metric values
	createValue: createMetricValue,
	listValues: listMetricValues,
	getValue: getMetricValue,
	getTrend: getMetricTrend,
};
