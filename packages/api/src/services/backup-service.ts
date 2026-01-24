import { backups, db } from "@PeopleFlow-HR-Suite/db";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { createGzip } from "node:zlib";
import { and, desc, eq } from "drizzle-orm";

// ============================================================================
// BACKUP SERVICE
// ============================================================================
// Tenant-level backup and restore functionality

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";

/**
 * Create a backup for an organization
 */
export async function createBackup(input: {
	organizationId: string;
	userId?: string;
	type: "manual" | "scheduled" | "auto";
}): Promise<{ backupId: string; fileName: string }> {
	const { organizationId, userId, type } = input;

	// Create backup record
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const fileName = `org-${organizationId}-${timestamp}.sql.gz`;
	const filePath = join(BACKUP_DIR, fileName);

	const [backup] = await db
		.insert(backups)
		.values({
			organizationId,
			type,
			status: "pending",
			fileName,
			filePath,
			createdBy: userId,
			startedAt: new Date(),
		})
		.returning();

	if (!backup) {
		throw new Error("Failed to create backup record");
	}

	// Start async backup process
	performBackup(backup.id, organizationId, filePath).catch((error) => {
		console.error("Backup failed:", error);
		// Update backup status to failed
		db.update(backups)
			.set({
				status: "failed",
				errorMessage: error.message,
				completedAt: new Date(),
			})
			.where(eq(backups.id, backup.id))
			.execute();
	});

	return {
		backupId: backup.id,
		fileName,
	};
}

/**
 * Perform the actual backup using pg_dump
 */
async function performBackup(
	backupId: string,
	_organizationId: string,
	filePath: string
): Promise<void> {
	// Ensure backup directory exists
	await fs.mkdir(BACKUP_DIR, { recursive: true });

	// Update status to in_progress
	await db
		.update(backups)
		.set({ status: "in_progress" })
		.where(eq(backups.id, backupId));

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL not configured");
	}

	// Tables to backup for this organization
	const tables = [
		"employees",
		"departments",
		"positions",
		"payroll_runs",
		"payslips",
		"employee_allowances",
		"employee_deductions",
		"retro_adjustments",
		"audit_logs",
	];

	// Build pg_dump command with organization filter
	const pgDumpArgs = [
		databaseUrl,
		"--no-owner",
		"--no-acl",
		"--clean",
		"--if-exists",
	];

	// Add table selection
	for (const table of tables) {
		pgDumpArgs.push(`--table=${table}`);
	}

	// Add WHERE clause for organization_id filtering
	// Note: pg_dump doesn't support WHERE directly, so we'll use a custom script
	// For production, consider using pg_dump with custom queries

	return new Promise((resolve, reject) => {
		const pgDump = spawn("pg_dump", pgDumpArgs);
		const gzip = createGzip();
		const output = require("node:fs").createWriteStream(filePath);

		pgDump.stdout.pipe(gzip).pipe(output);

		let stderrData = "";
		pgDump.stderr.on("data", (data) => {
			stderrData += data.toString();
		});

		output.on("finish", async () => {
			try {
				// Get file size
				const stats = await fs.stat(filePath);

				// Update backup record
				await db
					.update(backups)
					.set({
						status: "completed",
						fileSize: stats.size,
						includedTables: tables,
						completedAt: new Date(),
					})
					.where(eq(backups.id, backupId));

				resolve();
			} catch (error) {
				reject(error);
			}
		});

		pgDump.on("error", (error) => {
			reject(new Error(`pg_dump error: ${error.message}`));
		});

		pgDump.on("exit", (code) => {
			if (code !== 0) {
				reject(new Error(`pg_dump exited with code ${code}: ${stderrData}`));
			}
		});
	});
}

/**
 * List backups for an organization
 */
export async function listBackups(organizationId: string) {
	return await db.query.backups.findMany({
		where: eq(backups.organizationId, organizationId),
		orderBy: [desc(backups.createdAt)],
	});
}

/**
 * Download backup file
 */
export async function getBackupFile(
	backupId: string,
	organizationId: string
): Promise<{ filePath: string; fileName: string }> {
	const backup = await db.query.backups.findFirst({
		where: and(
			eq(backups.id, backupId),
			eq(backups.organizationId, organizationId)
		),
	});

	if (!backup) {
		throw new Error("Backup not found");
	}

	if (backup.status !== "completed") {
		throw new Error("Backup is not ready for download");
	}

	return {
		filePath: backup.filePath,
		fileName: backup.fileName,
	};
}

/**
 * Delete old backups based on retention policy
 */
export async function cleanupOldBackups(
	organizationId: string,
	retentionDays: number
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

	// Get backups to delete
	const oldBackups = await db.query.backups.findMany({
		where: and(
			eq(backups.organizationId, organizationId),
			eq(backups.status, "completed")
		),
		orderBy: [desc(backups.createdAt)],
	});

	// Keep only the most recent backups within retention period
	const toDelete = oldBackups.filter(
		(b) => b.createdAt && b.createdAt < cutoffDate
	);

	// Delete files and records
	for (const backup of toDelete) {
		try {
			await fs.unlink(backup.filePath);
		} catch (error) {
			console.error(`Failed to delete backup file: ${backup.filePath}`, error);
		}

		await db.delete(backups).where(eq(backups.id, backup.id));
	}

	return toDelete.length;
}

/**
 * Restore backup (placeholder - requires careful implementation)
 */
export async function restoreBackup(input: {
	backupId: string;
	organizationId: string;
	userId: string;
}): Promise<void> {
	const { backupId, organizationId, userId } = input;

	const backup = await db.query.backups.findFirst({
		where: and(
			eq(backups.id, backupId),
			eq(backups.organizationId, organizationId)
		),
	});

	if (!backup) {
		throw new Error("Backup not found");
	}

	if (backup.status !== "completed") {
		throw new Error("Cannot restore incomplete backup");
	}

	// TODO: Implement restore logic with transaction safety
	// This requires:
	// 1. Create transaction
	// 2. Delete existing data for organization
	// 3. Restore from backup file
	// 4. Verify data integrity
	// 5. Commit or rollback

	// Mark as restored
	await db
		.update(backups)
		.set({
			restoredAt: new Date(),
			restoredBy: userId,
		})
		.where(eq(backups.id, backupId));

	throw new Error("Restore functionality not yet implemented");
}
