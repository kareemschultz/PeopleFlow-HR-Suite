import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft01Icon,
	Building03Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	MoreVerticalIcon,
	PencilEdit02Icon,
	UserMultiple02Icon,
} from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/departments/$departmentId")({
	component: DepartmentRoute,
});

// Helper component for loading state
function LoadingState() {
	return (
		<div className="container mx-auto max-w-6xl space-y-6 p-6">
			<Skeleton className="h-32 w-full" />
			<Skeleton className="h-96 w-full" />
		</div>
	);
}

// Helper component for not found state
function NotFoundState({ onBack }: { onBack: () => void }) {
	return (
		<div className="container mx-auto max-w-6xl p-6">
			<Card className="p-12 text-center">
				<h2 className="font-semibold text-xl">Department not found</h2>
				<Button className="mt-4" onClick={onBack}>
					Back to Departments
				</Button>
			</Card>
		</div>
	);
}

// Helper to get status badge
function getStatusBadge(isActive: boolean) {
	return isActive ? (
		<Badge className="bg-green-100 text-green-700">Active</Badge>
	) : (
		<Badge variant="destructive">Inactive</Badge>
	);
}

// Helper component for editable text field
function EditableField({
	label,
	value,
	isEditing,
	fieldKey,
	onChange,
	type = "text",
	placeholder,
}: {
	label: string;
	value: string | number | null | undefined;
	isEditing: boolean;
	fieldKey: string;
	onChange: (key: string, value: string) => void;
	type?: string;
	placeholder?: string;
}) {
	return (
		<div>
			<Label className="text-muted-foreground text-sm">{label}</Label>
			{isEditing ? (
				<Input
					className="mt-1"
					onChange={(e) => onChange(fieldKey, e.target.value)}
					placeholder={placeholder}
					type={type}
					value={value ?? ""}
				/>
			) : (
				<p className="mt-1 font-medium">{value || placeholder || "—"}</p>
			)}
		</div>
	);
}

// Helper component for approval checkbox setting
function ApprovalCheckbox({
	isEditing,
	checked,
	onCheckedChange,
	label,
	description,
}: {
	isEditing: boolean;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label: string;
	description: string;
}) {
	return (
		<div className="flex items-start space-x-3">
			{isEditing && (
				<Checkbox
					checked={checked}
					onCheckedChange={(c) => onCheckedChange(c === true)}
				/>
			)}
			{!isEditing && checked && (
				<CheckmarkCircle02Icon className="h-5 w-5 text-green-600" />
			)}
			{!(isEditing || checked) && (
				<Cancel01Icon className="h-5 w-5 text-muted-foreground" />
			)}
			<div>
				<Label className="font-medium text-sm">{label}</Label>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
		</div>
	);
}

// Overview Tab Component
function OverviewTab({
	department,
	isEditing,
	editData,
	handleFieldChange,
	navigate,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Complex query result type from orpc with nested relations
	department: any;
	isEditing: boolean;
	editData: Record<string, unknown>;
	handleFieldChange: (key: string, value: string) => void;
	navigate: ReturnType<typeof useNavigate>;
}) {
	return (
		<TabsContent className="space-y-6" value="overview">
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Basic Information</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<EditableField
						fieldKey="name"
						isEditing={isEditing}
						label="Department Name"
						onChange={handleFieldChange}
						value={(editData.name as string) ?? department.name}
					/>

					<EditableField
						fieldKey="code"
						isEditing={isEditing}
						label="Department Code"
						onChange={handleFieldChange}
						value={(editData.code as string) ?? department.code}
					/>

					<div className="md:col-span-2">
						<Label className="text-muted-foreground text-sm">Description</Label>
						{isEditing ? (
							<Textarea
								className="mt-1"
								onChange={(e) =>
									handleFieldChange("description", e.target.value)
								}
								rows={3}
								value={
									(editData.description as string) ??
									department.description ??
									""
								}
							/>
						) : (
							<p className="mt-1">
								{department.description || "No description"}
							</p>
						)}
					</div>
				</div>
			</Card>

			{department.location && (
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Location</h2>
					<EditableField
						fieldKey="location"
						isEditing={isEditing}
						label="Office Location"
						onChange={handleFieldChange}
						value={(editData.location as string) ?? department.location}
					/>
				</Card>
			)}

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Organizational Hierarchy</h2>
				<div className="space-y-4">
					{department.parentDepartment && (
						<div>
							<Label className="text-muted-foreground text-sm">
								Parent Department
							</Label>
							<div className="mt-2">
								<Button
									onClick={() =>
										navigate({
											to: "/departments/$departmentId",
											params: {
												departmentId: department.parentDepartment?.id ?? "",
											},
										})
									}
									variant="outline"
								>
									<Building03Icon className="mr-2 h-4 w-4" />
									{department.parentDepartment?.name} (
									{department.parentDepartment?.code})
								</Button>
							</div>
						</div>
					)}

					{department.subDepartments &&
						department.subDepartments.length > 0 && (
							<div>
								<Label className="text-muted-foreground text-sm">
									Sub-Departments ({department.subDepartments.length})
								</Label>
								<div className="mt-2 flex flex-wrap gap-2">
									{/* biome-ignore lint/suspicious/noExplicitAny: Type inference from map callback */}
									{department.subDepartments.map((subDept: any) => (
										<Button
											key={subDept.id}
											onClick={() =>
												navigate({
													to: "/departments/$departmentId",
													params: { departmentId: subDept.id },
												})
											}
											variant="outline"
										>
											<Building03Icon className="mr-2 h-4 w-4" />
											{subDept.name} ({subDept.code})
										</Button>
									))}
								</div>
							</div>
						)}

					{!department.parentDepartment &&
						(!department.subDepartments ||
							department.subDepartments.length === 0) && (
							<p className="text-muted-foreground">
								This is a standalone department with no parent or
								sub-departments.
							</p>
						)}
				</div>
			</Card>
		</TabsContent>
	);
}

// Budget & Settings Tab Component
function BudgetSettingsTab({
	department,
	isEditing,
	editData,
	handleSettingChange,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Complex query result type from orpc with nested relations
	department: any;
	isEditing: boolean;
	editData: Record<string, unknown>;
	handleSettingChange: (key: string, value: unknown) => void;
}) {
	return (
		<TabsContent className="space-y-6" value="budget">
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Budget</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<Label className="text-muted-foreground text-sm">
							Annual Budget
						</Label>
						{isEditing ? (
							<Input
								className="mt-1"
								min="0"
								onChange={(e) =>
									handleSettingChange(
										"annualBudget",
										Number.parseFloat(e.target.value)
									)
								}
								step="0.01"
								type="number"
								value={(
									(editData.settings as { annualBudget?: number })
										?.annualBudget ??
									department.settings?.annualBudget ??
									""
								).toString()}
							/>
						) : (
							<p className="mt-1 font-medium">
								{department.settings?.annualBudget
									? `${department.settings.budgetCurrency ?? "GYD"} ${department.settings.annualBudget.toLocaleString()}`
									: "Not set"}
							</p>
						)}
					</div>

					<div>
						<Label className="text-muted-foreground text-sm">Currency</Label>
						{isEditing ? (
							<Select
								onValueChange={(value) =>
									handleSettingChange("budgetCurrency", value)
								}
								value={
									(editData.settings as { budgetCurrency?: string })
										?.budgetCurrency ??
									department.settings?.budgetCurrency ??
									"GYD"
								}
							>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GYD">GYD - Guyanese Dollar</SelectItem>
									<SelectItem value="USD">USD - US Dollar</SelectItem>
									<SelectItem value="EUR">EUR - Euro</SelectItem>
									<SelectItem value="GBP">GBP - British Pound</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<p className="mt-1 font-medium">
								{department.settings?.budgetCurrency ?? "GYD"}
							</p>
						)}
					</div>
				</div>
			</Card>

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Approval Settings</h2>
				<div className="space-y-4">
					<ApprovalCheckbox
						checked={
							(
								editData.settings as {
									requiresApprovalForLeave?: boolean;
								}
							)?.requiresApprovalForLeave ??
							department.settings?.requiresApprovalForLeave ??
							false
						}
						description="Employees must get approval before taking leave"
						isEditing={isEditing}
						label="Require approval for leave requests"
						onCheckedChange={(checked) =>
							handleSettingChange("requiresApprovalForLeave", checked)
						}
					/>

					<Separator />

					<ApprovalCheckbox
						checked={
							(
								editData.settings as {
									requiresApprovalForExpenses?: boolean;
								}
							)?.requiresApprovalForExpenses ??
							department.settings?.requiresApprovalForExpenses ??
							false
						}
						description="Expenses must be approved before reimbursement"
						isEditing={isEditing}
						label="Require approval for expenses"
						onCheckedChange={(checked) =>
							handleSettingChange("requiresApprovalForExpenses", checked)
						}
					/>

					<Separator />

					<ApprovalCheckbox
						checked={
							(
								editData.settings as {
									notifyHeadOnNewEmployee?: boolean;
								}
							)?.notifyHeadOnNewEmployee ??
							department.settings?.notifyHeadOnNewEmployee ??
							false
						}
						description="Send notification when a new employee joins"
						isEditing={isEditing}
						label="Notify department head on new employee"
						onCheckedChange={(checked) =>
							handleSettingChange("notifyHeadOnNewEmployee", checked)
						}
					/>
				</div>
			</Card>
		</TabsContent>
	);
}

// Positions Tab Component
// biome-ignore lint/suspicious/noExplicitAny: Complex query result type from orpc with nested relations
function PositionsTab({ department }: { department: any }) {
	return (
		<TabsContent className="space-y-6" value="positions">
			<Card className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Positions</h2>
					<Button
						onClick={() =>
							toast.info("Position management feature coming soon!")
						}
					>
						Add Position
					</Button>
				</div>

				{department.positions && department.positions.length > 0 ? (
					<div className="space-y-3">
						{/* biome-ignore lint/suspicious/noExplicitAny: Type inference from map callback */}
						{department.positions.map((position: any) => (
							<Card className="p-4" key={position.id}>
								<div className="flex items-start justify-between">
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-semibold">{position.title}</h3>
											{getStatusBadge(position.isActive)}
										</div>
										<p className="mt-1 text-muted-foreground text-sm">
											Code: {position.code}
										</p>
										{position.description && (
											<p className="mt-2 text-sm">{position.description}</p>
										)}
										{position.level && (
											<p className="mt-2 text-muted-foreground text-xs">
												Level: {position.level}
												{position.grade && ` • Grade: ${position.grade}`}
											</p>
										)}
									</div>
									<Button
										onClick={() =>
											toast.info("Position details feature coming soon!")
										}
										size="sm"
										variant="outline"
									>
										View Details
									</Button>
								</div>
							</Card>
						))}
					</div>
				) : (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">
							No positions in this department yet.
						</p>
						<Button
							className="mt-4"
							onClick={() =>
								toast.info("Position management feature coming soon!")
							}
							variant="outline"
						>
							Add First Position
						</Button>
					</div>
				)}
			</Card>
		</TabsContent>
	);
}

// Employees Tab Component
function EmployeesTab({
	department,
	navigate,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Complex query result type from orpc with nested relations
	department: any;
	navigate: ReturnType<typeof useNavigate>;
}) {
	return (
		<TabsContent className="space-y-6" value="employees">
			<Card className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Employees</h2>
					<Button
						onClick={() =>
							navigate({
								to: "/employees/new",
								search: { departmentId: department.id },
							})
						}
					>
						<UserMultiple02Icon className="mr-2 h-4 w-4" />
						Add Employee
					</Button>
				</div>

				<div className="py-12 text-center">
					<p className="text-muted-foreground">
						Employee list will be displayed here.
					</p>
					<p className="mt-2 text-muted-foreground text-xs">
						This requires the employees relation to be added to the departments
						schema.
					</p>
				</div>
			</Card>
		</TabsContent>
	);
}

// Main component
function DepartmentRoute() {
	const { departmentId } = Route.useParams();
	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<Record<string, unknown>>({});

	const { data: department, isLoading } = useQuery({
		...orpc.departments.get.queryOptions({ input: { id: departmentId } }),
	});

	const updateMutation = useMutation({
		...orpc.departments.update.mutationOptions(),
		onSuccess: () => {
			toast.success("Department updated successfully!");
			setIsEditing(false);
			setEditData({});
		},
		onError: (error: Error) => {
			toast.error(`Failed to update department: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		...orpc.departments.delete.mutationOptions(),
		onSuccess: () => {
			toast.success("Department deactivated successfully");
			navigate({ to: "/departments" });
		},
		onError: (error: Error) => {
			toast.error(`Failed to deactivate department: ${error.message}`);
		},
	});

	const handleSave = () => {
		updateMutation.mutate({
			id: departmentId,
			...editData,
		});
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditData({});
	};

	const handleDeactivate = () => {
		deleteMutation.mutate({ id: departmentId });
	};

	const handleFieldChange = (key: string, value: string) => {
		setEditData((prev) => ({ ...prev, [key]: value }));
	};

	const handleSettingChange = (key: string, value: unknown) => {
		setEditData((prev) => ({
			...prev,
			settings: {
				...(typeof prev.settings === "object" && prev.settings !== null
					? prev.settings
					: {}),
				[key]: value,
			},
		}));
	};

	if (isLoading) {
		return <LoadingState />;
	}

	if (!department) {
		return <NotFoundState onBack={() => navigate({ to: "/departments" })} />;
	}

	return (
		<div className="container mx-auto max-w-6xl space-y-6 p-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					<Button
						onClick={() => navigate({ to: "/departments" })}
						size="icon"
						variant="ghost"
					>
						<ArrowLeft01Icon className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<Building03Icon className="h-8 w-8 text-muted-foreground" />
							<div>
								<div className="flex items-center gap-3">
									<h1 className="font-bold text-3xl">{department.name}</h1>
									{getStatusBadge(department.isActive)}
								</div>
								<p className="mt-1 text-muted-foreground">
									Code: {department.code}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button onClick={handleCancel} variant="outline">
								<Cancel01Icon className="mr-2 h-4 w-4" />
								Cancel
							</Button>
							<Button disabled={updateMutation.isPending} onClick={handleSave}>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</>
					) : (
						<>
							<Button onClick={() => setIsEditing(true)} variant="outline">
								<PencilEdit02Icon className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button size="icon" variant="ghost">
										<MoreVerticalIcon className="h-5 w-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={handleDeactivate}>
										Deactivate Department
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>

			{/* Tabs */}
			<Tabs className="space-y-6" defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="budget">Budget & Settings</TabsTrigger>
					<TabsTrigger value="positions">
						Positions
						{department.positions && department.positions.length > 0 && (
							<Badge className="ml-2" variant="secondary">
								{department.positions.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="employees">Employees</TabsTrigger>
				</TabsList>

				<OverviewTab
					department={department}
					editData={editData}
					handleFieldChange={handleFieldChange}
					isEditing={isEditing}
					navigate={navigate}
				/>

				<BudgetSettingsTab
					department={department}
					editData={editData}
					handleSettingChange={handleSettingChange}
					isEditing={isEditing}
				/>

				<PositionsTab department={department} />

				<EmployeesTab department={department} navigate={navigate} />
			</Tabs>
		</div>
	);
}
