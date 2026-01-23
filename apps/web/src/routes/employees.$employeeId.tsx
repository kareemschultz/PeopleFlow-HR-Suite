// biome-ignore lint/style/useFilenamingConvention: TanStack Router requires $param syntax for dynamic routes
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Calendar03Icon,
	Call02Icon,
	Mail01Icon,
	MoreVerticalIcon,
	PencilEdit01Icon,
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

// Helper functions
function formatCurrency(amount: number | null | undefined): string {
	if (!amount) {
		return "$0.00";
	}
	return new Intl.NumberFormat("en-GY", {
		style: "currency",
		currency: "GYD",
	}).format(amount / 100);
}

function formatDate(date: string | null | undefined): string {
	if (!date) {
		return "N/A";
	}
	return new Date(date).toLocaleDateString();
}

function getStatusBadge(status: string) {
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
}

// Loading state component
function LoadingState() {
	return (
		<div className="space-y-6 p-6">
			<Skeleton className="h-48 w-full" />
			<Skeleton className="h-96 w-full" />
		</div>
	);
}

// Not found state component
function NotFoundState({ onBack }: { onBack: () => void }) {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Card className="p-8 text-center">
				<h2 className="font-semibold text-2xl">Employee Not Found</h2>
				<p className="mt-2 text-muted-foreground">
					The employee you're looking for doesn't exist or has been removed.
				</p>
				<Button className="mt-4" onClick={onBack}>
					Back to Employees
				</Button>
			</Card>
		</div>
	);
}

// Employee header component
function EmployeeHeader({
	employee,
	isEditing,
	onEdit,
	onCancel,
	onSave,
	isSaving,
	navigate,
	onDeactivate,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Complex query result type from orpc with nested relations
	employee: any;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSave: () => void;
	isSaving: boolean;
	navigate: ReturnType<typeof useNavigate>;
	onDeactivate: () => void;
}) {
	return (
		<Card className="p-6">
			<div className="flex items-start justify-between">
				<div className="flex gap-6">
					{/* Avatar */}
					<div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
						{employee.avatar ? (
							<img
								alt={`${employee.firstName} ${employee.lastName}`}
								className="h-24 w-24 rounded-full object-cover"
								height={96}
								src={employee.avatar}
								width={96}
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
									<Call02Icon className="h-4 w-4 text-muted-foreground" />
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
							<Button onClick={onCancel} variant="outline">
								Cancel
							</Button>
							<Button disabled={isSaving} onClick={onSave}>
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</>
					) : (
						<>
							<Button onClick={onEdit}>
								<PencilEdit01Icon className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button size="icon" variant="outline">
										<MoreVerticalIcon className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() =>
											navigate({ to: `/payroll?employeeId=${employee.id}` })
										}
									>
										View Payslips
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={onDeactivate}>
										Deactivate Employee
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}

// Main component
function EmployeeDetailPage() {
	const { employeeId } = Route.useParams();
	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<Record<string, unknown>>({});

	const {
		data: employee,
		isLoading,
		refetch,
	} = useQuery({
		...orpc.employees.get.queryOptions({ input: { id: employeeId } }),
	});

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
		deleteEmployee.mutate({ id: employeeId });
	};

	if (isLoading) {
		return <LoadingState />;
	}

	if (!employee) {
		return <NotFoundState onBack={() => navigate({ to: "/employees" })} />;
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6">
			<EmployeeHeader
				employee={employee}
				isEditing={isEditing}
				isSaving={updateEmployee.isPending}
				navigate={navigate}
				onCancel={() => setIsEditing(false)}
				onDeactivate={handleDeactivate}
				onEdit={() => setIsEditing(true)}
				onSave={handleSave}
			/>

			{/* Tabs */}
			<Tabs className="space-y-6" defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="compensation">Compensation</TabsTrigger>
					<TabsTrigger value="personal">Personal</TabsTrigger>
					<TabsTrigger value="employment">Employment</TabsTrigger>
					<TabsTrigger value="notes">Notes</TabsTrigger>
				</TabsList>

				{/* Tab Contents - Placeholder for extraction */}
				<TabsContent value="overview">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Overview</h2>
						<p className="text-muted-foreground">
							Overview tab content - to be implemented
						</p>
					</Card>
				</TabsContent>

				<TabsContent value="compensation">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Compensation</h2>
						<div className="space-y-4">
							<div>
								<Label className="text-muted-foreground text-sm">
									Base Salary
								</Label>
								<p className="mt-1 font-medium">
									{formatCurrency(employee.baseSalary)}
								</p>
							</div>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="personal">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Personal Information</h2>
						<p className="text-muted-foreground">
							Personal info tab - to be implemented
						</p>
					</Card>
				</TabsContent>

				<TabsContent value="employment">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Employment Details</h2>
						<p className="text-muted-foreground">
							Employment tab - to be implemented
						</p>
					</Card>
				</TabsContent>

				<TabsContent value="notes">
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Notes</h2>
						{isEditing ? (
							<Textarea
								onChange={(e) =>
									setEditData((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder="Add notes about this employee..."
								rows={6}
								value={(editData.notes as string) ?? employee.notes ?? ""}
							/>
						) : (
							<p className="text-muted-foreground">
								{employee.notes || "No notes added yet."}
							</p>
						)}
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
