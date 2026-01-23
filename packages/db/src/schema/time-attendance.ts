import { relations } from "drizzle-orm";
import {
	boolean,
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
 * Biometric Devices - Fingerprint scanners, card readers, etc.
 */
export const biometricDevices = pgTable(
	"biometric_device",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Device info
		deviceName: text("device_name").notNull(),
		deviceType: text("device_type").notNull(), // fingerprint, rfid, qr_scanner, face_recognition
		deviceId: text("device_id").notNull().unique(), // Unique hardware ID
		apiKey: text("api_key"), // For device authentication

		// Location
		locationName: text("location_name"), // e.g., "Main Office Entrance"
		latitude: real("latitude"),
		longitude: real("longitude"),

		// Settings
		isActive: boolean("is_active").default(true).notNull(),
		allowClockIn: boolean("allow_clock_in").default(true).notNull(),
		allowClockOut: boolean("allow_clock_out").default(true).notNull(),

		// Metadata
		lastSeen: timestamp("last_seen"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("biometric_device_organization_idx").on(table.organizationId),
		index("biometric_device_type_idx").on(table.deviceType),
		index("biometric_device_active_idx").on(table.isActive),
	]
);

export const biometricDevicesRelations = relations(
	biometricDevices,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [biometricDevices.organizationId],
			references: [organizations.id],
		}),
		enrollments: many(biometricEnrollments),
	})
);

/**
 * Biometric Enrollments - Employee fingerprint/card/QR registrations
 */
export const biometricEnrollments = pgTable(
	"biometric_enrollment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		deviceId: uuid("device_id")
			.notNull()
			.references(() => biometricDevices.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Enrollment data
		enrollmentType: text("enrollment_type").notNull(), // fingerprint, rfid_card, qr_code, face
		enrollmentData: text("enrollment_data").notNull(), // Hashed fingerprint template, RFID ID, QR code
		alternativeId: text("alternative_id"), // Employee badge number, card number

		// Status
		isActive: boolean("is_active").default(true).notNull(),
		enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
		lastUsed: timestamp("last_used"),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("biometric_enrollment_employee_idx").on(table.employeeId),
		index("biometric_enrollment_device_idx").on(table.deviceId),
		index("biometric_enrollment_organization_idx").on(table.organizationId),
		index("biometric_enrollment_type_idx").on(table.enrollmentType),
	]
);

export const biometricEnrollmentsRelations = relations(
	biometricEnrollments,
	({ one }) => ({
		employee: one(employees, {
			fields: [biometricEnrollments.employeeId],
			references: [employees.id],
		}),
		device: one(biometricDevices, {
			fields: [biometricEnrollments.deviceId],
			references: [biometricDevices.id],
		}),
		organization: one(organizations, {
			fields: [biometricEnrollments.organizationId],
			references: [organizations.id],
		}),
	})
);

/**
 * Time Entries - Clock in/out records
 */
export const timeEntries = pgTable(
	"time_entry",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Time tracking
		clockIn: timestamp("clock_in").notNull(),
		clockOut: timestamp("clock_out"),
		breakDuration: integer("break_duration").default(0), // Minutes
		totalHours: real("total_hours"), // Calculated: (clockOut - clockIn - breaks) in hours

		// Entry type
		entryType: text("entry_type").notNull().default("regular"), // regular, overtime, holiday
		status: text("status").notNull().default("pending"), // pending, approved, rejected

		// Clock-in method & device
		clockInMethod: text("clock_in_method").notNull().default("web"), // web, mobile, fingerprint, rfid, qr_code, face
		clockOutMethod: text("clock_out_method"), // Same options as clockInMethod
		deviceId: uuid("device_id").references(() => biometricDevices.id), // If using biometric device

		// Location tracking (optional geofencing)
		clockInLatitude: real("clock_in_latitude"),
		clockInLongitude: real("clock_in_longitude"),
		clockOutLatitude: real("clock_out_latitude"),
		clockOutLongitude: real("clock_out_longitude"),
		clockInLocation: text("clock_in_location"), // Address or location name

		// Notes and approval
		notes: text("notes"),
		approvedBy: uuid("approved_by").references(() => employees.id),
		approvedAt: timestamp("approved_at"),
		rejectionReason: text("rejection_reason"),

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("time_entry_employee_idx").on(table.employeeId),
		index("time_entry_organization_idx").on(table.organizationId),
		index("time_entry_clock_in_idx").on(table.clockIn),
		index("time_entry_status_idx").on(table.status),
		index("time_entry_device_idx").on(table.deviceId),
	]
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
	employee: one(employees, {
		fields: [timeEntries.employeeId],
		references: [employees.id],
	}),
	organization: one(organizations, {
		fields: [timeEntries.organizationId],
		references: [organizations.id],
	}),
	approver: one(employees, {
		fields: [timeEntries.approvedBy],
		references: [employees.id],
	}),
	device: one(biometricDevices, {
		fields: [timeEntries.deviceId],
		references: [biometricDevices.id],
	}),
}));

/**
 * Shifts - Shift definitions
 */
export const shifts = pgTable(
	"shift",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Shift details
		name: text("name").notNull(), // e.g., "Morning Shift", "Night Shift"
		startTime: text("start_time").notNull(), // HH:MM format
		endTime: text("end_time").notNull(), // HH:MM format
		daysOfWeek: text("days_of_week").notNull(), // Comma-separated: "1,2,3,4,5" (Monday-Friday)

		// Shift settings
		isActive: boolean("is_active").default(true).notNull(),
		allowEarlyClockIn: boolean("allow_early_clock_in").default(false).notNull(), // Minutes before shift start
		allowLateClockOut: boolean("allow_late_clock_out").default(false).notNull(), // Minutes after shift end
		earlyClockInMinutes: integer("early_clock_in_minutes").default(0),
		lateClockOutMinutes: integer("late_clock_out_minutes").default(0),

		// Grace periods
		lateGracePeriod: integer("late_grace_period").default(0), // Minutes
		earlyLeaveGracePeriod: integer("early_leave_grace_period").default(0), // Minutes

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("shift_organization_idx").on(table.organizationId),
		index("shift_active_idx").on(table.isActive),
	]
);

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [shifts.organizationId],
		references: [organizations.id],
	}),
	assignments: many(shiftAssignments),
}));

/**
 * Shift Assignments - Assigning shifts to employees
 */
export const shiftAssignments = pgTable(
	"shift_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		shiftId: uuid("shift_id")
			.notNull()
			.references(() => shifts.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Assignment period
		startDate: timestamp("start_date").notNull(),
		endDate: timestamp("end_date"), // Null = indefinite

		// Metadata
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("shift_assignment_employee_idx").on(table.employeeId),
		index("shift_assignment_shift_idx").on(table.shiftId),
		index("shift_assignment_organization_idx").on(table.organizationId),
		index("shift_assignment_dates_idx").on(table.startDate, table.endDate),
	]
);

export const shiftAssignmentsRelations = relations(
	shiftAssignments,
	({ one }) => ({
		employee: one(employees, {
			fields: [shiftAssignments.employeeId],
			references: [employees.id],
		}),
		shift: one(shifts, {
			fields: [shiftAssignments.shiftId],
			references: [shifts.id],
		}),
		organization: one(organizations, {
			fields: [shiftAssignments.organizationId],
			references: [organizations.id],
		}),
	})
);

/**
 * Timesheets - Aggregated time entries by period
 */
export const timesheets = pgTable(
	"timesheet",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Period
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),

		// Totals
		totalRegularHours: real("total_regular_hours").default(0).notNull(),
		totalOvertimeHours: real("total_overtime_hours").default(0).notNull(),
		totalHolidayHours: real("total_holiday_hours").default(0).notNull(),

		// Status
		status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
		submittedAt: timestamp("submitted_at"),
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
		index("timesheet_employee_idx").on(table.employeeId),
		index("timesheet_organization_idx").on(table.organizationId),
		index("timesheet_period_idx").on(table.periodStart, table.periodEnd),
		index("timesheet_status_idx").on(table.status),
	]
);

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
	employee: one(employees, {
		fields: [timesheets.employeeId],
		references: [employees.id],
	}),
	organization: one(organizations, {
		fields: [timesheets.organizationId],
		references: [organizations.id],
	}),
	approver: one(employees, {
		fields: [timesheets.approvedBy],
		references: [employees.id],
	}),
}));

// Type exports
export type BiometricDevice = typeof biometricDevices.$inferSelect;
export type NewBiometricDevice = typeof biometricDevices.$inferInsert;
export type BiometricEnrollment = typeof biometricEnrollments.$inferSelect;
export type NewBiometricEnrollment = typeof biometricEnrollments.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type NewShiftAssignment = typeof shiftAssignments.$inferInsert;
export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
