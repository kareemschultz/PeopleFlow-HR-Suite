import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// ============================================================================
// TENANT BACKUPS
// ============================================================================
// Self-service backup system for organizations to backup and restore their data

export const backups = pgTable(
	"backups",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Backup metadata
		type: text("type").notNull(), // "manual" | "scheduled" | "auto"
		status: text("status").notNull().default("pending"), // "pending" | "in_progress" | "completed" | "failed"

		// Storage details
		fileName: text("file_name").notNull(), // e.g., "org-uuid-2024-01-23.sql.gz"
		filePath: text("file_path").notNull(), // S3 path or local path
		fileSize: integer("file_size"), // In bytes

		// Backup content metadata
		includedTables: jsonb("included_tables").$type<string[]>(), // Tables included in backup
		recordCounts: jsonb("record_counts").$type<Record<string, number>>(), // Count per table

		// Execution details
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		errorMessage: text("error_message"),

		// Restore tracking
		restoredAt: timestamp("restored_at"),
		restoredBy: uuid("restored_by"), // User who restored this backup

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"), // User who initiated backup
	},
	(table) => [
		index("backups_org_id_idx").on(table.organizationId),
		index("backups_status_idx").on(table.status),
		index("backups_created_at_idx").on(table.createdAt),
		index("backups_org_created_idx").on(table.organizationId, table.createdAt),
	]
);

// ============================================================================
// BACKUP SCHEDULES
// ============================================================================

export const backupSchedules = pgTable(
	"backup_schedules",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Schedule configuration
		frequency: text("frequency").notNull(), // "daily" | "weekly" | "monthly"
		time: text("time").notNull(), // HH:MM format (e.g., "02:00")
		dayOfWeek: integer("day_of_week"), // 0-6 for weekly (0 = Sunday)
		dayOfMonth: integer("day_of_month"), // 1-31 for monthly

		// Retention policy
		retentionDays: integer("retention_days").notNull().default(30), // Keep backups for N days
		maxBackups: integer("max_backups").notNull().default(10), // Max number of backups to keep

		// Status
		isActive: text("is_active").notNull().default("true"), // "true" | "false"
		lastRunAt: timestamp("last_run_at"),
		nextRunAt: timestamp("next_run_at"),

		// Audit
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
	},
	(table) => [
		index("backup_schedules_org_id_idx").on(table.organizationId),
		index("backup_schedules_next_run_idx").on(table.nextRunAt),
	]
);

// ============================================================================
// TYPES
// ============================================================================

export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;
export type BackupSchedule = typeof backupSchedules.$inferSelect;
export type NewBackupSchedule = typeof backupSchedules.$inferInsert;
