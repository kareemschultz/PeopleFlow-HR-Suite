import {
	biometricDevices,
	biometricEnrollments,
	db,
	type NewBiometricDevice,
	type NewBiometricEnrollment,
	type NewShift,
	type NewShiftAssignment,
	type NewTimeEntry,
	type NewTimesheet,
	shiftAssignments,
	shifts,
	timeEntries,
	timesheets,
} from "@PeopleFlow-HR-Suite/db";
import { and, between, desc, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { authedProcedure } from "..";

// ============================================================================
// BIOMETRIC DEVICE MANAGEMENT
// ============================================================================

/**
 * Register Biometric Device
 * Registers a new fingerprint scanner, RFID reader, or QR scanner
 */
export const registerDevice = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			deviceName: z.string().min(1),
			deviceType: z.enum([
				"fingerprint",
				"rfid",
				"qr_scanner",
				"face_recognition",
			]),
			deviceId: z.string().min(1), // Unique hardware ID
			apiKey: z.string().optional(),
			locationName: z.string().optional(),
			latitude: z.number().optional(),
			longitude: z.number().optional(),
		})
	)
	.handler(async ({ input }) => {
		const newDevice: NewBiometricDevice = {
			organizationId: input.organizationId,
			deviceName: input.deviceName,
			deviceType: input.deviceType,
			deviceId: input.deviceId,
			apiKey: input.apiKey || null,
			locationName: input.locationName || null,
			latitude: input.latitude || null,
			longitude: input.longitude || null,
			isActive: true,
		};

		const [device] = await db
			.insert(biometricDevices)
			.values(newDevice)
			.returning();

		return device;
	});

/**
 * List Biometric Devices
 * Returns all devices for an organization
 */
export const listDevices = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			isActive: z.boolean().optional(),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [
			eq(biometricDevices.organizationId, input.organizationId),
		];

		if (input.isActive !== undefined) {
			conditions.push(eq(biometricDevices.isActive, input.isActive));
		}

		const devices = await db.query.biometricDevices.findMany({
			where: and(...conditions),
			orderBy: [biometricDevices.deviceName],
		});

		return devices;
	});

/**
 * Enroll Employee Biometric
 * Register employee fingerprint/RFID/QR code for a device
 */
export const enrollBiometric = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			deviceId: z.string().uuid(),
			organizationId: z.string().uuid(),
			enrollmentType: z.enum(["fingerprint", "rfid_card", "qr_code", "face"]),
			enrollmentData: z.string().min(1), // Hashed template or ID
			alternativeId: z.string().optional(), // Badge number
		})
	)
	.handler(async ({ input }) => {
		const enrollment: NewBiometricEnrollment = {
			employeeId: input.employeeId,
			deviceId: input.deviceId,
			organizationId: input.organizationId,
			enrollmentType: input.enrollmentType,
			enrollmentData: input.enrollmentData,
			alternativeId: input.alternativeId || null,
			isActive: true,
		};

		const [result] = await db
			.insert(biometricEnrollments)
			.values(enrollment)
			.returning();

		return result;
	});

/**
 * Get Employee Enrollments
 * Returns all biometric enrollments for an employee
 */
export const getEmployeeEnrollments = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const enrollments = await db.query.biometricEnrollments.findMany({
			where: eq(biometricEnrollments.employeeId, input.employeeId),
			with: {
				device: true,
			},
		});

		return enrollments;
	});

/**
 * Biometric Clock In
 * Clock in using biometric device (fingerprint/RFID/QR)
 */
export const biometricClockIn = authedProcedure
	.input(
		z.object({
			deviceId: z.string().uuid(),
			enrollmentData: z.string().min(1), // Scanned fingerprint/RFID/QR
			latitude: z.number().optional(),
			longitude: z.number().optional(),
			location: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		// Find enrollment by device and scanned data
		const enrollment = await db.query.biometricEnrollments.findFirst({
			where: and(
				eq(biometricEnrollments.deviceId, input.deviceId),
				eq(biometricEnrollments.enrollmentData, input.enrollmentData),
				eq(biometricEnrollments.isActive, true)
			),
			with: {
				employee: true,
				device: true,
			},
		});

		if (!enrollment) {
			throw new Error("Biometric enrollment not found");
		}

		// Check if employee already clocked in
		const existingEntry = await db.query.timeEntries.findFirst({
			where: and(
				eq(timeEntries.employeeId, enrollment.employeeId),
				// biome-ignore lint/suspicious/noExplicitAny: Drizzle query requires null as any for nullable comparisons
				eq(timeEntries.clockOut, null as any)
			),
		});

		if (existingEntry) {
			throw new Error("Employee is already clocked in");
		}

		// Update device last seen
		await db
			.update(biometricDevices)
			.set({ lastSeen: new Date() })
			.where(eq(biometricDevices.id, input.deviceId));

		// Update enrollment last used
		await db
			.update(biometricEnrollments)
			.set({ lastUsed: new Date() })
			.where(eq(biometricEnrollments.id, enrollment.id));

		// Create time entry
		const newEntry: NewTimeEntry = {
			employeeId: enrollment.employeeId,
			organizationId: enrollment.organizationId,
			clockIn: new Date(),
			clockInLatitude: input.latitude || enrollment.device.latitude,
			clockInLongitude: input.longitude || enrollment.device.longitude,
			clockInLocation: input.location || enrollment.device.locationName,
			clockInMethod: enrollment.enrollmentType,
			deviceId: input.deviceId,
			entryType: "regular",
			status: "pending",
		};

		const [entry] = await db.insert(timeEntries).values(newEntry).returning();

		return {
			...entry,
			employee: enrollment.employee,
		};
	});

// ============================================================================
// STANDARD CLOCK IN/OUT (WEB/MOBILE)
// ============================================================================

/**
 * Clock In
 * Records employee clock-in time with optional location (web/mobile)
 */
export const clockIn = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			organizationId: z.string().uuid(),
			latitude: z.number().optional(),
			longitude: z.number().optional(),
			location: z.string().optional(),
			notes: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		// Check if employee already clocked in
		const existingEntry = await db.query.timeEntries.findFirst({
			where: and(
				eq(timeEntries.employeeId, input.employeeId),
				// biome-ignore lint/suspicious/noExplicitAny: Drizzle query requires null as any for nullable comparisons
				eq(timeEntries.clockOut, null as any)
			),
		});

		if (existingEntry) {
			throw new Error("Employee is already clocked in");
		}

		const newEntry: NewTimeEntry = {
			employeeId: input.employeeId,
			organizationId: input.organizationId,
			clockIn: new Date(),
			clockInLatitude: input.latitude,
			clockInLongitude: input.longitude,
			clockInLocation: input.location,
			notes: input.notes,
			entryType: "regular",
			status: "pending",
		};

		const [entry] = await db.insert(timeEntries).values(newEntry).returning();

		return entry;
	});

/**
 * Clock Out
 * Records employee clock-out time and calculates total hours (web/mobile)
 */
export const clockOut = authedProcedure
	.input(
		z.object({
			entryId: z.string().uuid(),
			latitude: z.number().optional(),
			longitude: z.number().optional(),
			breakDuration: z.number().default(0), // Minutes
			notes: z.string().optional(),
			method: z
				.enum(["web", "mobile", "fingerprint", "rfid", "qr_code", "face"])
				.default("web"),
		})
	)
	.handler(async ({ input }) => {
		// Get existing entry
		const entry = await db.query.timeEntries.findFirst({
			where: eq(timeEntries.id, input.entryId),
		});

		if (!entry) {
			throw new Error("Time entry not found");
		}

		if (entry.clockOut) {
			throw new Error("Already clocked out");
		}

		const clockOut = new Date();
		const clockIn = new Date(entry.clockIn);

		// Calculate total hours
		const totalMinutes =
			(clockOut.getTime() - clockIn.getTime()) / (1000 * 60) -
			input.breakDuration;
		const totalHours = totalMinutes / 60;

		// Update entry
		const [updatedEntry] = await db
			.update(timeEntries)
			.set({
				clockOut,
				clockOutMethod: input.method,
				clockOutLatitude: input.latitude,
				clockOutLongitude: input.longitude,
				breakDuration: input.breakDuration,
				totalHours,
				notes: input.notes || entry.notes,
				updatedAt: new Date(),
			})
			.where(eq(timeEntries.id, input.entryId))
			.returning();

		return updatedEntry;
	});

/**
 * Biometric Clock Out
 * Clock out using biometric device
 */
export const biometricClockOut = authedProcedure
	.input(
		z.object({
			deviceId: z.string().uuid(),
			enrollmentData: z.string().min(1),
			breakDuration: z.number().default(0),
			latitude: z.number().optional(),
			longitude: z.number().optional(),
		})
	)
	.handler(async ({ input }) => {
		// Find enrollment
		const enrollment = await db.query.biometricEnrollments.findFirst({
			where: and(
				eq(biometricEnrollments.deviceId, input.deviceId),
				eq(biometricEnrollments.enrollmentData, input.enrollmentData),
				eq(biometricEnrollments.isActive, true)
			),
			with: {
				device: true,
			},
		});

		if (!enrollment) {
			throw new Error("Biometric enrollment not found");
		}

		// Get active time entry
		const entry = await db.query.timeEntries.findFirst({
			where: and(
				eq(timeEntries.employeeId, enrollment.employeeId),
				// biome-ignore lint/suspicious/noExplicitAny: Drizzle query requires null as any for nullable comparisons
				eq(timeEntries.clockOut, null as any)
			),
		});

		if (!entry) {
			throw new Error("No active clock-in found");
		}

		const clockOut = new Date();
		const clockIn = new Date(entry.clockIn);

		// Calculate total hours
		const totalMinutes =
			(clockOut.getTime() - clockIn.getTime()) / (1000 * 60) -
			input.breakDuration;
		const totalHours = totalMinutes / 60;

		// Update device last seen
		await db
			.update(biometricDevices)
			.set({ lastSeen: new Date() })
			.where(eq(biometricDevices.id, input.deviceId));

		// Update time entry
		const [updatedEntry] = await db
			.update(timeEntries)
			.set({
				clockOut,
				clockOutMethod: enrollment.enrollmentType,
				clockOutLatitude: input.latitude || enrollment.device.latitude,
				clockOutLongitude: input.longitude || enrollment.device.longitude,
				breakDuration: input.breakDuration,
				totalHours,
				updatedAt: new Date(),
			})
			.where(eq(timeEntries.id, entry.id))
			.returning();

		return updatedEntry;
	});

/**
 * Get Active Time Entry
 * Returns the current active clock-in for an employee
 */
export const getActiveEntry = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const entry = await db.query.timeEntries.findFirst({
			where: and(
				eq(timeEntries.employeeId, input.employeeId),
				// biome-ignore lint/suspicious/noExplicitAny: Drizzle query requires null as any for nullable comparisons
				eq(timeEntries.clockOut, null as any)
			),
			with: {
				employee: true,
			},
		});

		return entry || null;
	});

/**
 * List Time Entries
 * Returns time entries for an employee or organization with filters
 */
export const listEntries = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			employeeId: z.string().uuid().optional(),
			startDate: z.string().optional(),
			endDate: z.string().optional(),
			status: z.enum(["pending", "approved", "rejected"]).optional(),
			limit: z.number().default(50),
			offset: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(timeEntries.organizationId, input.organizationId)];

		if (input.employeeId) {
			conditions.push(eq(timeEntries.employeeId, input.employeeId));
		}

		if (input.startDate && input.endDate) {
			conditions.push(
				between(
					timeEntries.clockIn,
					new Date(input.startDate),
					new Date(input.endDate)
				)
			);
		}

		if (input.status) {
			conditions.push(eq(timeEntries.status, input.status));
		}

		const entries = await db.query.timeEntries.findMany({
			where: and(...conditions),
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						employeeNumber: true,
					},
				},
			},
			orderBy: [desc(timeEntries.clockIn)],
			limit: input.limit,
			offset: input.offset,
		});

		return entries;
	});

/**
 * Approve Time Entry
 * Approves a pending time entry
 */
export const approveEntry = authedProcedure
	.input(
		z.object({
			entryId: z.string().uuid(),
			approverId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const [entry] = await db
			.update(timeEntries)
			.set({
				status: "approved",
				approvedBy: input.approverId,
				approvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(timeEntries.id, input.entryId))
			.returning();

		return entry;
	});

/**
 * Reject Time Entry
 * Rejects a pending time entry
 */
export const rejectEntry = authedProcedure
	.input(
		z.object({
			entryId: z.string().uuid(),
			approverId: z.string().uuid(),
			reason: z.string(),
		})
	)
	.handler(async ({ input }) => {
		const [entry] = await db
			.update(timeEntries)
			.set({
				status: "rejected",
				approvedBy: input.approverId,
				approvedAt: new Date(),
				rejectionReason: input.reason,
				updatedAt: new Date(),
			})
			.where(eq(timeEntries.id, input.entryId))
			.returning();

		return entry;
	});

/**
 * Create Shift
 * Creates a new shift definition
 */
export const createShift = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			name: z.string().min(1),
			startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM
			endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM
			daysOfWeek: z.string(), // "1,2,3,4,5"
			allowEarlyClockIn: z.boolean().default(false),
			allowLateClockOut: z.boolean().default(false),
			earlyClockInMinutes: z.number().default(0),
			lateClockOutMinutes: z.number().default(0),
			lateGracePeriod: z.number().default(0),
			earlyLeaveGracePeriod: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		const newShift: NewShift = {
			organizationId: input.organizationId,
			name: input.name,
			startTime: input.startTime,
			endTime: input.endTime,
			daysOfWeek: input.daysOfWeek,
			allowEarlyClockIn: input.allowEarlyClockIn,
			allowLateClockOut: input.allowLateClockOut,
			earlyClockInMinutes: input.earlyClockInMinutes,
			lateClockOutMinutes: input.lateClockOutMinutes,
			lateGracePeriod: input.lateGracePeriod,
			earlyLeaveGracePeriod: input.earlyLeaveGracePeriod,
			isActive: true,
		};

		const [shift] = await db.insert(shifts).values(newShift).returning();

		return shift;
	});

/**
 * List Shifts
 * Returns all shifts for an organization
 */
export const listShifts = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			isActive: z.boolean().optional(),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(shifts.organizationId, input.organizationId)];

		if (input.isActive !== undefined) {
			conditions.push(eq(shifts.isActive, input.isActive));
		}

		const allShifts = await db.query.shifts.findMany({
			where: and(...conditions),
			orderBy: [shifts.name],
		});

		return allShifts;
	});

/**
 * Assign Shift to Employee
 * Creates a shift assignment
 */
export const assignShift = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			shiftId: z.string().uuid(),
			organizationId: z.string().uuid(),
			startDate: z.string(),
			endDate: z.string().optional(),
		})
	)
	.handler(async ({ input }) => {
		const assignment: NewShiftAssignment = {
			employeeId: input.employeeId,
			shiftId: input.shiftId,
			organizationId: input.organizationId,
			startDate: new Date(input.startDate),
			endDate: input.endDate ? new Date(input.endDate) : null,
		};

		const [result] = await db
			.insert(shiftAssignments)
			.values(assignment)
			.returning();

		return result;
	});

/**
 * Get Employee Shift
 * Returns the current shift assignment for an employee
 */
export const getEmployeeShift = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const today = new Date();

		const assignment = await db.query.shiftAssignments.findFirst({
			where: and(
				eq(shiftAssignments.employeeId, input.employeeId),
				lte(shiftAssignments.startDate, today),
				sql`(${shiftAssignments.endDate} IS NULL OR ${shiftAssignments.endDate} >= ${today})`
			),
			with: {
				shift: true,
			},
		});

		return assignment || null;
	});

/**
 * Generate Timesheet
 * Creates or updates a timesheet for an employee for a period
 */
export const generateTimesheet = authedProcedure
	.input(
		z.object({
			employeeId: z.string().uuid(),
			organizationId: z.string().uuid(),
			periodStart: z.string(),
			periodEnd: z.string(),
		})
	)
	.handler(async ({ input }) => {
		// Get all approved time entries for the period
		const entries = await db.query.timeEntries.findMany({
			where: and(
				eq(timeEntries.employeeId, input.employeeId),
				eq(timeEntries.status, "approved"),
				between(
					timeEntries.clockIn,
					new Date(input.periodStart),
					new Date(input.periodEnd)
				)
			),
		});

		// Calculate totals
		let totalRegularHours = 0;
		let totalOvertimeHours = 0;
		let totalHolidayHours = 0;

		for (const entry of entries) {
			const hours = entry.totalHours || 0;
			if (entry.entryType === "regular") {
				totalRegularHours += hours;
			} else if (entry.entryType === "overtime") {
				totalOvertimeHours += hours;
			} else if (entry.entryType === "holiday") {
				totalHolidayHours += hours;
			}
		}

		// Check if timesheet already exists
		const existing = await db.query.timesheets.findFirst({
			where: and(
				eq(timesheets.employeeId, input.employeeId),
				eq(timesheets.periodStart, new Date(input.periodStart)),
				eq(timesheets.periodEnd, new Date(input.periodEnd))
			),
		});

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(timesheets)
				.set({
					totalRegularHours,
					totalOvertimeHours,
					totalHolidayHours,
					updatedAt: new Date(),
				})
				.where(eq(timesheets.id, existing.id))
				.returning();

			return updated;
		}

		// Create new
		const newTimesheet: NewTimesheet = {
			employeeId: input.employeeId,
			organizationId: input.organizationId,
			periodStart: new Date(input.periodStart),
			periodEnd: new Date(input.periodEnd),
			totalRegularHours,
			totalOvertimeHours,
			totalHolidayHours,
			status: "draft",
		};

		const [timesheet] = await db
			.insert(timesheets)
			.values(newTimesheet)
			.returning();

		return timesheet;
	});

/**
 * Get Timesheet
 * Returns a timesheet by ID with all details
 */
export const getTimesheet = authedProcedure
	.input(
		z.object({
			timesheetId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const timesheet = await db.query.timesheets.findFirst({
			where: eq(timesheets.id, input.timesheetId),
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						employeeNumber: true,
					},
				},
				approver: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		if (!timesheet) {
			throw new Error("Timesheet not found");
		}

		return timesheet;
	});

/**
 * List Timesheets
 * Returns timesheets for an organization with filters
 */
export const listTimesheets = authedProcedure
	.input(
		z.object({
			organizationId: z.string().uuid(),
			employeeId: z.string().uuid().optional(),
			status: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
			limit: z.number().default(50),
			offset: z.number().default(0),
		})
	)
	.handler(async ({ input }) => {
		const conditions = [eq(timesheets.organizationId, input.organizationId)];

		if (input.employeeId) {
			conditions.push(eq(timesheets.employeeId, input.employeeId));
		}

		if (input.status) {
			conditions.push(eq(timesheets.status, input.status));
		}

		const allTimesheets = await db.query.timesheets.findMany({
			where: and(...conditions),
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						employeeNumber: true,
					},
				},
			},
			orderBy: [desc(timesheets.periodStart)],
			limit: input.limit,
			offset: input.offset,
		});

		return allTimesheets;
	});

/**
 * Submit Timesheet
 * Submits a draft timesheet for approval
 */
export const submitTimesheet = authedProcedure
	.input(
		z.object({
			timesheetId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const [timesheet] = await db
			.update(timesheets)
			.set({
				status: "submitted",
				submittedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(timesheets.id, input.timesheetId))
			.returning();

		return timesheet;
	});

/**
 * Approve Timesheet
 * Approves a submitted timesheet
 */
export const approveTimesheet = authedProcedure
	.input(
		z.object({
			timesheetId: z.string().uuid(),
			approverId: z.string().uuid(),
		})
	)
	.handler(async ({ input }) => {
		const [timesheet] = await db
			.update(timesheets)
			.set({
				status: "approved",
				approvedBy: input.approverId,
				approvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(timesheets.id, input.timesheetId))
			.returning();

		return timesheet;
	});

// Export as router object
export const timeAttendanceRouter = {
	// Biometric Device Management
	registerDevice,
	listDevices,
	enrollBiometric,
	getEmployeeEnrollments,
	biometricClockIn,
	biometricClockOut,

	// Standard Clock In/Out
	clockIn,
	clockOut,
	getActiveEntry,
	listEntries,
	approveEntry,
	rejectEntry,

	// Shift Management
	createShift,
	listShifts,
	assignShift,
	getEmployeeShift,

	// Timesheet Management
	generateTimesheet,
	getTimesheet,
	listTimesheets,
	submitTimesheet,
	approveTimesheet,
};
