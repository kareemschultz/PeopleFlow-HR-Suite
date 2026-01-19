import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { metricValues } from "./metrics";
import { organizations } from "./organizations";

// ============================================================================
// ANOMALY RULES - Configurable anomaly detection rules
// ============================================================================

/**
 * Anomaly rules define the thresholds and conditions for detecting unusual patterns
 * in metrics. Organizations can customize these to their specific needs.
 */
export const anomalyRules = pgTable(
	"anomaly_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Organization-specific or global default
		organizationId: uuid("organization_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),
		// null = global default rule (applies to all orgs unless overridden)

		// Which metric this rule applies to
		metricKey: text("metric_key").notNull(),
		// e.g., "payroll_cost", "headcount", "overtime_hours"

		// Rule name
		ruleName: text("rule_name").notNull(),

		// Rule type
		ruleType: text("rule_type").notNull(),
		// "percent_change" - percentage change from comparison period
		// "absolute_threshold" - value exceeds/falls below a threshold
		// "standard_deviation" - value is N standard deviations from mean
		// "seasonal_pattern" - deviates from historical seasonal pattern
		// "rate_of_change" - rate of change exceeds threshold

		// THRESHOLDS
		// For percentage change and standard deviation rules
		warningThreshold: numeric("warning_threshold", {
			precision: 10,
			scale: 4,
		}),
		criticalThreshold: numeric("critical_threshold", {
			precision: 10,
			scale: 4,
		}),

		// For absolute threshold rules
		absoluteMin: numeric("absolute_min", { precision: 15, scale: 4 }),
		absoluteMax: numeric("absolute_max", { precision: 15, scale: 4 }),

		// Direction to monitor
		direction: text("direction").default("both"),
		// "up" - only alert on increases
		// "down" - only alert on decreases
		// "both" - alert on both

		// Comparison period for change detection
		comparisonPeriod: text("comparison_period").default("previous"),
		// "previous" - compare to previous period
		// "same_period_last_year" - compare to same period last year
		// "average_3_months" - compare to 3-month rolling average
		// "average_12_months" - compare to 12-month rolling average

		// How many periods to look back for statistical calculations
		lookbackPeriods: numeric("lookback_periods", {
			precision: 4,
			scale: 0,
		}).default("12"),

		// Active status
		isActive: boolean("is_active").notNull().default(true),

		// Description
		description: text("description"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: uuid("created_by").references(() => employees.id),
	},
	(table) => [
		index("anomaly_rules_org_idx").on(table.organizationId),
		index("anomaly_rules_metric_key_idx").on(table.metricKey),
		index("anomaly_rules_active_idx").on(table.isActive),
	]
);

// ============================================================================
// METRIC ANOMALIES - Detected anomalies
// ============================================================================

/**
 * Metric anomalies are unusual patterns detected by anomaly rules.
 * These are automatically created when metrics are calculated and evaluated.
 */
export const metricAnomalies = pgTable(
	"metric_anomalies",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Which metric triggered this anomaly
		metricKey: text("metric_key").notNull(),

		// Link to the actual metric value
		metricValueId: uuid("metric_value_id").references(() => metricValues.id, {
			onDelete: "set null",
		}),

		// Which rule detected this
		ruleId: uuid("rule_id").references(() => anomalyRules.id, {
			onDelete: "set null",
		}),

		// Period when anomaly was detected
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),

		// ANOMALY DETAILS
		anomalyType: text("anomaly_type").notNull(),
		// "spike" - sudden increase
		// "drop" - sudden decrease
		// "threshold_breach" - exceeded threshold
		// "pattern_break" - deviated from pattern
		// "rate_change" - rate of change unusual

		// VALUES
		currentValue: numeric("current_value", {
			precision: 15,
			scale: 4,
		}).notNull(),
		expectedValue: numeric("expected_value", { precision: 15, scale: 4 }),
		previousValue: numeric("previous_value", { precision: 15, scale: 4 }),

		// DEVIATION
		deviationPercent: numeric("deviation_percent", { precision: 8, scale: 2 }),
		// How much it deviated as a percentage

		deviationAbsolute: numeric("deviation_absolute", {
			precision: 15,
			scale: 4,
		}),
		// Absolute difference

		standardDeviations: numeric("standard_deviations", {
			precision: 6,
			scale: 2,
		}),
		// How many standard deviations from the mean

		// SEVERITY
		severity: text("severity").default("warning"),
		// "info" - FYI, no action needed
		// "warning" - should be reviewed
		// "critical" - requires immediate attention

		// DESCRIPTION
		description: text("description").notNull(),
		// Auto-generated human-readable description

		// Additional context
		context: text("context"),
		// Any additional context about why this might have occurred

		// STATUS
		status: text("status").default("open"),
		// "open" - newly detected
		// "acknowledged" - someone has seen it
		// "investigating" - being looked into
		// "resolved" - root cause found and addressed
		// "dismissed" - false positive or acceptable

		// WORKFLOW
		acknowledgedBy: uuid("acknowledged_by").references(() => employees.id),
		acknowledgedAt: timestamp("acknowledged_at"),

		resolvedBy: uuid("resolved_by").references(() => employees.id),
		resolvedAt: timestamp("resolved_at"),
		resolution: text("resolution"),
		// Explanation of what was found/done

		// Priority
		priority: text("priority").default("normal"),
		// "urgent", "high", "normal", "low"

		// Auto-dismiss after X days?
		autoDismissAt: timestamp("auto_dismiss_at"),

		// Tags for categorization
		tags: text("tags").array(),

		// Detected at
		detectedAt: timestamp("detected_at").notNull().defaultNow(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("metric_anomalies_org_idx").on(table.organizationId),
		index("metric_anomalies_metric_key_idx").on(table.metricKey),
		index("metric_anomalies_period_idx").on(table.periodStart, table.periodEnd),
		index("metric_anomalies_severity_idx").on(table.severity),
		index("metric_anomalies_status_idx").on(table.status),
		index("metric_anomalies_detected_at_idx").on(table.detectedAt),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const anomalyRulesRelations = relations(
	anomalyRules,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [anomalyRules.organizationId],
			references: [organizations.id],
		}),
		creator: one(employees, {
			fields: [anomalyRules.createdBy],
			references: [employees.id],
		}),
		detectedAnomalies: many(metricAnomalies),
	})
);

export const metricAnomaliesRelations = relations(
	metricAnomalies,
	({ one }) => ({
		organization: one(organizations, {
			fields: [metricAnomalies.organizationId],
			references: [organizations.id],
		}),
		metricValue: one(metricValues, {
			fields: [metricAnomalies.metricValueId],
			references: [metricValues.id],
		}),
		rule: one(anomalyRules, {
			fields: [metricAnomalies.ruleId],
			references: [anomalyRules.id],
		}),
		acknowledger: one(employees, {
			fields: [metricAnomalies.acknowledgedBy],
			references: [employees.id],
		}),
		resolver: one(employees, {
			fields: [metricAnomalies.resolvedBy],
			references: [employees.id],
		}),
	})
);

// ============================================================================
// TYPES
// ============================================================================

export type AnomalyRule = typeof anomalyRules.$inferSelect;
export type NewAnomalyRule = typeof anomalyRules.$inferInsert;

export type MetricAnomaly = typeof metricAnomalies.$inferSelect;
export type NewMetricAnomaly = typeof metricAnomalies.$inferInsert;

// Enums
export type AnomalyRuleType =
	| "percent_change"
	| "absolute_threshold"
	| "standard_deviation"
	| "seasonal_pattern"
	| "rate_of_change";

export type AnomalyDirection = "up" | "down" | "both";

export type ComparisonPeriod =
	| "previous"
	| "same_period_last_year"
	| "average_3_months"
	| "average_12_months";

export type AnomalyType =
	| "spike"
	| "drop"
	| "threshold_breach"
	| "pattern_break"
	| "rate_change";

export type AnomalySeverity = "info" | "warning" | "critical";

export type AnomalyStatus =
	| "open"
	| "acknowledged"
	| "investigating"
	| "resolved"
	| "dismissed";

export type AnomalyPriority = "urgent" | "high" | "normal" | "low";
