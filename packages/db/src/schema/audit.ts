import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { organizations } from "./organizations";

// ============================================================================
// PERMISSION SNAPSHOTS - Historical permission recording
// ============================================================================

/**
 * Permission snapshots record who had what permissions at what time.
 * Critical for compliance audits: "Who could access employee X's data on date Y?"
 */
export const permissionSnapshots = pgTable(
	"permission_snapshots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// User whose permissions are being tracked
		userId: text("user_id").notNull(), // FK to user table (soft reference)

		// Employee record (if user is also an employee)
		employeeId: uuid("employee_id").references(() => employees.id),

		// Role at the time
		role: text("role").notNull(),
		// "admin", "manager", "payroll_admin", "hr_manager", "employee", "viewer"

		// Permissions/capabilities
		permissions: jsonb("permissions").$type<string[]>(),
		// ["view_all_employees", "manage_payroll", "approve_adjustments", etc.]

		// Scope of access
		scope: jsonb("scope").$type<{
			type: "all" | "department" | "employees" | "none";
			departmentIds?: string[];
			employeeIds?: string[];
			regions?: string[];
		}>(),

		// Effective period
		effectiveFrom: timestamp("effective_from").notNull(),
		effectiveTo: timestamp("effective_to"),
		// null = still active

		// Change tracking
		changeType: text("change_type").notNull(),
		// "granted" - permissions given
		// "revoked" - permissions removed
		// "modified" - permissions changed
		// "inherited" - inherited from role/group

		changedBy: uuid("changed_by").references(() => employees.id),
		changeReason: text("change_reason"),

		// Source of permission
		source: text("source").default("manual"),
		// "manual", "role_assignment", "group_membership", "system"

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("permission_snapshots_org_idx").on(table.organizationId),
		index("permission_snapshots_user_idx").on(table.userId),
		index("permission_snapshots_employee_idx").on(table.employeeId),
		index("permission_snapshots_effective_period_idx").on(
			table.effectiveFrom,
			table.effectiveTo
		),
		index("permission_snapshots_role_idx").on(table.role),
	]
);

// ============================================================================
// AUDIT LOG - Comprehensive audit trail
// ============================================================================

/**
 * Audit log records all significant actions in the system.
 * Essential for compliance, security, and troubleshooting.
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),
		// Note: some actions (like login) may not be org-specific

		// Who performed the action
		userId: text("user_id"), // FK to user table (soft reference)
		employeeId: uuid("employee_id").references(() => employees.id),

		// Actor info (snapshot at time of action)
		actorInfo: jsonb("actor_info").$type<{
			userId?: string;
			employeeId?: string;
			userName?: string;
			email?: string;
			role?: string;
			ipAddress?: string;
			userAgent?: string;
		}>(),

		// ACTION
		action: text("action").notNull(),
		// "create", "update", "delete", "view", "export",
		// "approve", "reject", "finalize", "login", "logout"

		actionCategory: text("action_category").notNull(),
		// "authentication", "employee_management", "payroll",
		// "reporting", "settings", "permissions", "data_export"

		// ENTITY affected
		entityType: text("entity_type").notNull(),
		// "employee", "payroll_run", "payslip", "organization",
		// "department", "user", "tax_jurisdiction"

		entityId: text("entity_id"),
		// ID of the affected entity

		entityName: text("entity_name"),
		// Human-readable name for the entity

		// CHANGES
		// What changed (for update actions)
		changes: jsonb("changes").$type<{
			before?: Record<string, unknown>;
			after?: Record<string, unknown>;
			fields?: string[]; // Which fields changed
		}>(),

		// Metadata about the action
		metadata: jsonb("metadata").$type<{
			reason?: string;
			notes?: string;
			batchId?: string; // For bulk operations
			taskId?: string; // Related task/workflow
			duration?: number; // How long the action took (ms)
			recordsAffected?: number; // For bulk operations
			success?: boolean;
			errorMessage?: string;
		}>(),

		// CONTEXT
		// Request context
		requestContext: jsonb("request_context").$type<{
			path?: string; // API endpoint
			method?: string; // HTTP method
			ipAddress?: string;
			userAgent?: string;
			sessionId?: string;
			requestId?: string;
		}>(),

		// RESULT
		status: text("status").default("success"),
		// "success", "failure", "partial"

		errorMessage: text("error_message"),

		// SEVERITY
		severity: text("severity").default("info"),
		// "debug", "info", "warning", "error", "critical"

		// COMPLIANCE
		// Is this a sensitive/regulated action?
		isSensitive: text("is_sensitive").default("false"),
		// Mark actions involving PII, salary, etc.

		// Data classification
		dataClassification: text("data_classification"),
		// "public", "internal", "confidential", "restricted"

		// Retention
		// How long should this log be retained?
		retentionPeriod: text("retention_period").default("7_years"),
		// "30_days", "1_year", "7_years", "indefinite"

		// Timestamp
		timestamp: timestamp("timestamp").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("audit_log_org_idx").on(table.organizationId),
		index("audit_log_user_idx").on(table.userId),
		index("audit_log_employee_idx").on(table.employeeId),
		index("audit_log_action_idx").on(table.action),
		index("audit_log_entity_idx").on(table.entityType, table.entityId),
		index("audit_log_timestamp_idx").on(table.timestamp),
		index("audit_log_category_idx").on(table.actionCategory),
		index("audit_log_severity_idx").on(table.severity),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const permissionSnapshotsRelations = relations(
	permissionSnapshots,
	({ one }) => ({
		organization: one(organizations, {
			fields: [permissionSnapshots.organizationId],
			references: [organizations.id],
		}),
		employee: one(employees, {
			fields: [permissionSnapshots.employeeId],
			references: [employees.id],
		}),
		changedByEmployee: one(employees, {
			fields: [permissionSnapshots.changedBy],
			references: [employees.id],
		}),
	})
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	organization: one(organizations, {
		fields: [auditLog.organizationId],
		references: [organizations.id],
	}),
	employee: one(employees, {
		fields: [auditLog.employeeId],
		references: [employees.id],
	}),
}));

// ============================================================================
// TYPES
// ============================================================================

export type PermissionSnapshot = typeof permissionSnapshots.$inferSelect;
export type NewPermissionSnapshot = typeof permissionSnapshots.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

// Helper types
export type PermissionScope = NonNullable<PermissionSnapshot["scope"]>;
export type AuditChanges = NonNullable<AuditLog["changes"]>;
export type AuditMetadata = NonNullable<AuditLog["metadata"]>;
export type AuditRequestContext = NonNullable<AuditLog["requestContext"]>;
export type ActorInfo = NonNullable<AuditLog["actorInfo"]>;

// Enums
export type PermissionChangeType =
	| "granted"
	| "revoked"
	| "modified"
	| "inherited";

export type PermissionSource =
	| "manual"
	| "role_assignment"
	| "group_membership"
	| "system";

export type AuditAction =
	| "create"
	| "update"
	| "delete"
	| "view"
	| "export"
	| "approve"
	| "reject"
	| "finalize"
	| "login"
	| "logout";

export type AuditCategory =
	| "authentication"
	| "employee_management"
	| "payroll"
	| "reporting"
	| "settings"
	| "permissions"
	| "data_export";

export type AuditStatus = "success" | "failure" | "partial";

export type AuditSeverity = "debug" | "info" | "warning" | "error" | "critical";

export type DataClassification =
	| "public"
	| "internal"
	| "confidential"
	| "restricted";

export type RetentionPeriod = "30_days" | "1_year" | "7_years" | "indefinite";
