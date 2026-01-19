import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { organizations } from "./organizations";

// ============================================================================
// METRIC DEPENDENCIES - Track what feeds what
// ============================================================================

/**
 * Metric dependencies track the lineage of metrics.
 * This allows us to know which data sources affect which metrics
 * and invalidate cached metrics when source data changes.
 */
export const metricDependencies = pgTable(
	"metric_dependencies",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// The metric that depends on another data source
		metricKey: text("metric_key").notNull(),
		// e.g., "payroll_cost", "headcount", "average_salary"

		// What it depends on
		dependsOnType: text("depends_on_type").notNull(),
		// "metric", "table", "calculation", "external_api"

		dependsOnKey: text("depends_on_key").notNull(),
		// e.g., "headcount" (metric), "employees" (table),
		// "gross_earnings" (calculation), "exchange_rate_api" (external)

		// Relationship type
		relationship: text("relationship").default("input"),
		// "input" - direct dependency
		// "filter" - filters the data
		// "aggregation" - aggregates the data
		// "transformer" - transforms the data

		// Description of how they're related
		description: text("description"),

		// Weight/importance of this dependency (1-10)
		importance: numeric("importance", { precision: 3, scale: 1 }).default(
			"5.0"
		),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("metric_dependencies_metric_key_idx").on(table.metricKey),
		index("metric_dependencies_depends_on_idx").on(table.dependsOnKey),
		unique("metric_dependencies_unique").on(
			table.metricKey,
			table.dependsOnType,
			table.dependsOnKey
		),
	]
);

// ============================================================================
// DATA FRESHNESS - Track when data was last updated
// ============================================================================

/**
 * Data freshness tracking helps users understand if metrics are up-to-date.
 * Critical for payroll and compliance where stale data can cause problems.
 */
export const dataFreshness = pgTable(
	"data_freshness",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// What data type/entity
		dataType: text("data_type").notNull(),
		// "attendance", "payroll", "leave", "metrics", "employee_records"

		// Entity/table name (optional, for granularity)
		entityName: text("entity_name"),
		// "employees", "payroll_runs", "time_entries"

		// Last update timestamp
		lastUpdatedAt: timestamp("last_updated_at").notNull(),
		lastUpdatedBy: uuid("last_updated_by").references(() => employees.id),

		// For payroll: is it locked/finalized?
		isLocked: boolean("is_locked").default(false),
		lockedAt: timestamp("locked_at"),
		lockedBy: uuid("locked_by").references(() => employees.id),

		// Period covered by this data
		periodStart: date("period_start"),
		periodEnd: date("period_end"),

		// Freshness status
		status: text("status").default("current"),
		// "current" - up to date
		// "stale" - out of date
		// "calculating" - being updated
		// "locked" - finalized, no more updates
		// "error" - update failed

		// Staleness threshold (in seconds)
		// If data is older than this, mark as stale
		stalenessThreshold: numeric("staleness_threshold", {
			precision: 10,
			scale: 0,
		}),

		// Next scheduled refresh
		nextRefreshAt: timestamp("next_refresh_at"),

		// Auto-refresh enabled?
		autoRefresh: boolean("auto_refresh").default(false),

		// Metadata about the update
		updateMetadata: jsonb("update_metadata").$type<{
			recordsUpdated?: number;
			updateDuration?: number; // in milliseconds
			source?: string; // "manual", "scheduled", "api", "import"
			errors?: string[];
		}>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("data_freshness_org_idx").on(table.organizationId),
		index("data_freshness_data_type_idx").on(table.dataType),
		index("data_freshness_status_idx").on(table.status),
		index("data_freshness_period_idx").on(table.periodStart, table.periodEnd),
		unique("data_freshness_unique").on(
			table.organizationId,
			table.dataType,
			table.entityName,
			table.periodStart
		),
	]
);

// ============================================================================
// METRIC VALUES - Cached/computed metric results
// ============================================================================

/**
 * Stores calculated metric values with timestamps for historical tracking.
 * Enables dashboard performance and historical trend analysis.
 */
export const metricValues = pgTable(
	"metric_values",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Metric identification
		metricKey: text("metric_key").notNull(),
		// e.g., "headcount", "payroll_cost", "average_salary", "turnover_rate"

		metricName: text("metric_name").notNull(),
		// Human-readable name

		// Metric category
		category: text("category"),
		// "payroll", "hr", "compliance", "finance", "operations"

		// Time period for this metric
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),

		// The calculated value
		value: numeric("value", { precision: 15, scale: 4 }).notNull(),

		// Value type/unit
		valueType: text("value_type").notNull().default("number"),
		// "number", "currency", "percentage", "count", "ratio"

		unit: text("unit"),
		// "GYD", "USD", "%", "employees", "hours", null

		// Previous period value (for comparison)
		previousValue: numeric("previous_value", { precision: 15, scale: 4 }),

		// Change from previous period
		changeAbsolute: numeric("change_absolute", { precision: 15, scale: 4 }),
		changePercent: numeric("change_percent", { precision: 8, scale: 2 }),

		// Additional dimensions/filters applied
		dimensions: jsonb("dimensions").$type<{
			departmentId?: string;
			positionId?: string;
			employmentType?: string;
			location?: string;
			[key: string]: unknown;
		}>(),

		// Calculation metadata
		calculationDetails: jsonb("calculation_details").$type<{
			formula?: string;
			dataPoints?: number; // How many records contributed
			dataSources?: string[]; // Which tables/metrics were used
			calculatedAt?: string;
			calculationDuration?: number; // milliseconds
		}>(),

		// Data quality
		confidence: numeric("confidence", { precision: 3, scale: 2 }).default(
			"1.0"
		),
		// 0.0 - 1.0, how confident are we in this value?

		isEstimated: boolean("is_estimated").default(false),

		// Status
		status: text("status").default("current"),
		// "current", "historical", "provisional", "deprecated"

		// Audit
		calculatedBy: uuid("calculated_by").references(() => employees.id),
		calculatedAt: timestamp("calculated_at").notNull().defaultNow(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("metric_values_org_idx").on(table.organizationId),
		index("metric_values_metric_key_idx").on(table.metricKey),
		index("metric_values_period_idx").on(table.periodStart, table.periodEnd),
		index("metric_values_category_idx").on(table.category),
		unique("metric_values_unique").on(
			table.organizationId,
			table.metricKey,
			table.periodStart,
			table.periodEnd
		),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const dataFreshnessRelations = relations(dataFreshness, ({ one }) => ({
	organization: one(organizations, {
		fields: [dataFreshness.organizationId],
		references: [organizations.id],
	}),
	updater: one(employees, {
		fields: [dataFreshness.lastUpdatedBy],
		references: [employees.id],
	}),
	locker: one(employees, {
		fields: [dataFreshness.lockedBy],
		references: [employees.id],
	}),
}));

export const metricValuesRelations = relations(metricValues, ({ one }) => ({
	organization: one(organizations, {
		fields: [metricValues.organizationId],
		references: [organizations.id],
	}),
	calculator: one(employees, {
		fields: [metricValues.calculatedBy],
		references: [employees.id],
	}),
}));

// ============================================================================
// TYPES
// ============================================================================

export type MetricDependency = typeof metricDependencies.$inferSelect;
export type NewMetricDependency = typeof metricDependencies.$inferInsert;

export type DataFreshness = typeof dataFreshness.$inferSelect;
export type NewDataFreshness = typeof dataFreshness.$inferInsert;

export type MetricValue = typeof metricValues.$inferSelect;
export type NewMetricValue = typeof metricValues.$inferInsert;

// Helper types
export type MetricDimensions = NonNullable<MetricValue["dimensions"]>;
export type MetricCalculationDetails = NonNullable<
	MetricValue["calculationDetails"]
>;
export type FreshnessUpdateMetadata = NonNullable<
	DataFreshness["updateMetadata"]
>;

// Enums
export type DependencyType =
	| "metric"
	| "table"
	| "calculation"
	| "external_api";

export type DependencyRelationship =
	| "input"
	| "filter"
	| "aggregation"
	| "transformer";

export type FreshnessStatus =
	| "current"
	| "stale"
	| "calculating"
	| "locked"
	| "error";

export type MetricValueType =
	| "number"
	| "currency"
	| "percentage"
	| "count"
	| "ratio";

export type MetricStatus =
	| "current"
	| "historical"
	| "provisional"
	| "deprecated";
