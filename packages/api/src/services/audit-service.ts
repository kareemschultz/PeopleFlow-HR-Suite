import type { NewAuditLog } from "@PeopleFlow-HR-Suite/db";

// ============================================================================
// AUDIT SERVICE
// ============================================================================

/**
 * Service for logging audit events and tracking changes.
 * Essential for compliance, security, and troubleshooting.
 */

export interface LogAuditInput {
	organizationId?: string;
	userId?: string;
	employeeId?: string;
	action: string;
	actionCategory: string;
	entityType: string;
	entityId?: string;
	entityName?: string;
	changes?: {
		before?: Record<string, unknown>;
		after?: Record<string, unknown>;
		fields?: string[];
	};
	metadata?: {
		reason?: string;
		notes?: string;
		batchId?: string;
		taskId?: string;
		duration?: number;
		recordsAffected?: number;
		success?: boolean;
		errorMessage?: string;
	};
	requestContext?: {
		path?: string;
		method?: string;
		ipAddress?: string;
		userAgent?: string;
		sessionId?: string;
		requestId?: string;
	};
	status?: "success" | "failure" | "partial";
	severity?: "debug" | "info" | "warning" | "error" | "critical";
	isSensitive?: string;
	dataClassification?: string;
}

export function createAuditLog(input: LogAuditInput): NewAuditLog {
	const {
		action,
		actionCategory,
		entityType,
		status = "success",
		severity = "info",
		isSensitive = "false",
	} = input;

	// Build actor info from available data
	const actorInfo = {
		userId: input.userId,
		employeeId: input.employeeId,
		...input.requestContext,
	};

	return {
		organizationId: input.organizationId,
		userId: input.userId,
		employeeId: input.employeeId,
		actorInfo,
		action,
		actionCategory,
		entityType,
		entityId: input.entityId,
		entityName: input.entityName,
		changes: input.changes,
		metadata: input.metadata,
		requestContext: input.requestContext,
		status,
		severity,
		isSensitive,
		dataClassification: input.dataClassification,
	};
}

// ============================================================================
// CHANGE TRACKING
// ============================================================================

/**
 * Track changes between old and new values of an object.
 */
export function trackChanges<T extends Record<string, unknown>>(
	before: T,
	after: T
): {
	fields: string[];
	before: Record<string, unknown>;
	after: Record<string, unknown>;
} {
	const changedFields: string[] = [];
	const beforeValues: Record<string, unknown> = {};
	const afterValues: Record<string, unknown> = {};

	for (const key of Object.keys(after)) {
		if (before[key] !== after[key]) {
			changedFields.push(key);
			beforeValues[key] = before[key];
			afterValues[key] = after[key];
		}
	}

	return {
		fields: changedFields,
		before: beforeValues,
		after: afterValues,
	};
}

// ============================================================================
// PERMISSION SNAPSHOT HELPERS
// ============================================================================

export interface PermissionSnapshotInput {
	organizationId: string;
	userId: string;
	employeeId?: string;
	role: string;
	permissions?: string[];
	scope?: {
		type: "all" | "department" | "employees" | "none";
		departmentIds?: string[];
		employeeIds?: string[];
		regions?: string[];
	};
	changeType: "granted" | "revoked" | "modified" | "inherited";
	changedBy?: string;
	changeReason?: string;
	source?: string;
	effectiveFrom: Date;
}

/**
 * Create a permission snapshot record.
 * This tracks who had what permissions at what time for audit purposes.
 */
export function createPermissionSnapshot(input: PermissionSnapshotInput) {
	return {
		organizationId: input.organizationId,
		userId: input.userId,
		employeeId: input.employeeId,
		role: input.role,
		permissions: input.permissions,
		scope: input.scope,
		effectiveFrom: input.effectiveFrom,
		effectiveTo: null, // Still active
		changeType: input.changeType,
		changedBy: input.changedBy,
		changeReason: input.changeReason,
		source: input.source ?? "manual",
	};
}

/**
 * Revoke permissions by setting effectiveTo.
 */
export function revokePermissions(_snapshotId: string, revokedAt: Date) {
	return {
		effectiveTo: revokedAt,
	};
}
