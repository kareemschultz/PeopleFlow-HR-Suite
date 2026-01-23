import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { employees } from "./employees";
import { organizations } from "./organizations";

/**
 * Workflow Templates - Reusable onboarding/offboarding templates
 */
export const workflowTemplates = pgTable(
	"workflow_template",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Template details
		name: text("name").notNull(),
		type: text("type").notNull(), // onboarding, offboarding
		description: text("description"),

		// Settings
		durationDays: integer("duration_days").default(30), // Expected completion time
		isActive: boolean("is_active").default(true).notNull(),
		isDefault: boolean("is_default").default(false).notNull(),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("workflow_template_organization_idx").on(table.organizationId),
		index("workflow_template_type_idx").on(table.type),
		index("workflow_template_active_idx").on(table.isActive),
	]
);

export const workflowTemplatesRelations = relations(
	workflowTemplates,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [workflowTemplates.organizationId],
			references: [organizations.id],
		}),
		taskTemplates: many(taskTemplates),
		workflows: many(workflows),
	})
);

/**
 * Task Templates - Template tasks for workflows
 */
export const taskTemplates = pgTable(
	"task_template",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workflowTemplateId: uuid("workflow_template_id")
			.notNull()
			.references(() => workflowTemplates.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Task details
		title: text("title").notNull(),
		description: text("description"),
		category: text("category").notNull(), // documentation, equipment, training, it_access, hr, compliance
		assigneeRole: text("assignee_role"), // hr_manager, it_admin, direct_manager, employee

		// Scheduling
		dayOffset: integer("day_offset").default(0), // Days from workflow start (can be negative for pre-start tasks)
		estimatedMinutes: integer("estimated_minutes").default(30),

		// Requirements
		isRequired: boolean("is_required").default(true).notNull(),
		requiresApproval: boolean("requires_approval").default(false).notNull(),
		order: integer("order").default(0), // Display order

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("task_template_workflow_idx").on(table.workflowTemplateId),
		index("task_template_organization_idx").on(table.organizationId),
		index("task_template_category_idx").on(table.category),
	]
);

export const taskTemplatesRelations = relations(taskTemplates, ({ one }) => ({
	workflowTemplate: one(workflowTemplates, {
		fields: [taskTemplates.workflowTemplateId],
		references: [workflowTemplates.id],
	}),
	organization: one(organizations, {
		fields: [taskTemplates.organizationId],
		references: [organizations.id],
	}),
}));

/**
 * Workflows - Active onboarding/offboarding instances
 */
export const workflows = pgTable(
	"workflow",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		templateId: uuid("template_id")
			.notNull()
			.references(() => workflowTemplates.id),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Workflow details
		type: text("type").notNull(), // onboarding, offboarding
		status: text("status").notNull().default("in_progress"), // in_progress, completed, cancelled

		// Dates
		startDate: date("start_date").notNull(), // First day or termination date
		targetCompletionDate: date("target_completion_date"),
		actualCompletionDate: date("actual_completion_date"),

		// Progress
		totalTasks: integer("total_tasks").default(0),
		completedTasks: integer("completed_tasks").default(0),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("workflow_employee_idx").on(table.employeeId),
		index("workflow_template_idx").on(table.templateId),
		index("workflow_organization_idx").on(table.organizationId),
		index("workflow_status_idx").on(table.status),
		index("workflow_type_idx").on(table.type),
	]
);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	employee: one(employees, {
		fields: [workflows.employeeId],
		references: [employees.id],
	}),
	template: one(workflowTemplates, {
		fields: [workflows.templateId],
		references: [workflowTemplates.id],
	}),
	organization: one(organizations, {
		fields: [workflows.organizationId],
		references: [organizations.id],
	}),
	tasks: many(workflowTasks),
}));

/**
 * Workflow Tasks - Actual tasks in a workflow
 */
export const workflowTasks = pgTable(
	"workflow_task",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workflowId: uuid("workflow_id")
			.notNull()
			.references(() => workflows.id, { onDelete: "cascade" }),
		templateTaskId: uuid("template_task_id").references(() => taskTemplates.id),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Task details
		title: text("title").notNull(),
		description: text("description"),
		category: text("category").notNull(),
		assigneeId: uuid("assignee_id").references(() => employees.id),

		// Scheduling
		dueDate: date("due_date"),
		estimatedMinutes: integer("estimated_minutes").default(30),

		// Status
		status: text("status").notNull().default("pending"), // pending, in_progress, completed, skipped
		completedAt: timestamp("completed_at"),
		completedBy: uuid("completed_by").references(() => employees.id),
		notes: text("notes"),

		// Requirements
		isRequired: boolean("is_required").default(true).notNull(),
		requiresApproval: boolean("requires_approval").default(false).notNull(),
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("workflow_task_workflow_idx").on(table.workflowId),
		index("workflow_task_assignee_idx").on(table.assigneeId),
		index("workflow_task_status_idx").on(table.status),
		index("workflow_task_due_date_idx").on(table.dueDate),
	]
);

export const workflowTasksRelations = relations(workflowTasks, ({ one }) => ({
	workflow: one(workflows, {
		fields: [workflowTasks.workflowId],
		references: [workflows.id],
	}),
	templateTask: one(taskTemplates, {
		fields: [workflowTasks.templateTaskId],
		references: [taskTemplates.id],
	}),
	organization: one(organizations, {
		fields: [workflowTasks.organizationId],
		references: [organizations.id],
	}),
	assignee: one(employees, {
		fields: [workflowTasks.assigneeId],
		references: [employees.id],
	}),
	completedByEmployee: one(employees, {
		fields: [workflowTasks.completedBy],
		references: [employees.id],
	}),
	approver: one(employees, {
		fields: [workflowTasks.approvedBy],
		references: [employees.id],
	}),
}));

/**
 * Documents - Onboarding/offboarding documents
 */
export const documents = pgTable(
	"document",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		workflowId: uuid("workflow_id").references(() => workflows.id),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Document details
		name: text("name").notNull(),
		type: text("type").notNull(), // contract, handbook, tax_form, policy, nda, etc.
		category: text("category").notNull(), // onboarding, offboarding, general
		description: text("description"),

		// File
		fileUrl: text("file_url"),
		fileName: text("file_name"),
		fileSize: integer("file_size"), // bytes
		mimeType: text("mime_type"),

		// Status
		status: text("status").notNull().default("pending"), // pending, signed, approved, rejected
		signedAt: timestamp("signed_at"),
		signedBy: uuid("signed_by").references(() => employees.id),
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),

		// Metadata
		expiresAt: timestamp("expires_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("document_employee_idx").on(table.employeeId),
		index("document_workflow_idx").on(table.workflowId),
		index("document_organization_idx").on(table.organizationId),
		index("document_type_idx").on(table.type),
		index("document_status_idx").on(table.status),
	]
);

export const documentsRelations = relations(documents, ({ one }) => ({
	employee: one(employees, {
		fields: [documents.employeeId],
		references: [employees.id],
	}),
	workflow: one(workflows, {
		fields: [documents.workflowId],
		references: [workflows.id],
	}),
	organization: one(organizations, {
		fields: [documents.organizationId],
		references: [organizations.id],
	}),
	signer: one(employees, {
		fields: [documents.signedBy],
		references: [employees.id],
	}),
	approver: one(employees, {
		fields: [documents.approvedBy],
		references: [employees.id],
	}),
}));

/**
 * Equipment - Company assets assigned to employees
 */
export const equipment = pgTable(
	"equipment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Equipment details
		name: text("name").notNull(),
		type: text("type").notNull(), // laptop, monitor, phone, desk, chair, etc.
		brand: text("brand"),
		model: text("model"),
		serialNumber: text("serial_number"),
		assetTag: text("asset_tag"),

		// Assignment
		assignedTo: uuid("assigned_to").references(() => employees.id),
		assignedAt: timestamp("assigned_at"),
		returnedAt: timestamp("returned_at"),

		// Status
		status: text("status").notNull().default("available"), // available, assigned, maintenance, retired
		condition: text("condition").default("good"), // excellent, good, fair, poor

		// Value
		purchaseDate: date("purchase_date"),
		purchasePrice: integer("purchase_price"), // cents
		currentValue: integer("current_value"), // cents

		// Notes
		notes: text("notes"),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("equipment_organization_idx").on(table.organizationId),
		index("equipment_assigned_to_idx").on(table.assignedTo),
		index("equipment_status_idx").on(table.status),
		index("equipment_type_idx").on(table.type),
	]
);

export const equipmentRelations = relations(equipment, ({ one }) => ({
	organization: one(organizations, {
		fields: [equipment.organizationId],
		references: [organizations.id],
	}),
	employee: one(employees, {
		fields: [equipment.assignedTo],
		references: [employees.id],
	}),
}));

/**
 * Training Sessions - Employee training records
 */
export const trainingSessions = pgTable(
	"training_session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		workflowId: uuid("workflow_id").references(() => workflows.id),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Training details
		title: text("title").notNull(),
		description: text("description"),
		type: text("type").notNull(), // orientation, compliance, technical, soft_skills
		provider: text("provider"), // Internal, LinkedIn Learning, Udemy, etc.

		// Scheduling
		scheduledDate: date("scheduled_date"),
		completedDate: date("completed_date"),
		durationMinutes: integer("duration_minutes"),

		// Status
		status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
		score: integer("score"), // Percentage (0-100)
		passed: boolean("passed"),
		certificateUrl: text("certificate_url"),

		// Instructor
		instructorId: uuid("instructor_id").references(() => employees.id),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("training_session_employee_idx").on(table.employeeId),
		index("training_session_workflow_idx").on(table.workflowId),
		index("training_session_organization_idx").on(table.organizationId),
		index("training_session_status_idx").on(table.status),
		index("training_session_scheduled_date_idx").on(table.scheduledDate),
	]
);

export const trainingSessionsRelations = relations(
	trainingSessions,
	({ one }) => ({
		employee: one(employees, {
			fields: [trainingSessions.employeeId],
			references: [employees.id],
		}),
		workflow: one(workflows, {
			fields: [trainingSessions.workflowId],
			references: [workflows.id],
		}),
		organization: one(organizations, {
			fields: [trainingSessions.organizationId],
			references: [organizations.id],
		}),
		instructor: one(employees, {
			fields: [trainingSessions.instructorId],
			references: [employees.id],
		}),
	})
);

// Type exports
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type NewWorkflowTemplate = typeof workflowTemplates.$inferInsert;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type NewTaskTemplate = typeof taskTemplates.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type NewWorkflowTask = typeof workflowTasks.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type NewTrainingSession = typeof trainingSessions.$inferInsert;
