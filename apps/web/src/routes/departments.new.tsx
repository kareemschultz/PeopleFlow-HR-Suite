import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/departments/new")({
	component: NewDepartmentRoute,
});

interface DepartmentFormData {
	name: string;
	code: string;
	description: string;
	parentDepartmentId: string;
	location: string;
	annualBudget: string;
	budgetCurrency: string;
	requiresApprovalForLeave: boolean;
	requiresApprovalForExpenses: boolean;
	notifyHeadOnNewEmployee: boolean;
}

function NewDepartmentRoute() {
	const navigate = useNavigate();
	const { organizationId, hasOrganization } = useOrganization();

	const [formData, setFormData] = useState<DepartmentFormData>({
		name: "",
		code: "",
		description: "",
		parentDepartmentId: "",
		location: "",
		annualBudget: "",
		budgetCurrency: "GYD",
		requiresApprovalForLeave: false,
		requiresApprovalForExpenses: false,
		notifyHeadOnNewEmployee: false,
	});

	// Fetch existing departments for parent department selection
	const { data: departments } = useQuery({
		...orpc.departments.list.queryOptions({
			organizationId,
			isActive: true,
		}),
		enabled: hasOrganization,
	});

	const createDepartmentMutation = useMutation({
		...orpc.departments.create.mutationOptions(),
		onSuccess: (data) => {
			toast.success("Department created successfully!");
			navigate({
				to: "/departments/$departmentId",
				params: { departmentId: data.id },
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to create department: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!organizationId) {
			toast.error("Organization not found");
			return;
		}

		// Build settings object only if any budget or approval settings are provided
		const settings:
			| {
					annualBudget?: number;
					budgetCurrency?: string;
					requiresApprovalForLeave?: boolean;
					requiresApprovalForExpenses?: boolean;
					notifyHeadOnNewEmployee?: boolean;
			  }
			| undefined =
			formData.annualBudget ||
			formData.requiresApprovalForLeave ||
			formData.requiresApprovalForExpenses ||
			formData.notifyHeadOnNewEmployee
				? {
						annualBudget: formData.annualBudget
							? Number.parseFloat(formData.annualBudget)
							: undefined,
						budgetCurrency:
							formData.annualBudget && formData.budgetCurrency
								? formData.budgetCurrency
								: undefined,
						requiresApprovalForLeave:
							formData.requiresApprovalForLeave || undefined,
						requiresApprovalForExpenses:
							formData.requiresApprovalForExpenses || undefined,
						notifyHeadOnNewEmployee:
							formData.notifyHeadOnNewEmployee || undefined,
					}
				: undefined;

		createDepartmentMutation.mutate({
			organizationId,
			name: formData.name,
			code: formData.code,
			description: formData.description || undefined,
			parentDepartmentId: formData.parentDepartmentId || undefined,
			location: formData.location || undefined,
			settings,
		});
	};

	return (
		<div className="container mx-auto max-w-4xl space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					onClick={() => navigate({ to: "/departments" })}
					size="icon"
					variant="ghost"
				>
					<ArrowLeft01Icon className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">Create New Department</h1>
					<p className="text-muted-foreground">
						Add a new department to your organization
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="space-y-6">
					{/* Basic Information */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Basic Information</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="name">
										Department Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="name"
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder="e.g., Human Resources"
										required
										value={formData.name}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="code">
										Department Code <span className="text-destructive">*</span>
									</Label>
									<Input
										id="code"
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, code: e.target.value }))
										}
										placeholder="e.g., HR"
										required
										value={formData.code}
									/>
									<p className="text-muted-foreground text-xs">
										Short code used for identification (max 50 characters)
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Describe the department's purpose and responsibilities..."
									rows={3}
									value={formData.description}
								/>
							</div>
						</div>
					</Card>

					{/* Organizational Structure */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">
							Organizational Structure
						</h2>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="parentDepartmentId">Parent Department</Label>
								<Select
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											parentDepartmentId: value,
										}))
									}
									value={formData.parentDepartmentId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select parent department (optional)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">
											None (Top-level department)
										</SelectItem>
										{departments?.map((dept) => (
											<SelectItem key={dept.id} value={dept.id}>
												{dept.name} ({dept.code})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									Select a parent department to create a sub-department
								</p>
							</div>
						</div>
					</Card>

					{/* Location */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Location</h2>
						<div className="space-y-2">
							<Label htmlFor="location">Office Location</Label>
							<Input
								id="location"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, location: e.target.value }))
								}
								placeholder="e.g., Building A, Floor 2"
								value={formData.location}
							/>
							<p className="text-muted-foreground text-xs">
								Physical location of the department (building, floor, etc.)
							</p>
						</div>
					</Card>

					{/* Budget Settings */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">Budget Settings</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="annualBudget">Annual Budget</Label>
									<Input
										id="annualBudget"
										min="0"
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												annualBudget: e.target.value,
											}))
										}
										placeholder="0.00"
										step="0.01"
										type="number"
										value={formData.annualBudget}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="budgetCurrency">Currency</Label>
									<Select
										onValueChange={(value) =>
											setFormData((prev) => ({
												...prev,
												budgetCurrency: value,
											}))
										}
										value={formData.budgetCurrency}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="GYD">GYD - Guyanese Dollar</SelectItem>
											<SelectItem value="USD">USD - US Dollar</SelectItem>
											<SelectItem value="EUR">EUR - Euro</SelectItem>
											<SelectItem value="GBP">GBP - British Pound</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</Card>

					{/* Approval & Notification Settings */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-xl">
							Approval & Notification Settings
						</h2>
						<div className="space-y-4">
							<div className="flex items-start space-x-3">
								<Checkbox
									checked={formData.requiresApprovalForLeave}
									id="requiresApprovalForLeave"
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											requiresApprovalForLeave: checked === true,
										}))
									}
								/>
								<div className="space-y-1">
									<Label
										className="cursor-pointer font-medium text-sm"
										htmlFor="requiresApprovalForLeave"
									>
										Require approval for leave requests
									</Label>
									<p className="text-muted-foreground text-xs">
										Employees in this department must get approval before taking
										leave
									</p>
								</div>
							</div>

							<Separator />

							<div className="flex items-start space-x-3">
								<Checkbox
									checked={formData.requiresApprovalForExpenses}
									id="requiresApprovalForExpenses"
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											requiresApprovalForExpenses: checked === true,
										}))
									}
								/>
								<div className="space-y-1">
									<Label
										className="cursor-pointer font-medium text-sm"
										htmlFor="requiresApprovalForExpenses"
									>
										Require approval for expenses
									</Label>
									<p className="text-muted-foreground text-xs">
										Expenses from this department must be approved before
										reimbursement
									</p>
								</div>
							</div>

							<Separator />

							<div className="flex items-start space-x-3">
								<Checkbox
									checked={formData.notifyHeadOnNewEmployee}
									id="notifyHeadOnNewEmployee"
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											notifyHeadOnNewEmployee: checked === true,
										}))
									}
								/>
								<div className="space-y-1">
									<Label
										className="cursor-pointer font-medium text-sm"
										htmlFor="notifyHeadOnNewEmployee"
									>
										Notify department head on new employee
									</Label>
									<p className="text-muted-foreground text-xs">
										Send notification to the department head when a new employee
										joins
									</p>
								</div>
							</div>
						</div>
					</Card>

					{/* Actions */}
					<div className="flex justify-end gap-3">
						<Button
							onClick={() => navigate({ to: "/departments" })}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={createDepartmentMutation.isPending} type="submit">
							{createDepartmentMutation.isPending
								? "Creating..."
								: "Create Department"}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
