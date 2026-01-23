import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
	type Document,
	type Equipment,
	type NewDocument,
	type NewEquipment,
	type NewTrainingSession,
	type NewWorkflow,
	type NewWorkflowTask,
	type NewWorkflowTemplate,
	type TrainingSession,
	type Workflow,
	type WorkflowTask,
	type WorkflowTemplate,
	db,
	documents,
	employees,
	equipment,
	trainingSessions,
	workflowTasks,
	workflowTemplates,
	workflows,
} from "@PeopleFlow-HR-Suite/db";
import { authedProcedure } from "..";

/**
 * Workflow Templates Router
 * Manage reusable onboarding/offboarding templates
 */
export const workflowTemplatesRouter = {
	list: authedProcedure
		.input(
			z.object({
				type: z.enum(["onboarding", "offboarding"]).optional(),
				isActive: z.boolean().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTemplate[]> => {
			const filters = [eq(workflowTemplates.organizationId, context.user.organizationId)];

			if (input.type) {
				filters.push(eq(workflowTemplates.type, input.type));
			}

			if (input.isActive !== undefined) {
				filters.push(eq(workflowTemplates.isActive, input.isActive));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.workflowTemplates.findMany({
				where: finalFilter,
				orderBy: [desc(workflowTemplates.createdAt)],
			});
		}),

	get: authedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input, context }): Promise<WorkflowTemplate> => {
			const template = await db.query.workflowTemplates.findFirst({
				where: and(
					eq(workflowTemplates.id, input.id),
					eq(workflowTemplates.organizationId, context.user.organizationId)
				),
			});

			if (!template) {
				throw new Error("Template not found");
			}

			return template;
		}),

	create: authedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				type: z.enum(["onboarding", "offboarding"]),
				description: z.string().optional(),
				durationDays: z.number().int().positive().default(30),
				isDefault: z.boolean().default(false),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTemplate> => {
			const newTemplate: NewWorkflowTemplate = {
				...input,
				organizationId: context.user.organizationId,
			};

			const [template] = await db
				.insert(workflowTemplates)
				.values(newTemplate)
				.returning();

			if (!template) {
				throw new Error("Failed to create template");
			}

			return template;
		}),

	update: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				durationDays: z.number().int().positive().optional(),
				isActive: z.boolean().optional(),
				isDefault: z.boolean().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTemplate> => {
			const { id, ...updates } = input;

			const [template] = await db
				.update(workflowTemplates)
				.set(updates)
				.where(
					and(
						eq(workflowTemplates.id, id),
						eq(workflowTemplates.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!template) {
				throw new Error("Template not found");
			}

			return template;
		}),

	delete: authedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input, context }): Promise<{ success: boolean }> => {
			const result = await db
				.delete(workflowTemplates)
				.where(
					and(
						eq(workflowTemplates.id, input.id),
						eq(workflowTemplates.organizationId, context.user.organizationId)
					)
				);

			return { success: result.rowCount > 0 };
		}),
};

/**
 * Workflows Router
 * Manage active onboarding/offboarding instances
 */
export const workflowsRouter = {
	list: authedProcedure
		.input(
			z.object({
				type: z.enum(["onboarding", "offboarding"]).optional(),
				status: z.enum(["in_progress", "completed", "cancelled"]).optional(),
				employeeId: z.string().uuid().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<Workflow[]> => {
			const filters = [eq(workflows.organizationId, context.user.organizationId)];

			if (input.type) {
				filters.push(eq(workflows.type, input.type));
			}

			if (input.status) {
				filters.push(eq(workflows.status, input.status));
			}

			if (input.employeeId) {
				filters.push(eq(workflows.employeeId, input.employeeId));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.workflows.findMany({
				where: finalFilter,
				with: {
					employee: true,
					template: true,
				},
				orderBy: [desc(workflows.createdAt)],
			});
		}),

	get: authedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input, context }) => {
			const workflow = await db.query.workflows.findFirst({
				where: and(
					eq(workflows.id, input.id),
					eq(workflows.organizationId, context.user.organizationId)
				),
				with: {
					employee: true,
					template: true,
					tasks: {
						with: {
							assignee: true,
							completedByEmployee: true,
							approver: true,
						},
					},
				},
			});

			if (!workflow) {
				throw new Error("Workflow not found");
			}

			return workflow;
		}),

	create: authedProcedure
		.input(
			z.object({
				employeeId: z.string().uuid(),
				templateId: z.string().uuid(),
				type: z.enum(["onboarding", "offboarding"]),
				startDate: z.string(),
			})
		)
		.handler(async ({ input, context }): Promise<Workflow> => {
			// Verify employee exists
			const employee = await db.query.employees.findFirst({
				where: and(
					eq(employees.id, input.employeeId),
					eq(employees.organizationId, context.user.organizationId)
				),
			});

			if (!employee) {
				throw new Error("Employee not found");
			}

			// Verify template exists
			const template = await db.query.workflowTemplates.findFirst({
				where: and(
					eq(workflowTemplates.id, input.templateId),
					eq(workflowTemplates.organizationId, context.user.organizationId)
				),
			});

			if (!template) {
				throw new Error("Template not found");
			}

			// Calculate target completion date
			const startDate = new Date(input.startDate);
			const targetCompletionDate = new Date(startDate);
			targetCompletionDate.setDate(
				targetCompletionDate.getDate() + (template.durationDays || 30)
			);

			const newWorkflow: NewWorkflow = {
				employeeId: input.employeeId,
				templateId: input.templateId,
				organizationId: context.user.organizationId,
				type: input.type,
				startDate: input.startDate,
				targetCompletionDate: targetCompletionDate.toISOString().split("T")[0] as string,
				status: "in_progress",
			};

			const [workflow] = await db.insert(workflows).values(newWorkflow).returning();

			if (!workflow) {
				throw new Error("Failed to create workflow");
			}

			return workflow;
		}),

	updateStatus: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(["in_progress", "completed", "cancelled"]),
			})
		)
		.handler(async ({ input, context }): Promise<Workflow> => {
			const updates: Partial<Workflow> = {
				status: input.status,
			};

			if (input.status === "completed") {
				updates.actualCompletionDate = new Date().toISOString().split("T")[0] as string;
			}

			const [workflow] = await db
				.update(workflows)
				.set(updates)
				.where(
					and(
						eq(workflows.id, input.id),
						eq(workflows.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!workflow) {
				throw new Error("Workflow not found");
			}

			return workflow;
		}),
};

/**
 * Workflow Tasks Router
 * Manage individual tasks within workflows
 */
export const workflowTasksRouter = {
	list: authedProcedure
		.input(
			z.object({
				workflowId: z.string().uuid(),
				status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
				assigneeId: z.string().uuid().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTask[]> => {
			const filters = [
				eq(workflowTasks.workflowId, input.workflowId),
				eq(workflowTasks.organizationId, context.user.organizationId),
			];

			if (input.status) {
				filters.push(eq(workflowTasks.status, input.status));
			}

			if (input.assigneeId) {
				filters.push(eq(workflowTasks.assigneeId, input.assigneeId));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.workflowTasks.findMany({
				where: finalFilter,
				with: {
					assignee: true,
					completedByEmployee: true,
					approver: true,
				},
			});
		}),

	create: authedProcedure
		.input(
			z.object({
				workflowId: z.string().uuid(),
				title: z.string().min(1),
				description: z.string().optional(),
				category: z.enum([
					"documentation",
					"equipment",
					"training",
					"it_access",
					"hr",
					"compliance",
				]),
				assigneeId: z.string().uuid().optional(),
				dueDate: z.string().optional(),
				isRequired: z.boolean().default(true),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTask> => {
			const newTask: NewWorkflowTask = {
				...input,
				organizationId: context.user.organizationId,
			};

			const [task] = await db.insert(workflowTasks).values(newTask).returning();

			if (!task) {
				throw new Error("Failed to create task");
			}

			return task;
		}),

	updateStatus: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(["pending", "in_progress", "completed", "skipped"]),
				notes: z.string().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<WorkflowTask> => {
			const updates: Partial<WorkflowTask> = {
				status: input.status,
				notes: input.notes,
			};

			if (input.status === "completed") {
				updates.completedAt = new Date();
				updates.completedBy = context.user.id;
			}

			const [task] = await db
				.update(workflowTasks)
				.set(updates)
				.where(
					and(
						eq(workflowTasks.id, input.id),
						eq(workflowTasks.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!task) {
				throw new Error("Task not found");
			}

			return task;
		}),

	approve: authedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input, context }): Promise<WorkflowTask> => {
			const [task] = await db
				.update(workflowTasks)
				.set({
					approvedBy: context.user.id,
					approvedAt: new Date(),
				})
				.where(
					and(
						eq(workflowTasks.id, input.id),
						eq(workflowTasks.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!task) {
				throw new Error("Task not found");
			}

			return task;
		}),
};

/**
 * Documents Router
 * Manage onboarding/offboarding documents
 */
export const documentsRouter = {
	list: authedProcedure
		.input(
			z.object({
				employeeId: z.string().uuid().optional(),
				workflowId: z.string().uuid().optional(),
				type: z.string().optional(),
				status: z.enum(["pending", "signed", "approved", "rejected"]).optional(),
			})
		)
		.handler(async ({ input, context }): Promise<Document[]> => {
			const filters = [eq(documents.organizationId, context.user.organizationId)];

			if (input.employeeId) {
				filters.push(eq(documents.employeeId, input.employeeId));
			}

			if (input.workflowId) {
				filters.push(eq(documents.workflowId, input.workflowId));
			}

			if (input.type) {
				filters.push(eq(documents.type, input.type));
			}

			if (input.status) {
				filters.push(eq(documents.status, input.status));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.documents.findMany({
				where: finalFilter,
				with: {
					employee: true,
					signer: true,
					approver: true,
				},
				orderBy: [desc(documents.createdAt)],
			});
		}),

	create: authedProcedure
		.input(
			z.object({
				employeeId: z.string().uuid(),
				workflowId: z.string().uuid().optional(),
				name: z.string().min(1),
				type: z.string(),
				category: z.enum(["onboarding", "offboarding", "general"]),
				description: z.string().optional(),
				fileUrl: z.string().url().optional(),
				fileName: z.string().optional(),
				mimeType: z.string().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<Document> => {
			const newDocument: NewDocument = {
				...input,
				organizationId: context.user.organizationId,
			};

			const [document] = await db.insert(documents).values(newDocument).returning();

			if (!document) {
				throw new Error("Failed to create document");
			}

			return document;
		}),

	updateStatus: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(["pending", "signed", "approved", "rejected"]),
			})
		)
		.handler(async ({ input, context }): Promise<Document> => {
			const updates: Partial<Document> = {
				status: input.status,
			};

			if (input.status === "signed") {
				updates.signedAt = new Date();
				updates.signedBy = context.user.id;
			}

			if (input.status === "approved") {
				updates.approvedAt = new Date();
				updates.approvedBy = context.user.id;
			}

			const [document] = await db
				.update(documents)
				.set(updates)
				.where(
					and(
						eq(documents.id, input.id),
						eq(documents.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!document) {
				throw new Error("Document not found");
			}

			return document;
		}),
};

/**
 * Equipment Router
 * Manage company equipment assigned to employees
 */
export const equipmentRouter = {
	list: authedProcedure
		.input(
			z.object({
				assignedTo: z.string().uuid().optional(),
				status: z.enum(["available", "assigned", "maintenance", "retired"]).optional(),
				type: z.string().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<Equipment[]> => {
			const filters = [eq(equipment.organizationId, context.user.organizationId)];

			if (input.assignedTo) {
				filters.push(eq(equipment.assignedTo, input.assignedTo));
			}

			if (input.status) {
				filters.push(eq(equipment.status, input.status));
			}

			if (input.type) {
				filters.push(eq(equipment.type, input.type));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.equipment.findMany({
				where: finalFilter,
				with: {
					employee: true,
				},
				orderBy: [desc(equipment.createdAt)],
			});
		}),

	create: authedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				type: z.string(),
				brand: z.string().optional(),
				model: z.string().optional(),
				serialNumber: z.string().optional(),
				assetTag: z.string().optional(),
				purchaseDate: z.string().optional(),
				purchasePrice: z.number().int().positive().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<Equipment> => {
			const newEquipment: NewEquipment = {
				...input,
				organizationId: context.user.organizationId,
			};

			const [equip] = await db.insert(equipment).values(newEquipment).returning();

			if (!equip) {
				throw new Error("Failed to create equipment");
			}

			return equip;
		}),

	assign: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				employeeId: z.string().uuid(),
			})
		)
		.handler(async ({ input, context }): Promise<Equipment> => {
			const [equip] = await db
				.update(equipment)
				.set({
					assignedTo: input.employeeId,
					assignedAt: new Date(),
					status: "assigned",
				})
				.where(
					and(
						eq(equipment.id, input.id),
						eq(equipment.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!equip) {
				throw new Error("Equipment not found");
			}

			return equip;
		}),

	return: authedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input, context }): Promise<Equipment> => {
			const [equip] = await db
				.update(equipment)
				.set({
					returnedAt: new Date(),
					status: "available",
				})
				.where(
					and(
						eq(equipment.id, input.id),
						eq(equipment.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!equip) {
				throw new Error("Equipment not found");
			}

			return equip;
		}),
};

/**
 * Training Sessions Router
 * Manage employee training records
 */
export const trainingSessionsRouter = {
	list: authedProcedure
		.input(
			z.object({
				employeeId: z.string().uuid().optional(),
				workflowId: z.string().uuid().optional(),
				status: z
					.enum(["scheduled", "in_progress", "completed", "cancelled"])
					.optional(),
			})
		)
		.handler(async ({ input, context }): Promise<TrainingSession[]> => {
			const filters = [eq(trainingSessions.organizationId, context.user.organizationId)];

			if (input.employeeId) {
				filters.push(eq(trainingSessions.employeeId, input.employeeId));
			}

			if (input.workflowId) {
				filters.push(eq(trainingSessions.workflowId, input.workflowId));
			}

			if (input.status) {
				filters.push(eq(trainingSessions.status, input.status));
			}

			const finalFilter = and(...filters);
			if (!finalFilter) {
				throw new Error("No filters specified");
			}

			return await db.query.trainingSessions.findMany({
				where: finalFilter,
				with: {
					employee: true,
					instructor: true,
				},
				orderBy: [desc(trainingSessions.scheduledDate)],
			});
		}),

	create: authedProcedure
		.input(
			z.object({
				employeeId: z.string().uuid(),
				workflowId: z.string().uuid().optional(),
				title: z.string().min(1),
				description: z.string().optional(),
				type: z.enum(["orientation", "compliance", "technical", "soft_skills"]),
				provider: z.string().optional(),
				scheduledDate: z.string().optional(),
				durationMinutes: z.number().int().positive().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<TrainingSession> => {
			const newSession: NewTrainingSession = {
				...input,
				organizationId: context.user.organizationId,
			};

			const [session] = await db.insert(trainingSessions).values(newSession).returning();

			if (!session) {
				throw new Error("Failed to create training session");
			}

			return session;
		}),

	complete: authedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				score: z.number().int().min(0).max(100).optional(),
				passed: z.boolean().optional(),
				certificateUrl: z.string().url().optional(),
			})
		)
		.handler(async ({ input, context }): Promise<TrainingSession> => {
			const { id, ...updates } = input;

			const [session] = await db
				.update(trainingSessions)
				.set({
					...updates,
					status: "completed",
					completedDate: new Date().toISOString().split("T")[0] as string,
				})
				.where(
					and(
						eq(trainingSessions.id, id),
						eq(trainingSessions.organizationId, context.user.organizationId)
					)
				)
				.returning();

			if (!session) {
				throw new Error("Training session not found");
			}

			return session;
		}),
};

/**
 * Statistics Router
 * Get workflow and task statistics
 */
export const onboardingOffboardingStatsRouter = {
	getWorkflowStats: authedProcedure.handler(async ({ context }) => {
		const [activeOnboardingCount] = await db
			.select({ count: count() })
			.from(workflows)
			.where(
				and(
					eq(workflows.organizationId, context.user.organizationId),
					eq(workflows.type, "onboarding"),
					eq(workflows.status, "in_progress")
				)
			);

		const [activeOffboardingCount] = await db
			.select({ count: count() })
			.from(workflows)
			.where(
				and(
					eq(workflows.organizationId, context.user.organizationId),
					eq(workflows.type, "offboarding"),
					eq(workflows.status, "in_progress")
				)
			);

		const [pendingTasksCount] = await db
			.select({ count: count() })
			.from(workflowTasks)
			.where(
				and(
					eq(workflowTasks.organizationId, context.user.organizationId),
					eq(workflowTasks.status, "pending")
				)
			);

		return {
			activeOnboarding: activeOnboardingCount?.count || 0,
			activeOffboarding: activeOffboardingCount?.count || 0,
			pendingTasks: pendingTasksCount?.count || 0,
		};
	}),
};
