import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { departments, positions } from "./departments";
import { organizations } from "./organizations";

// ============================================================================
// EMPLOYEES - Core HR Entity
// ============================================================================

/**
 * Employees table - the primary entity for all employee data.
 * Contains personal information, employment details, and compensation data.
 */
export const employees = pgTable(
	"employees",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Relationships
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		departmentId: uuid("department_id")
			.notNull()
			.references(() => departments.id, { onDelete: "restrict" }),
		positionId: uuid("position_id")
			.notNull()
			.references(() => positions.id, { onDelete: "restrict" }),

		// User account (optional - for employees with system access)
		userId: text("user_id"), // FK to user table (soft reference)

		// Manager relationship (self-referencing)
		managerId: uuid("manager_id"), // FK to employees
		// Note: Self-reference will be added in relations

		// ============================================================================
		// PERSONAL INFORMATION
		// ============================================================================

		// Name
		firstName: text("first_name").notNull(),
		middleName: text("middle_name"),
		lastName: text("last_name").notNull(),
		preferredName: text("preferred_name"),

		// Contact
		email: text("email").notNull(),
		phone: text("phone"),
		emergencyContact: jsonb("emergency_contact").$type<{
			name: string;
			relationship: string;
			phone: string;
			email?: string;
		}>(),

		// Demographics
		dateOfBirth: date("date_of_birth"),
		gender: text("gender"), // "male", "female", "other", "prefer_not_to_say"
		nationality: text("nationality"),

		// Address
		address: jsonb("address").$type<{
			street?: string;
			city?: string;
			region?: string; // State/Province
			postalCode?: string;
			country?: string;
		}>(),

		// ============================================================================
		// IDENTIFICATION & COMPLIANCE
		// ============================================================================

		// Employee identifiers
		employeeNumber: text("employee_number").notNull().unique(),
		taxId: text("tax_id"), // TIN (Tax Identification Number)
		nisNumber: text("nis_number"), // NIS Number (Social Security equivalent)
		passportNumber: text("passport_number"),
		nationalIdNumber: text("national_id_number"),

		// ============================================================================
		// EMPLOYMENT DETAILS
		// ============================================================================

		// Dates
		hireDate: date("hire_date").notNull(),
		startDate: date("start_date").notNull(), // Actual start date (may differ from hire date)
		probationEndDate: date("probation_end_date"),
		terminationDate: date("termination_date"),
		terminationReason: text("termination_reason"),

		// Employment type
		employmentType: text("employment_type").notNull().default("full_time"),
		// "full_time", "part_time", "contract", "temporary", "intern"

		employmentStatus: text("employment_status").notNull().default("active"),
		// "active", "on_leave", "suspended", "terminated", "retired"

		// Work schedule
		workSchedule: jsonb("work_schedule").$type<{
			hoursPerWeek?: number;
			daysPerWeek?: number;
			shiftType?: "day" | "night" | "rotating";
			workFromHome?: boolean;
		}>(),

		// ============================================================================
		// COMPENSATION
		// ============================================================================

		// Base salary
		baseSalary: integer("base_salary").notNull(), // In cents
		salaryCurrency: text("salary_currency").notNull().default("GYD"),
		salaryFrequency: text("salary_frequency").notNull().default("monthly"),
		// "monthly", "biweekly", "weekly", "annual"

		// Pay components
		allowances:
			jsonb("allowances").$type<
				{
					code: string; // "TRANSPORT", "HOUSING", "MEAL"
					name: string;
					amount: number; // In cents
					frequency: "monthly" | "per_payroll" | "annual";
					isTaxable: boolean;
				}[]
			>(),

		deductions:
			jsonb("deductions").$type<
				{
					code: string; // "UNION_DUES", "LOAN_REPAYMENT"
					name: string;
					amount: number; // In cents
					frequency: "monthly" | "per_payroll" | "annual";
				}[]
			>(),

		// Bank details
		bankDetails: jsonb("bank_details").$type<{
			bankName?: string;
			accountNumber?: string;
			accountType?: "checking" | "savings";
			routingNumber?: string;
			swiftCode?: string;
		}>(),

		// ============================================================================
		// LEAVE & ATTENDANCE
		// ============================================================================

		// Leave balances (in days)
		annualLeaveBalance: integer("annual_leave_balance").default(0),
		sickLeaveBalance: integer("sick_leave_balance").default(0),
		otherLeaveBalance: integer("other_leave_balance").default(0),

		// Attendance settings
		attendanceSettings: jsonb("attendance_settings").$type<{
			requiresClockIn?: boolean;
			allowsRemoteClockIn?: boolean;
			trackGPS?: boolean;
		}>(),

		// ============================================================================
		// TAX & COMPLIANCE OVERRIDES
		// ============================================================================

		// Tax settings (overrides jurisdiction defaults)
		taxSettings: jsonb("tax_settings").$type<{
			// PAYE overrides
			payeExempt?: boolean;
			customTaxRate?: number;
			additionalDeduction?: number;

			// NIS overrides
			nisExempt?: boolean;
			customNisRate?: number;

			// Dependents
			numberOfDependents?: number;
		}>(),

		// ============================================================================
		// DOCUMENTS & NOTES
		// ============================================================================

		documents:
			jsonb("documents").$type<
				{
					id: string;
					type: string; // "contract", "id", "certificate", etc.
					name: string;
					url: string;
					uploadedAt: string;
				}[]
			>(),

		notes: text("notes"),

		// ============================================================================
		// METADATA
		// ============================================================================

		// Profile
		avatar: text("avatar"), // URL or path to profile photo

		// Custom fields
		customFields: jsonb("custom_fields").$type<Record<string, unknown>>(),

		// Status
		isActive: boolean("is_active").notNull().default(true),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: uuid("created_by"), // FK to employees (who created this record)
		updatedBy: uuid("updated_by"), // FK to employees (who last updated)
	},
	(table) => [
		index("employees_org_id_idx").on(table.organizationId),
		index("employees_dept_id_idx").on(table.departmentId),
		index("employees_position_id_idx").on(table.positionId),
		index("employees_manager_id_idx").on(table.managerId),
		index("employees_email_idx").on(table.email),
		index("employees_employee_number_idx").on(table.employeeNumber),
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const employeesRelations = relations(employees, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [employees.organizationId],
		references: [organizations.id],
	}),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id],
	}),
	position: one(positions, {
		fields: [employees.positionId],
		references: [positions.id],
	}),
	manager: one(employees, {
		fields: [employees.managerId],
		references: [employees.id],
		relationName: "directReports",
	}),
	directReports: many(employees, {
		relationName: "directReports",
	}),
	// Future relations:
	// payslips: many(payslips),
	// leaveRequests: many(leaveRequests),
	// attendanceRecords: many(attendanceRecords),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

// Helper types for JSONB fields
export type EmergencyContact = NonNullable<Employee["emergencyContact"]>;
export type Address = NonNullable<Employee["address"]>;
export type WorkSchedule = NonNullable<Employee["workSchedule"]>;
export type Allowance = NonNullable<Employee["allowances"]>[number];
export type Deduction = NonNullable<Employee["deductions"]>[number];
export type BankDetails = NonNullable<Employee["bankDetails"]>;
export type AttendanceSettings = NonNullable<Employee["attendanceSettings"]>;
export type TaxSettings = NonNullable<Employee["taxSettings"]>;
export type EmployeeDocument = NonNullable<Employee["documents"]>[number];

// Employment status enum
export type EmploymentStatus =
	| "active"
	| "on_leave"
	| "suspended"
	| "terminated"
	| "retired";

export type EmploymentType =
	| "full_time"
	| "part_time"
	| "contract"
	| "temporary"
	| "intern";
