import { relations } from "drizzle-orm";
import {
	boolean,
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
// DEPARTMENTS - Organizational Units
// ============================================================================

/**
 * Departments table - organizational units within a company.
 * Used for grouping employees and managing hierarchical structure.
 */
export const departments = pgTable(
	"departments",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Relationships
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Identity
		name: text("name").notNull(),
		code: text("code").notNull(), // Short code like "HR", "IT", "FIN"
		description: text("description"),

		// Hierarchy
		parentDepartmentId: uuid("parent_department_id"), // Self-referencing FK for sub-departments
		// Note: Self-reference will be added in relations

		// Department head
		headEmployeeId: uuid("head_employee_id"), // FK to employees (soft reference, actual FK added after employees table created)

		// Settings
		settings: jsonb("settings").$type<{
			// Budget settings
			annualBudget?: number;
			budgetCurrency?: string;

			// Approval workflows
			requiresApprovalForLeave?: boolean;
			requiresApprovalForExpenses?: boolean;

			// Notifications
			notifyHeadOnNewEmployee?: boolean;
		}>(),

		// Location
		location: text("location"), // Office location, building, floor, etc.

		// Status
		isActive: boolean("is_active").notNull().default(true),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("departments_org_id_idx").on(table.organizationId),
		index("departments_parent_id_idx").on(table.parentDepartmentId),
	]
);

// ============================================================================
// POSITIONS - Job Roles/Titles
// ============================================================================

/**
 * Positions table - job roles/titles within departments.
 * Defines the role, responsibilities, and requirements for a position.
 */
export const positions = pgTable(
	"positions",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Relationships
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		departmentId: uuid("department_id")
			.notNull()
			.references(() => departments.id, { onDelete: "cascade" }),

		// Identity
		title: text("title").notNull(), // e.g., "Senior Software Engineer"
		code: text("code").notNull(), // Short code like "SSE-01"
		description: text("description"),

		// Job details
		level: text("level"), // e.g., "Junior", "Mid", "Senior", "Lead"
		grade: text("grade"), // Organizational grade/band (e.g., "L3", "E4")

		// Compensation
		minSalary: integer("min_salary"), // Salary range minimum (in cents)
		maxSalary: integer("max_salary"), // Salary range maximum (in cents)
		salaryCurrency: text("salary_currency").default("GYD"),

		// Requirements
		requirements: jsonb("requirements").$type<{
			// Education
			minimumEducation?: string;
			preferredEducation?: string;

			// Experience
			minimumExperience?: number; // years
			preferredExperience?: number;

			// Skills
			requiredSkills?: string[];
			preferredSkills?: string[];

			// Certifications
			requiredCertifications?: string[];
			preferredCertifications?: string[];
		}>(),

		// Responsibilities
		responsibilities: jsonb("responsibilities").$type<string[]>(),

		// Settings
		settings: jsonb("settings").$type<{
			// Headcount
			targetHeadcount?: number;
			maxHeadcount?: number;

			// Work arrangements
			allowsRemote?: boolean;
			allowsFlexibleHours?: boolean;

			// Approvals
			requiresBackgroundCheck?: boolean;
		}>(),

		// Status
		isActive: boolean("is_active").notNull().default(true),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("positions_org_id_idx").on(table.organizationId),
		index("positions_dept_id_idx").on(table.departmentId),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const departmentsRelations = relations(departments, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [departments.organizationId],
		references: [organizations.id],
	}),
	parentDepartment: one(departments, {
		fields: [departments.parentDepartmentId],
		references: [departments.id],
		relationName: "subDepartments",
	}),
	subDepartments: many(departments, {
		relationName: "subDepartments",
	}),
	positions: many(positions),
	// Future: employees: many(employees),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
	organization: one(organizations, {
		fields: [positions.organizationId],
		references: [organizations.id],
	}),
	department: one(departments, {
		fields: [positions.departmentId],
		references: [departments.id],
	}),
	// Future: employees: many(employees),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;

// Helper types for settings
export type DepartmentSettings = NonNullable<Department["settings"]>;
export type PositionRequirements = NonNullable<Position["requirements"]>;
export type PositionSettings = NonNullable<Position["settings"]>;
