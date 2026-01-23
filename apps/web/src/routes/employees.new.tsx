import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/employees/new")({
	component: NewEmployeePage,
});

interface EmergencyContact {
	name: string;
	relationship: string;
	phone: string;
	email?: string;
}

interface Address {
	street?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
}

interface WorkSchedule {
	hoursPerWeek?: number;
	daysPerWeek?: number;
	shiftType?: "day" | "night" | "rotating";
	workFromHome?: boolean;
}

function NewEmployeePage() {
	const navigate = useNavigate();
	const { organizationId, hasOrganization } = useOrganization();

	// Form state
	const [formData, setFormData] = useState({
		// Basic Information
		firstName: "",
		middleName: "",
		lastName: "",
		preferredName: "",
		email: "",
		phone: "",
		employeeNumber: "",
		departmentId: "",
		positionId: "",
		managerId: "",

		// Personal Details
		dateOfBirth: "",
		gender: "" as "male" | "female" | "other" | "prefer_not_to_say" | "",
		nationality: "",

		// Identification
		taxId: "",
		nisNumber: "",
		passportNumber: "",
		nationalIdNumber: "",

		// Employment Details
		hireDate: "",
		startDate: "",
		probationEndDate: "",
		employmentType: "full_time" as
			| "full_time"
			| "part_time"
			| "contract"
			| "temporary"
			| "intern",
		employmentStatus: "active" as
			| "active"
			| "on_leave"
			| "suspended"
			| "terminated"
			| "retired",

		// Compensation
		baseSalary: "",
		salaryCurrency: "GYD",
		salaryFrequency: "monthly" as "monthly" | "biweekly" | "weekly" | "annual",

		// Leave Balances
		annualLeaveBalance: "0",
		sickLeaveBalance: "0",
		otherLeaveBalance: "0",

		// Notes
		notes: "",
	});

	const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
		name: "",
		relationship: "",
		phone: "",
		email: "",
	});

	const [address, setAddress] = useState<Address>({
		street: "",
		city: "",
		region: "",
		postalCode: "",
		country: "",
	});

	const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({
		hoursPerWeek: 40,
		daysPerWeek: 5,
		shiftType: "day",
		workFromHome: false,
	});

	// Fetch departments
	const { data: departments, isLoading: isDepartmentsLoading } = useQuery({
		...orpc.departments.list.queryOptions({
			organizationId,
			isActive: true,
		}),
		enabled: hasOrganization,
	});

	// Fetch employees for manager dropdown
	const { data: employees, isLoading: isEmployeesLoading } = useQuery({
		...orpc.employees.list.queryOptions({
			organizationId,
			employmentStatus: "active",
			isActive: true,
		}),
		enabled: hasOrganization,
	});

	// Create employee mutation
	const createEmployee = useMutation({
		...orpc.employees.create.mutationOptions(),
		onSuccess: (employee) => {
			toast.success("Employee created successfully!");
			navigate({ to: `/employees/${employee.id}` });
		},
		onError: (error: Error) => {
			toast.error(`Failed to create employee: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields
		if (
			!(
				formData.firstName &&
				formData.lastName &&
				formData.email &&
				formData.employeeNumber &&
				formData.departmentId &&
				formData.positionId &&
				formData.hireDate &&
				formData.startDate &&
				formData.baseSalary
			)
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Build employee data
		const employeeData = {
			organizationId,
			firstName: formData.firstName,
			middleName: formData.middleName || undefined,
			lastName: formData.lastName,
			preferredName: formData.preferredName || undefined,
			email: formData.email,
			phone: formData.phone || undefined,
			employeeNumber: formData.employeeNumber,
			departmentId: formData.departmentId,
			positionId: formData.positionId,
			managerId: formData.managerId || undefined,

			// Personal Details
			dateOfBirth: formData.dateOfBirth || undefined,
			gender: formData.gender || undefined,
			nationality: formData.nationality || undefined,

			// Emergency Contact (only include if name is provided)
			emergencyContact:
				emergencyContact.name &&
				emergencyContact.relationship &&
				emergencyContact.phone
					? {
							name: emergencyContact.name,
							relationship: emergencyContact.relationship,
							phone: emergencyContact.phone,
							email: emergencyContact.email || undefined,
						}
					: undefined,

			// Address (only include if at least one field is provided)
			address:
				address.street ||
				address.city ||
				address.region ||
				address.postalCode ||
				address.country
					? {
							street: address.street || undefined,
							city: address.city || undefined,
							region: address.region || undefined,
							postalCode: address.postalCode || undefined,
							country: address.country || undefined,
						}
					: undefined,

			// Identification
			taxId: formData.taxId || undefined,
			nisNumber: formData.nisNumber || undefined,
			passportNumber: formData.passportNumber || undefined,
			nationalIdNumber: formData.nationalIdNumber || undefined,

			// Employment Details
			hireDate: formData.hireDate,
			startDate: formData.startDate,
			probationEndDate: formData.probationEndDate || undefined,
			employmentType: formData.employmentType,
			employmentStatus: formData.employmentStatus,

			// Work Schedule
			workSchedule:
				workSchedule.hoursPerWeek || workSchedule.daysPerWeek
					? {
							hoursPerWeek: workSchedule.hoursPerWeek || undefined,
							daysPerWeek: workSchedule.daysPerWeek || undefined,
							shiftType: workSchedule.shiftType || undefined,
							workFromHome: workSchedule.workFromHome || undefined,
						}
					: undefined,

			// Compensation
			baseSalary: Number.parseInt(formData.baseSalary, 10) * 100, // Convert to cents
			salaryCurrency: formData.salaryCurrency,
			salaryFrequency: formData.salaryFrequency,

			// Leave Balances
			annualLeaveBalance: Number.parseInt(formData.annualLeaveBalance, 10) || 0,
			sickLeaveBalance: Number.parseInt(formData.sickLeaveBalance, 10) || 0,
			otherLeaveBalance: Number.parseInt(formData.otherLeaveBalance, 10) || 0,

			// Notes
			notes: formData.notes || undefined,
		};

		createEmployee.mutate(employeeData);
	};

	const isLoading = isDepartmentsLoading || isEmployeesLoading;

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Add New Employee</h1>
					<p className="text-muted-foreground">
						Create a new employee record with all necessary details
					</p>
				</div>
				<Button
					onClick={() => navigate({ to: "/employees" })}
					variant="outline"
				>
					Cancel
				</Button>
			</div>

			<form className="space-y-6" onSubmit={handleSubmit}>
				{/* Basic Information */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Basic Information</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">
								First Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="firstName"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										firstName: e.target.value,
									}))
								}
								required
								value={formData.firstName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">
								Last Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="lastName"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, lastName: e.target.value }))
								}
								required
								value={formData.lastName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="middleName">Middle Name</Label>
							<Input
								id="middleName"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										middleName: e.target.value,
									}))
								}
								value={formData.middleName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="preferredName">Preferred Name</Label>
							<Input
								id="preferredName"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										preferredName: e.target.value,
									}))
								}
								placeholder="Nickname or preferred name"
								value={formData.preferredName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">
								Email <span className="text-destructive">*</span>
							</Label>
							<Input
								id="email"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, email: e.target.value }))
								}
								required
								type="email"
								value={formData.email}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, phone: e.target.value }))
								}
								type="tel"
								value={formData.phone}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="employeeNumber">
								Employee Number <span className="text-destructive">*</span>
							</Label>
							<Input
								id="employeeNumber"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										employeeNumber: e.target.value,
									}))
								}
								placeholder="e.g., EMP001"
								required
								value={formData.employeeNumber}
							/>
						</div>
					</div>
				</Card>

				{/* Organizational Assignment */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">
						Organizational Assignment
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="department">
								Department <span className="text-destructive">*</span>
							</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, departmentId: value }))
								}
								value={formData.departmentId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									{isLoading ? (
										<SelectItem disabled value="loading">
											Loading...
										</SelectItem>
									) : (
										departments?.map((dept) => (
											<SelectItem key={dept.id} value={dept.id}>
												{dept.name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="position">
								Position <span className="text-destructive">*</span>
							</Label>
							<Input
								id="position"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										positionId: e.target.value,
									}))
								}
								placeholder="Enter position ID"
								required
								value={formData.positionId}
							/>
							<p className="text-muted-foreground text-xs">
								Note: Position selector will be added once positions API is
								ready
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager">Manager</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, managerId: value }))
								}
								value={formData.managerId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select manager (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">No manager</SelectItem>
									{employees?.map((emp) => (
										<SelectItem key={emp.id} value={emp.id}>
											{emp.firstName} {emp.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				{/* Personal Details */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Personal Details</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="dateOfBirth">Date of Birth</Label>
							<Input
								id="dateOfBirth"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										dateOfBirth: e.target.value,
									}))
								}
								type="date"
								value={formData.dateOfBirth}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="gender">Gender</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										gender: value as typeof formData.gender,
									}))
								}
								value={formData.gender}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select gender" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="male">Male</SelectItem>
									<SelectItem value="female">Female</SelectItem>
									<SelectItem value="other">Other</SelectItem>
									<SelectItem value="prefer_not_to_say">
										Prefer not to say
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nationality">Nationality</Label>
							<Input
								id="nationality"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										nationality: e.target.value,
									}))
								}
								value={formData.nationality}
							/>
						</div>
					</div>
				</Card>

				{/* Address */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Address</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="col-span-2 space-y-2">
							<Label htmlFor="street">Street Address</Label>
							<Input
								id="street"
								onChange={(e) =>
									setAddress((prev) => ({ ...prev, street: e.target.value }))
								}
								value={address.street}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="city">City</Label>
							<Input
								id="city"
								onChange={(e) =>
									setAddress((prev) => ({ ...prev, city: e.target.value }))
								}
								value={address.city}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="region">Region/State</Label>
							<Input
								id="region"
								onChange={(e) =>
									setAddress((prev) => ({ ...prev, region: e.target.value }))
								}
								value={address.region}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="postalCode">Postal Code</Label>
							<Input
								id="postalCode"
								onChange={(e) =>
									setAddress((prev) => ({
										...prev,
										postalCode: e.target.value,
									}))
								}
								value={address.postalCode}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="country">Country</Label>
							<Input
								id="country"
								onChange={(e) =>
									setAddress((prev) => ({ ...prev, country: e.target.value }))
								}
								value={address.country}
							/>
						</div>
					</div>
				</Card>

				{/* Emergency Contact */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Emergency Contact</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="emergencyName">Name</Label>
							<Input
								id="emergencyName"
								onChange={(e) =>
									setEmergencyContact((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								value={emergencyContact.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emergencyRelationship">Relationship</Label>
							<Input
								id="emergencyRelationship"
								onChange={(e) =>
									setEmergencyContact((prev) => ({
										...prev,
										relationship: e.target.value,
									}))
								}
								placeholder="e.g., Spouse, Parent, Sibling"
								value={emergencyContact.relationship}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emergencyPhone">Phone</Label>
							<Input
								id="emergencyPhone"
								onChange={(e) =>
									setEmergencyContact((prev) => ({
										...prev,
										phone: e.target.value,
									}))
								}
								type="tel"
								value={emergencyContact.phone}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emergencyEmail">Email</Label>
							<Input
								id="emergencyEmail"
								onChange={(e) =>
									setEmergencyContact((prev) => ({
										...prev,
										email: e.target.value,
									}))
								}
								type="email"
								value={emergencyContact.email}
							/>
						</div>
					</div>
				</Card>

				{/* Identification */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Identification</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="taxId">Tax ID (TIN)</Label>
							<Input
								id="taxId"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, taxId: e.target.value }))
								}
								value={formData.taxId}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nisNumber">NIS Number</Label>
							<Input
								id="nisNumber"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										nisNumber: e.target.value,
									}))
								}
								value={formData.nisNumber}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="passportNumber">Passport Number</Label>
							<Input
								id="passportNumber"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										passportNumber: e.target.value,
									}))
								}
								value={formData.passportNumber}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nationalIdNumber">National ID Number</Label>
							<Input
								id="nationalIdNumber"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										nationalIdNumber: e.target.value,
									}))
								}
								value={formData.nationalIdNumber}
							/>
						</div>
					</div>
				</Card>

				{/* Employment Details */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Employment Details</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="hireDate">
								Hire Date <span className="text-destructive">*</span>
							</Label>
							<Input
								id="hireDate"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, hireDate: e.target.value }))
								}
								required
								type="date"
								value={formData.hireDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="startDate">
								Start Date <span className="text-destructive">*</span>
							</Label>
							<Input
								id="startDate"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										startDate: e.target.value,
									}))
								}
								required
								type="date"
								value={formData.startDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="probationEndDate">Probation End Date</Label>
							<Input
								id="probationEndDate"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										probationEndDate: e.target.value,
									}))
								}
								type="date"
								value={formData.probationEndDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="employmentType">Employment Type</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										employmentType: value as typeof formData.employmentType,
									}))
								}
								value={formData.employmentType}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="full_time">Full Time</SelectItem>
									<SelectItem value="part_time">Part Time</SelectItem>
									<SelectItem value="contract">Contract</SelectItem>
									<SelectItem value="temporary">Temporary</SelectItem>
									<SelectItem value="intern">Intern</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="employmentStatus">Employment Status</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										employmentStatus: value as typeof formData.employmentStatus,
									}))
								}
								value={formData.employmentStatus}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="on_leave">On Leave</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
									<SelectItem value="terminated">Terminated</SelectItem>
									<SelectItem value="retired">Retired</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Work Schedule */}
					<div className="mt-6">
						<h3 className="mb-3 font-medium">Work Schedule</h3>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
							<div className="space-y-2">
								<Label htmlFor="hoursPerWeek">Hours per Week</Label>
								<Input
									id="hoursPerWeek"
									min="1"
									onChange={(e) =>
										setWorkSchedule((prev) => ({
											...prev,
											hoursPerWeek:
												Number.parseInt(e.target.value, 10) || undefined,
										}))
									}
									type="number"
									value={workSchedule.hoursPerWeek || ""}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="daysPerWeek">Days per Week</Label>
								<Input
									id="daysPerWeek"
									max="7"
									min="1"
									onChange={(e) =>
										setWorkSchedule((prev) => ({
											...prev,
											daysPerWeek:
												Number.parseInt(e.target.value, 10) || undefined,
										}))
									}
									type="number"
									value={workSchedule.daysPerWeek || ""}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="shiftType">Shift Type</Label>
								<Select
									onValueChange={(value) =>
										setWorkSchedule((prev) => ({
											...prev,
											shiftType: value as typeof workSchedule.shiftType,
										}))
									}
									value={workSchedule.shiftType}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="day">Day</SelectItem>
										<SelectItem value="night">Night</SelectItem>
										<SelectItem value="rotating">Rotating</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-end space-y-2">
								<label className="flex items-center space-x-2">
									<input
										checked={workSchedule.workFromHome}
										className="rounded border-gray-300"
										onChange={(e) =>
											setWorkSchedule((prev) => ({
												...prev,
												workFromHome: e.target.checked,
											}))
										}
										type="checkbox"
									/>
									<span className="text-sm">Work from Home</span>
								</label>
							</div>
						</div>
					</div>
				</Card>

				{/* Compensation */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Compensation</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="baseSalary">
								Base Salary <span className="text-destructive">*</span>
							</Label>
							<Input
								id="baseSalary"
								min="0"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										baseSalary: e.target.value,
									}))
								}
								placeholder="e.g., 50000"
								required
								type="number"
								value={formData.baseSalary}
							/>
							<p className="text-muted-foreground text-xs">
								Enter amount in whole units
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="salaryCurrency">Currency</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, salaryCurrency: value }))
								}
								value={formData.salaryCurrency}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GYD">GYD (Guyanese Dollar)</SelectItem>
									<SelectItem value="USD">USD (US Dollar)</SelectItem>
									<SelectItem value="EUR">EUR (Euro)</SelectItem>
									<SelectItem value="GBP">GBP (British Pound)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="salaryFrequency">Frequency</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										salaryFrequency: value as typeof formData.salaryFrequency,
									}))
								}
								value={formData.salaryFrequency}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="monthly">Monthly</SelectItem>
									<SelectItem value="biweekly">Biweekly</SelectItem>
									<SelectItem value="weekly">Weekly</SelectItem>
									<SelectItem value="annual">Annual</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<p className="mt-4 text-muted-foreground text-sm">
						Note: Allowances, deductions, and bank details can be added after
						creating the employee.
					</p>
				</Card>

				{/* Leave Balances */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">
						Leave Balances (in days)
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="annualLeaveBalance">Annual Leave</Label>
							<Input
								id="annualLeaveBalance"
								min="0"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										annualLeaveBalance: e.target.value,
									}))
								}
								type="number"
								value={formData.annualLeaveBalance}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="sickLeaveBalance">Sick Leave</Label>
							<Input
								id="sickLeaveBalance"
								min="0"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										sickLeaveBalance: e.target.value,
									}))
								}
								type="number"
								value={formData.sickLeaveBalance}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="otherLeaveBalance">Other Leave</Label>
							<Input
								id="otherLeaveBalance"
								min="0"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										otherLeaveBalance: e.target.value,
									}))
								}
								type="number"
								value={formData.otherLeaveBalance}
							/>
						</div>
					</div>
				</Card>

				{/* Notes */}
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Additional Notes</h2>
					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
							placeholder="Any additional information about this employee..."
							rows={4}
							value={formData.notes}
						/>
					</div>
				</Card>

				{/* Submit Buttons */}
				<div className="flex justify-end gap-3">
					<Button
						onClick={() => navigate({ to: "/employees" })}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button disabled={createEmployee.isPending} type="submit">
						{createEmployee.isPending ? "Creating..." : "Create Employee"}
					</Button>
				</div>
			</form>
		</div>
	);
}
