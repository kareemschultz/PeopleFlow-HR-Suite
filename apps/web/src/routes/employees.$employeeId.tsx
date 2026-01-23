import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Calendar03Icon,
	Mail01Icon,
	MoreVerticalIcon,
	PencilEdit01Icon,
	Phone01Icon,
	UserIcon,
} from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/employees/$employeeId")({
	component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
	const { employeeId } = Route.useParams();
	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<Record<string, unknown>>({});

	// Fetch employee data
	const {
		data: employee,
		isLoading,
		refetch,
	} = useQuery({
		...orpc.employees.get.queryOptions({ id: employeeId }),
	});

	// Update employee mutation
	const updateEmployee = useMutation({
		...orpc.employees.update.mutationOptions(),
		onSuccess: () => {
			toast.success("Employee updated successfully!");
			setIsEditing(false);
			refetch();
		},
		onError: (error: Error) => {
			toast.error(`Failed to update employee: ${error.message}`);
		},
	});

	// Delete/deactivate employee mutation
	const deleteEmployee = useMutation({
		...orpc.employees.delete.mutationOptions(),
		onSuccess: () => {
			toast.success("Employee deactivated successfully!");
			navigate({ to: "/employees" });
		},
		onError: (error: Error) => {
			toast.error(`Failed to deactivate employee: ${error.message}`);
		},
	});

	const handleSave = () => {
		updateEmployee.mutate({
			id: employeeId,
			...editData,
		});
	};

	const handleDeactivate = () => {
		if (
			confirm(
				"Are you sure you want to deactivate this employee? This will mark them as terminated."
			)
		) {
			deleteEmployee.mutate({ id: employeeId });
		}
	};

	const formatCurrency = (amount: number | null | undefined) => {
		if (!amount) return "$0.00";
		return new Intl.NumberFormat("en-GY", {
			style: "currency",
			currency: "GYD",
		}).format(amount / 100);
	};

	const formatDate = (date: string | null | undefined) => {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString();
	};

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!employee) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="p-8 text-center">
					<h2 className="font-semibold text-2xl">Employee Not Found</h2>
					<p className="mt-2 text-muted-foreground">
						The employee you're looking for doesn't exist or has been removed.
					</p>
					<Button
						className="mt-4"
						onClick={() => navigate({ to: "/employees" })}
					>
						Back to Employees
					</Button>
				</Card>
			</div>
		);
	}

	const getStatusBadge = (status: string) => {
		const statusMap: Record<
			string,
			{ variant: "default" | "destructive" | "secondary"; label: string }
		> = {
			active: { variant: "default", label: "Active" },
			on_leave: { variant: "secondary", label: "On Leave" },
			suspended: { variant: "destructive", label: "Suspended" },
			terminated: { variant: "destructive", label: "Terminated" },
			retired: { variant: "secondary", label: "Retired" },
		};
		const config = statusMap[status] || {
			variant: "secondary" as const,
			label: status,
		};
		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6">
			{/* Employee Header */}
			<Card className="p-6">
				<div className="flex items-start justify-between">
					<div className="flex gap-6">
						{/* Avatar */}
						<div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
							{employee.avatar ? (
								<img
									alt={`${employee.firstName} ${employee.lastName}`}
									className="h-24 w-24 rounded-full object-cover"
									src={employee.avatar}
								/>
							) : (
								<UserIcon className="h-12 w-12 text-primary" />
							)}
						</div>

						{/* Basic Info */}
						<div className="flex-1">
							<div className="flex items-center gap-3">
								<h1 className="font-bold text-3xl">
									{employee.firstName}{" "}
									{employee.middleName && `${employee.middleName} `}
									{employee.lastName}
								</h1>
								{getStatusBadge(employee.employmentStatus)}
							</div>
							<p className="mt-1 text-muted-foreground">
								{employee.position?.title || "No position"} •{" "}
								{employee.department?.name || "No department"}
							</p>

							<div className="mt-4 flex flex-wrap gap-6 text-sm">
								<div className="flex items-center gap-2">
									<Mail01Icon className="h-4 w-4 text-muted-foreground" />
									<a
										className="text-primary hover:underline"
										href={`mailto:${employee.email}`}
									>
										{employee.email}
									</a>
								</div>
								{employee.phone && (
									<div className="flex items-center gap-2">
										<Phone01Icon className="h-4 w-4 text-muted-foreground" />
										<a
											className="text-primary hover:underline"
											href={`tel:${employee.phone}`}
										>
											{employee.phone}
										</a>
									</div>
								)}
								<div className="flex items-center gap-2">
									<Calendar03Icon className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">
										Joined {formatDate(employee.hireDate)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2">
						{isEditing ? (
							<>
								<Button onClick={() => setIsEditing(false)} variant="outline">
									Cancel
								</Button>
								<Button
									disabled={updateEmployee.isPending}
									onClick={handleSave}
								>
									{updateEmployee.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</>
						) : (
							<>
								<Button onClick={() => setIsEditing(true)}>
									<PencilEdit01Icon className="mr-2 h-4 w-4" />
									Edit
								</Button>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="outline">
											<MoreVerticalIcon className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												navigate({ to: `/payroll?employeeId=${employeeId}` })
											}
										>
											View Payslips
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive"
											onClick={handleDeactivate}
										>
											Deactivate Employee
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						)}
					</div>
				</div>
			</Card>

			{/* Tabbed Content */}
			<Tabs className="w-full" defaultValue="overview">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="compensation">Compensation</TabsTrigger>
					<TabsTrigger value="personal">Personal</TabsTrigger>
					<TabsTrigger value="employment">Employment</TabsTrigger>
					<TabsTrigger value="notes">Notes</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent className="space-y-4" value="overview">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Employee Information</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<Label className="text-muted-foreground text-sm">
									Employee Number
								</Label>
								<p className="mt-1 font-medium">{employee.employeeNumber}</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Preferred Name
								</Label>
								<p className="mt-1 font-medium">
									{employee.preferredName || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Department
								</Label>
								<p className="mt-1 font-medium">
									{employee.department?.name || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Position
								</Label>
								<p className="mt-1 font-medium">
									{employee.position?.title || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">Manager</Label>
								<p className="mt-1 font-medium">
									{employee.manager
										? `${employee.manager.firstName} ${employee.manager.lastName}`
										: "No manager assigned"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Employment Type
								</Label>
								<p className="mt-1 font-medium capitalize">
									{employee.employmentType.replace(/_/g, " ")}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Work Schedule</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
							<div>
								<Label className="text-muted-foreground text-sm">
									Hours/Week
								</Label>
								<p className="mt-1 font-medium">
									{employee.workSchedule?.hoursPerWeek || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Days/Week
								</Label>
								<p className="mt-1 font-medium">
									{employee.workSchedule?.daysPerWeek || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Shift Type
								</Label>
								<p className="mt-1 font-medium capitalize">
									{employee.workSchedule?.shiftType || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Work from Home
								</Label>
								<p className="mt-1 font-medium">
									{employee.workSchedule?.workFromHome ? "Yes" : "No"}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Leave Balances</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<Label className="text-muted-foreground text-sm">
									Annual Leave
								</Label>
								<p className="mt-1 font-medium text-2xl">
									{employee.annualLeaveBalance ?? 0} days
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Sick Leave
								</Label>
								<p className="mt-1 font-medium text-2xl">
									{employee.sickLeaveBalance ?? 0} days
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Other Leave
								</Label>
								<p className="mt-1 font-medium text-2xl">
									{employee.otherLeaveBalance ?? 0} days
								</p>
							</div>
						</div>
					</Card>
				</TabsContent>

				{/* Compensation Tab */}
				<TabsContent className="space-y-4" value="compensation">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Base Salary</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<Label className="text-muted-foreground text-sm">Amount</Label>
								<p className="mt-1 font-medium text-2xl">
									{formatCurrency(employee.baseSalary)}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Currency
								</Label>
								<p className="mt-1 font-medium">{employee.salaryCurrency}</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Frequency
								</Label>
								<p className="mt-1 font-medium capitalize">
									{employee.salaryFrequency}
								</p>
							</div>
						</div>
					</Card>

					{employee.allowances && employee.allowances.length > 0 && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Allowances</h2>
							<div className="space-y-3">
								{employee.allowances.map((allowance, index) => (
									<div
										className="flex items-center justify-between rounded-lg border p-3"
										key={index}
									>
										<div>
											<p className="font-medium">{allowance.name}</p>
											<p className="text-muted-foreground text-sm">
												{allowance.code} • {allowance.frequency} •{" "}
												{allowance.isTaxable ? "Taxable" : "Non-taxable"}
											</p>
										</div>
										<p className="font-medium">
											{formatCurrency(allowance.amount)}
										</p>
									</div>
								))}
							</div>
						</Card>
					)}

					{employee.deductions && employee.deductions.length > 0 && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Deductions</h2>
							<div className="space-y-3">
								{employee.deductions.map((deduction, index) => (
									<div
										className="flex items-center justify-between rounded-lg border p-3"
										key={index}
									>
										<div>
											<p className="font-medium">{deduction.name}</p>
											<p className="text-muted-foreground text-sm">
												{deduction.code} • {deduction.frequency}
											</p>
										</div>
										<p className="font-medium text-destructive">
											-{formatCurrency(deduction.amount)}
										</p>
									</div>
								))}
							</div>
						</Card>
					)}

					{employee.bankDetails && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Bank Details</h2>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-sm">
										Bank Name
									</Label>
									<p className="mt-1 font-medium">
										{employee.bankDetails.bankName || "N/A"}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										Account Number
									</Label>
									<p className="mt-1 font-medium font-mono">
										{employee.bankDetails.accountNumber || "N/A"}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										Account Type
									</Label>
									<p className="mt-1 font-medium capitalize">
										{employee.bankDetails.accountType || "N/A"}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										Routing Number
									</Label>
									<p className="mt-1 font-medium font-mono">
										{employee.bankDetails.routingNumber || "N/A"}
									</p>
								</div>
							</div>
						</Card>
					)}
				</TabsContent>

				{/* Personal Tab */}
				<TabsContent className="space-y-4" value="personal">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Personal Information</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<Label className="text-muted-foreground text-sm">
									Date of Birth
								</Label>
								<p className="mt-1 font-medium">
									{formatDate(employee.dateOfBirth)}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">Gender</Label>
								<p className="mt-1 font-medium capitalize">
									{employee.gender?.replace(/_/g, " ") || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Nationality
								</Label>
								<p className="mt-1 font-medium">
									{employee.nationality || "N/A"}
								</p>
							</div>
						</div>
					</Card>

					{employee.address && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Address</h2>
							<div className="space-y-1">
								{employee.address.street && (
									<p className="font-medium">{employee.address.street}</p>
								)}
								<p className="text-muted-foreground">
									{[
										employee.address.city,
										employee.address.region,
										employee.address.postalCode,
									]
										.filter(Boolean)
										.join(", ")}
								</p>
								{employee.address.country && (
									<p className="font-medium">{employee.address.country}</p>
								)}
							</div>
						</Card>
					)}

					{employee.emergencyContact && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Emergency Contact</h2>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-sm">Name</Label>
									<p className="mt-1 font-medium">
										{employee.emergencyContact.name}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										Relationship
									</Label>
									<p className="mt-1 font-medium">
										{employee.emergencyContact.relationship}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">Phone</Label>
									<p className="mt-1 font-medium">
										{employee.emergencyContact.phone}
									</p>
								</div>
								{employee.emergencyContact.email && (
									<div>
										<Label className="text-muted-foreground text-sm">
											Email
										</Label>
										<p className="mt-1 font-medium">
											{employee.emergencyContact.email}
										</p>
									</div>
								)}
							</div>
						</Card>
					)}

					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Identification</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<Label className="text-muted-foreground text-sm">
									Tax ID (TIN)
								</Label>
								<p className="mt-1 font-medium font-mono">
									{employee.taxId || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									NIS Number
								</Label>
								<p className="mt-1 font-medium font-mono">
									{employee.nisNumber || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Passport Number
								</Label>
								<p className="mt-1 font-medium font-mono">
									{employee.passportNumber || "N/A"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									National ID
								</Label>
								<p className="mt-1 font-medium font-mono">
									{employee.nationalIdNumber || "N/A"}
								</p>
							</div>
						</div>
					</Card>
				</TabsContent>

				{/* Employment Tab */}
				<TabsContent className="space-y-4" value="employment">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Employment Dates</h2>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<Label className="text-muted-foreground text-sm">
									Hire Date
								</Label>
								<p className="mt-1 font-medium">
									{formatDate(employee.hireDate)}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Start Date
								</Label>
								<p className="mt-1 font-medium">
									{formatDate(employee.startDate)}
								</p>
							</div>
							{employee.probationEndDate && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Probation End Date
									</Label>
									<p className="mt-1 font-medium">
										{formatDate(employee.probationEndDate)}
									</p>
								</div>
							)}
							{employee.terminationDate && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Termination Date
									</Label>
									<p className="mt-1 font-medium">
										{formatDate(employee.terminationDate)}
									</p>
								</div>
							)}
						</div>
					</Card>

					{employee.directReports && employee.directReports.length > 0 && (
						<Card className="p-6">
							<h2 className="mb-4 font-semibold text-xl">Direct Reports</h2>
							<div className="space-y-2">
								{employee.directReports.map((report) => (
									<div
										className="flex items-center justify-between rounded-lg border p-3"
										key={report.id}
									>
										<div>
											<p className="font-medium">
												{report.firstName} {report.lastName}
											</p>
											<p className="text-muted-foreground text-sm">
												{report.employeeNumber}
											</p>
										</div>
										<Button
											onClick={() =>
												navigate({ to: `/employees/${report.id}` })
											}
											size="sm"
											variant="outline"
										>
											View
										</Button>
									</div>
								))}
							</div>
						</Card>
					)}
				</TabsContent>

				{/* Notes Tab */}
				<TabsContent className="space-y-4" value="notes">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Additional Notes</h2>
						{isEditing ? (
							<div className="space-y-2">
								<Label htmlFor="notes">Notes</Label>
								<Textarea
									className="min-h-[200px]"
									defaultValue={employee.notes || ""}
									id="notes"
									onChange={(e) =>
										setEditData((prev) => ({ ...prev, notes: e.target.value }))
									}
									placeholder="Add any additional information about this employee..."
								/>
							</div>
						) : (
							<div className="min-h-[200px] rounded-lg border p-4">
								{employee.notes ? (
									<p className="whitespace-pre-wrap text-sm">
										{employee.notes}
									</p>
								) : (
									<p className="text-center text-muted-foreground">
										No notes available
									</p>
								)}
							</div>
						)}
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
