import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// ============================================================================
// ORGANIZATIONS - Multi-tenancy Foundation
// ============================================================================

/**
 * Organizations table - the core tenant entity for multi-tenancy.
 * Each organization represents a company using the HR system.
 */
export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Identity
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(), // URL-friendly identifier
	description: text("description"),

	// Branding
	logo: text("logo"), // URL or path to logo
	primaryColor: text("primary_color").default("#000000"),

	// Tax & Compliance
	jurisdictionId: uuid("jurisdiction_id"), // FK to taxJurisdictions (will be created in Phase 3)
	// Note: jurisdictionId references tax_jurisdictions.id, but we define that table later
	// This creates a soft reference - the actual FK constraint will be added when we create the tax_jurisdictions table

	// Regional settings
	timezone: text("timezone").notNull().default("America/Guyana"),
	currency: text("currency").notNull().default("GYD"),
	currencySymbol: text("currency_symbol").notNull().default("G$"),
	fiscalYearStart: integer("fiscal_year_start").notNull().default(1), // Month (1-12)

	// Organization settings
	settings: jsonb("settings").$type<{
		// Payroll settings
		payrollFrequency?: "weekly" | "biweekly" | "monthly" | "semimonthly";
		payrollDayOfMonth?: number;
		overtimeMultiplier?: number;

		// Leave settings
		annualLeaveDays?: number;
		sickLeaveDays?: number;
		carryoverAllowed?: boolean;

		// Approval workflows
		requiresPayrollApproval?: boolean;
		requiresLeaveApproval?: boolean;

		// Notifications
		notifyOnPayrollRun?: boolean;
		notifyOnLeaveRequest?: boolean;
	}>(),

	// Status
	isActive: boolean("is_active").notNull().default(true),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// ORGANIZATION MEMBERS - User-Organization Association
// ============================================================================

/**
 * Organization members - links users to organizations with specific roles.
 * This enables multi-tenancy and role-based access control.
 */
export const organizationMembers = pgTable("organization_members", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Relationships
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// Role & Permissions
	role: text("role").notNull().default("member"),
	// Roles: "owner", "admin", "hr_manager", "payroll_manager", "manager", "member"

	// Scope-based permissions (for future permission system)
	permissions: jsonb("permissions").$type<{
		// Data access scope
		scope?: {
			type: "all" | "department" | "employees";
			departmentIds?: string[];
			employeeIds?: string[];
		};

		// Feature permissions
		canManageOrganization?: boolean;
		canManageEmployees?: boolean;
		canManageDepartments?: boolean;
		canManagePayroll?: boolean;
		canViewReports?: boolean;
		canApproveLeave?: boolean;
		canApprovePayroll?: boolean;
	}>(),

	// Status
	isActive: boolean("is_active").notNull().default(true),
	joinedAt: timestamp("joined_at").notNull().defaultNow(),
	leftAt: timestamp("left_at"),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
	members: many(organizationMembers),
	// Future relations will be added here:
	// departments: many(departments),
	// employees: many(employees),
	// payrollRuns: many(payrollRuns),
}));

export const organizationMembersRelations = relations(
	organizationMembers,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationMembers.organizationId],
			references: [organizations.id],
		}),
		user: one(user, {
			fields: [organizationMembers.userId],
			references: [user.id],
		}),
	})
);

// ============================================================================
// TYPES
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

// Organization role type
export type OrganizationRole =
	| "owner"
	| "admin"
	| "hr_manager"
	| "payroll_manager"
	| "manager"
	| "member";

// Helper types for settings
export type OrganizationSettings = NonNullable<Organization["settings"]>;
export type MemberPermissions = NonNullable<OrganizationMember["permissions"]>;
