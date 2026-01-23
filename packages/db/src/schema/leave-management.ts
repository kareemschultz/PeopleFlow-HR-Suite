import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { employees } from "./employees";
import { organizations } from "./organizations";

/**
 * Leave Types - Different types of leave (vacation, sick, personal, etc.)
 */
export const leaveTypes = pgTable(
	"leave_type",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Type details
		name: text("name").notNull(), // Vacation, Sick Leave, Personal Leave, etc.
		code: text("code").notNull(), // VAC, SICK, PERS, etc.
		description: text("description"),

		// Accrual settings
		isPaid: boolean("is_paid").default(true).notNull(),
		accrualRate: real("accrual_rate").default(0), // Days per month
		maxAccrual: real("max_accrual"), // Maximum days that can be accrued
		carryOverDays: real("carry_over_days").default(0), // Days that carry to next year

		// Usage rules
		minNotice: integer("min_notice").default(0), // Days notice required
		maxConsecutive: integer("max_consecutive"), // Max consecutive days allowed
		requiresApproval: boolean("requires_approval").default(true).notNull(),
		requiresDocumentation: boolean("requires_documentation")
			.default(false)
			.notNull(),

		// Availability
		isActive: boolean("is_active").default(true).notNull(),
		defaultForNewEmployees: boolean("default_for_new_employees")
			.default(false)
			.notNull(),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("leave_type_organization_idx").on(table.organizationId),
		index("leave_type_code_idx").on(table.code),
		index("leave_type_active_idx").on(table.isActive),
	]
);

export const leaveTypesRelations = relations(leaveTypes, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [leaveTypes.organizationId],
		references: [organizations.id],
	}),
	policies: many(leavePolicies),
	requests: many(leaveRequests),
}));

/**
 * Leave Policies - Policies for each leave type (eligibility, accrual rules)
 */
export const leavePolicies = pgTable(
	"leave_policy",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		leaveTypeId: uuid("leave_type_id")
			.notNull()
			.references(() => leaveTypes.id, { onDelete: "cascade" }),

		// Policy details
		name: text("name").notNull(),
		description: text("description"),

		// Eligibility
		eligibilityMonths: integer("eligibility_months").default(0), // Months employed before eligible
		minTenureMonths: integer("min_tenure_months").default(0), // Min employment duration

		// Accrual override (if different from leave type)
		customAccrualRate: real("custom_accrual_rate"),
		customMaxAccrual: real("custom_max_accrual"),
		customCarryOver: real("custom_carry_over"),

		// Initial balance
		initialBalance: real("initial_balance").default(0), // Starting days for new employees

		// Settings
		isActive: boolean("is_active").default(true).notNull(),
		priority: integer("priority").default(0), // Order of precedence

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("leave_policy_organization_idx").on(table.organizationId),
		index("leave_policy_leave_type_idx").on(table.leaveTypeId),
		index("leave_policy_active_idx").on(table.isActive),
	]
);

export const leavePoliciesRelations = relations(
	leavePolicies,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [leavePolicies.organizationId],
			references: [organizations.id],
		}),
		leaveType: one(leaveTypes, {
			fields: [leavePolicies.leaveTypeId],
			references: [leaveTypes.id],
		}),
		assignments: many(leavePolicyAssignments),
	})
);

/**
 * Leave Policy Assignments - Assign policies to employees
 */
export const leavePolicyAssignments = pgTable(
	"leave_policy_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		policyId: uuid("policy_id")
			.notNull()
			.references(() => leavePolicies.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Assignment details
		effectiveDate: date("effective_date").notNull(),
		endDate: date("end_date"), // Null = indefinite

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("leave_policy_assignment_employee_idx").on(table.employeeId),
		index("leave_policy_assignment_policy_idx").on(table.policyId),
		index("leave_policy_assignment_organization_idx").on(table.organizationId),
	]
);

export const leavePolicyAssignmentsRelations = relations(
	leavePolicyAssignments,
	({ one }) => ({
		employee: one(employees, {
			fields: [leavePolicyAssignments.employeeId],
			references: [employees.id],
		}),
		policy: one(leavePolicies, {
			fields: [leavePolicyAssignments.policyId],
			references: [leavePolicies.id],
		}),
		organization: one(organizations, {
			fields: [leavePolicyAssignments.organizationId],
			references: [organizations.id],
		}),
	})
);

/**
 * Leave Balances - Track employee leave balances
 */
export const leaveBalances = pgTable(
	"leave_balance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		leaveTypeId: uuid("leave_type_id")
			.notNull()
			.references(() => leaveTypes.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Balance details
		year: integer("year").notNull(),
		totalEntitled: real("total_entitled").default(0).notNull(), // Total days entitled
		used: real("used").default(0).notNull(), // Days used
		pending: real("pending").default(0).notNull(), // Days in pending requests
		available: real("available").default(0).notNull(), // Available days (entitled - used - pending)
		carriedOver: real("carried_over").default(0).notNull(), // Days from previous year

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("leave_balance_employee_idx").on(table.employeeId),
		index("leave_balance_leave_type_idx").on(table.leaveTypeId),
		index("leave_balance_organization_idx").on(table.organizationId),
		index("leave_balance_year_idx").on(table.year),
	]
);

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
	employee: one(employees, {
		fields: [leaveBalances.employeeId],
		references: [employees.id],
	}),
	leaveType: one(leaveTypes, {
		fields: [leaveBalances.leaveTypeId],
		references: [leaveTypes.id],
	}),
	organization: one(organizations, {
		fields: [leaveBalances.organizationId],
		references: [organizations.id],
	}),
}));

/**
 * Leave Requests - Employee leave applications
 */
export const leaveRequests = pgTable(
	"leave_request",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		leaveTypeId: uuid("leave_type_id")
			.notNull()
			.references(() => leaveTypes.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Request details
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		totalDays: real("total_days").notNull(), // Calculated working days
		reason: text("reason"),
		attachmentUrl: text("attachment_url"), // Supporting document URL

		// Approval workflow
		status: text("status").notNull().default("pending"), // pending, approved, rejected, cancelled
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),
		rejectionReason: text("rejection_reason"),

		// Emergency contact (if applicable)
		emergencyContact: text("emergency_contact"),
		emergencyPhone: text("emergency_phone"),

		// Metadata
		submittedAt: timestamp("submitted_at").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("leave_request_employee_idx").on(table.employeeId),
		index("leave_request_leave_type_idx").on(table.leaveTypeId),
		index("leave_request_organization_idx").on(table.organizationId),
		index("leave_request_status_idx").on(table.status),
		index("leave_request_dates_idx").on(table.startDate, table.endDate),
	]
);

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
	employee: one(employees, {
		fields: [leaveRequests.employeeId],
		references: [employees.id],
	}),
	leaveType: one(leaveTypes, {
		fields: [leaveRequests.leaveTypeId],
		references: [leaveTypes.id],
	}),
	organization: one(organizations, {
		fields: [leaveRequests.organizationId],
		references: [organizations.id],
	}),
	approver: one(employees, {
		fields: [leaveRequests.approvedBy],
		references: [employees.id],
	}),
}));

/**
 * Holidays - Organization-wide holidays
 */
export const holidays = pgTable(
	"holiday",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Holiday details
		name: text("name").notNull(), // e.g., "New Year's Day"
		date: date("date").notNull(),
		isRecurring: boolean("is_recurring").default(false).notNull(), // Annual holiday
		isPaid: boolean("is_paid").default(true).notNull(),

		// Optional
		description: text("description"),
		isActive: boolean("is_active").default(true).notNull(),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("holiday_organization_idx").on(table.organizationId),
		index("holiday_date_idx").on(table.date),
		index("holiday_active_idx").on(table.isActive),
	]
);

export const holidaysRelations = relations(holidays, ({ one }) => ({
	organization: one(organizations, {
		fields: [holidays.organizationId],
		references: [organizations.id],
	}),
}));

// Type exports
export type LeaveType = typeof leaveTypes.$inferSelect;
export type NewLeaveType = typeof leaveTypes.$inferInsert;
export type LeavePolicy = typeof leavePolicies.$inferSelect;
export type NewLeavePolicy = typeof leavePolicies.$inferInsert;
export type LeavePolicyAssignment = typeof leavePolicyAssignments.$inferSelect;
export type NewLeavePolicyAssignment =
	typeof leavePolicyAssignments.$inferInsert;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
