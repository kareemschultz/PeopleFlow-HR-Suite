import { z } from "zod";
import { authedProcedure } from "..";
import {
	cleanupOldBackups,
	createBackup,
	getBackupFile,
	listBackups,
} from "../services/backup-service";

// ============================================================================
// BACKUP ROUTER
// ============================================================================

export const backupsRouter = {
	/**
	 * Create a manual backup
	 */
	create: authedProcedure
		.input(
			z.object({
				organizationId: z.string().uuid(),
			})
		)
		.handler(async ({ input, context }) => {
			const user = context.session.user;

			return await createBackup({
				organizationId: input.organizationId,
				userId: user.id,
				type: "manual",
			});
		}),

	/**
	 * List all backups for the organization
	 */
	list: authedProcedure
		.input(
			z.object({
				organizationId: z.string().uuid(),
			})
		)
		.handler(async ({ input }) => {
			return await listBackups(input.organizationId);
		}),

	/**
	 * Download a backup file
	 */
	download: authedProcedure
		.input(
			z.object({
				backupId: z.string().uuid(),
				organizationId: z.string().uuid(),
			})
		)
		.handler(async ({ input }) => {
			const { filePath, fileName } = await getBackupFile(
				input.backupId,
				input.organizationId
			);

			// Return file info - actual file download handled by server
			return {
				filePath,
				fileName,
				downloadUrl: `/api/backups/${input.backupId}/download`,
			};
		}),

	/**
	 * Cleanup old backups
	 */
	cleanup: authedProcedure
		.input(
			z.object({
				organizationId: z.string().uuid(),
				retentionDays: z.number().int().min(1).max(365).default(30),
			})
		)
		.handler(async ({ input }) => {
			const deletedCount = await cleanupOldBackups(
				input.organizationId,
				input.retentionDays
			);

			return {
				deletedCount,
				message: `Deleted ${deletedCount} old backup(s)`,
			};
		}),
};
