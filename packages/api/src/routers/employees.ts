import { db } from "@PeopleFlow-HR-Suite/db";
import { type NewEmployee, employees } from "@PeopleFlow-HR-Suite/db/schema";
import { oz } from "@orpc/zod";
import { and, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { authedProcedure } from "../context";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const emergencyContactSchema = z.object({
	name: z.string(),
	relationship: z.string(),
	phone: z.string(),
	email: z.string().email().optional(),
});

const addressSchema = z.object({
	street: z.string().optional(),
	city: z.string().optional(),
	region: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
});

const workScheduleSchema = z.object({
	hoursPerWeek: z.number().positive().optional(),
	daysPerWeek: z.number().int().min(1).max(7).optional(),
	shiftType: z.enum(["day", "night", "rotating"]).optional(),
	workFromHome: z.boolean().optional(),
});

const allowanceSchema = z.object({
	code: z.string(),
	name: z.string(),
	amount: z.number().int().nonnegative(),
	frequency: z.enum(["monthly", "per_payroll", "annual"]),
	isTaxable: z.boolean(),
});

const deductionSchema = z.object({
	code: z.string(),
	name: z.string(),
	amount: z.number().int().nonnegative(),
	frequency: z.enum(["monthly", "per_payroll", "annual"]),
});

const bankDetailsSchema = z.object({
	bankName: z.string().optional(),
	accountNumber: z.string().optional(),
	accountType: z.enum(["checking", "savings"]).optional(),
	routingNumber: z.string().optional(),
	swiftCode: z.string().optional(),
});

const createEmployeeSchema = oz.input(
	z.object({
		// Relationships
		organizationId: z.string().uuid(),
		departmentId: z.string().uuid(),
		positionId: z.string().uuid(),
		managerId: z.string().uuid().optional(),
		userId: z.string().optional(),

		// Personal information
		firstName: z.string().min(1).max(100),
		middleName: z.string().max(100).optional(),
		lastName: z.string().min(1).max(100),
		preferredName: z.string().max(100).optional(),
		email: z.string().email(),
		phone: z.string().optional(),
		emergencyContact: emergencyContactSchema.optional(),
		dateOfBirth: z.string().optional(), // ISO date string
		gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
		nationality: z.string().optional(),
		address: addressSchema.optional(),

		// Identification
		employeeNumber: z.string().min(1).max(50),
		taxId: z.string().optional(),
		nisNumber: z.string().optional(),
		passportNumber: z.string().optional(),
		nationalIdNumber: z.string().optional(),

		// Employment details
		hireDate: z.string(), // ISO date string
		startDate: z.string(), // ISO date string
		probationEndDate: z.string().optional(),
		employmentType: z
			.enum(["full_time", "part_time", "contract", "temporary", "intern"])
			.default("full_time"),
		employmentStatus: z
			.enum(["active", "on_leave", "suspended", "terminated", "retired"])
			.default("active"),
		workSchedule: workScheduleSchema.optional(),

		// Compensation
		baseSalary: z.number().int().nonnegative(),
		salaryCurrency: z.string().length(3).default("GYD"),
		salaryFrequency: z
			.enum(["monthly", "biweekly", "weekly", "annual"])
			.default("monthly"),
		allowances: z.array(allowanceSchema).optional(),
		deductions: z.array(deductionSchema).optional(),
		bankDetails: bankDetailsSchema.optional(),

		// Leave balances
		annualLeaveBalance: z.number().int().nonnegative().default(0),
		sickLeaveBalance: z.number().int().nonnegative().default(0),
		otherLeaveBalance: z.number().int().nonnegative().default(0),

		// Other
		avatar: z.string().url().optional(),
		notes: z.string().optional(),
	})
);

const updateEmployeeSchema = oz.input(
	z.object({
		id: z.string().uuid(),
		departmentId: z.string().uuid().optional(),
		positionId: z.string().uuid().optional(),
		managerId: z.string().uuid().nullable().optional(),
		firstName: z.string().min(1).max(100).optional(),
		middleName: z.string().max(100).optional(),
		lastName: z.string().min(1).max(100).optional(),
		preferredName: z.string().max(100).optional(),
		email: z.string().email().optional(),
		phone: z.string().optional(),
		emergencyContact: emergencyContactSchema.optional(),
		address: addressSchema.optional(),
		employmentStatus: z
			.enum(["active", "on_leave", "suspended", "terminated", "retired"])
			.optional(),
		workSchedule: workScheduleSchema.optional(),
		baseSalary: z.number().int().nonnegative().optional(),
		allowances: z.array(allowanceSchema).optional(),
		deductions: z.array(deductionSchema).optional(),
		bankDetails: bankDetailsSchema.optional(),
		annualLeaveBalance: z.number().int().nonnegative().optional(),
		sickLeaveBalance: z.number().int().nonnegative().optional(),
		otherLeaveBalance: z.number().int().nonnegative().optional(),
		avatar: z.string().url().optional(),
		notes: z.string().optional(),
		isActive: z.boolean().optional(),
	})
);

// ============================================================================
// PROCEDURES
// ============================================================================

/**
 * Create a new employee
 */
export const createEmployee = authedProcedure
	.input(createEmployeeSchema)
	.use(async ({ next, context, input }) => {
		// Check if employee number already exists
		const existing = await db.query.employees.findFirst({
			where: and(
				eq(employees.organizationId, input.organizationId),
				eq(employees.employeeNumber, input.employeeNumber)
			),
		});

		if (existing) {
			throw new Error("Employee number already exists");
		}

		// Check if email already exists in organization
		const existingEmail = await db.query.employees.findFirst({
			where: and(
				eq(employees.organizationId, input.organizationId),
				eq(employees.email, input.email)
			),
		});

		if (existingEmail) {
			throw new Error("Email already exists in organization");
		}

		return next({ context });
	})
	.handler(async ({ input }) => {
		const [employee] = await db
			.insert(employees)
			.values(input as NewEmployee)
			.returning();

		return employee;
	});

/**
 * Get employee by ID with relationships
 */
export const getEmployee = authedProcedure
	.input(oz.input(z.object({ id: z.string().uuid() })))
	.handler(async ({ input }) => {
		const employee = await db.query.employees.findFirst({
			where: eq(employees.id, input.id),
			with: {
				organization: true,
				department: true,
				position: true,
				manager: true,
				directReports: true,
			},
		});

		if (!employee) {
			throw new Error("Employee not found");
		}

		return employee;
	});

/**
 * List employees with optional filtering
 */
export const listEmployees = authedProcedure
	.input(
		oz.input(
			z
				.object({
					organizationId: z.string().uuid(),
					departmentId: z.string().uuid().optional(),
					positionId: z.string().uuid().optional(),
					managerId: z.string().uuid().optional(),
					employmentStatus: z
						.enum(["active", "on_leave", "suspended", "terminated", "retired"])
						.optional(),
					search: z.string().optional(),
					isActive: z.boolean().optional(),
					limit: z.number().int().positive().max(100).default(50),
					offset: z.number().int().nonnegative().default(0),
				})
				.optional()
		)
	)
	.handler(async ({ input }) => {
		if (!input?.organizationId) {
			throw new Error("organizationId is required");
		}

		const filters = [eq(employees.organizationId, input.organizationId)];

		if (input?.departmentId) {
			filters.push(eq(employees.departmentId, input.departmentId));
		}

		if (input?.positionId) {
			filters.push(eq(employees.positionId, input.positionId));
		}

		if (input?.managerId) {
			filters.push(eq(employees.managerId, input.managerId));
		}

		if (input?.employmentStatus) {
			filters.push(eq(employees.employmentStatus, input.employmentStatus));
		}

		if (input?.search) {
			filters.push(
				or(
					like(employees.firstName, `%${input.search}%`),
					like(employees.lastName, `%${input.search}%`),
					like(employees.email, `%${input.search}%`),
					like(employees.employeeNumber, `%${input.search}%`)
				)
			);
		}

		if (input?.isActive !== undefined) {
			filters.push(eq(employees.isActive, input.isActive));
		}

		const emps = await db.query.employees.findMany({
			where: and(...filters),
			limit: input?.limit ?? 50,
			offset: input?.offset ?? 0,
			orderBy: (emps, { asc }) => [asc(emps.lastName), asc(emps.firstName)],
		});

		return emps;
	});

/**
 * Update an employee
 */
export const updateEmployee = authedProcedure
	.input(updateEmployeeSchema)
	.handler(async ({ input }) => {
		const { id, ...updates } = input;

		const [updated] = await db
			.update(employees)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(employees.id, id))
			.returning();

		if (!updated) {
			throw new Error("Employee not found");
		}

		return updated;
	});

/**
 * Delete (soft delete by marking inactive) an employee
 */
export const deleteEmployee = authedProcedure
	.input(oz.input(z.object({ id: z.string().uuid() })))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.update(employees)
			.set({
				isActive: false,
				employmentStatus: "terminated",
				updatedAt: new Date(),
			})
			.where(eq(employees.id, input.id))
			.returning();

		if (!deleted) {
			throw new Error("Employee not found");
		}

		return { success: true };
	});

// ============================================================================
// ROUTER
// ============================================================================

export const employeesRouter = {
	create: createEmployee,
	get: getEmployee,
	list: listEmployees,
	update: updateEmployee,
	delete: deleteEmployee,
};
