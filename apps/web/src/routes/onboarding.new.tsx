import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "hugeicons-react";
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
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding/new")({
	component: NewOnboardingPage,
});

function NewOnboardingPage() {
	const navigate = useNavigate();
	const { organizationId } = useOrganization();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		employeeId: "",
		templateId: "",
		startDate: "",
	});

	// Get employees
	const { data: employees } = useQuery({
		...orpc.employees.list.queryOptions({
			input: { organizationId: organizationId || "" },
		}),
		enabled: !!organizationId,
	});

	// Get onboarding templates
	const { data: templates } = useQuery({
		...orpc.workflowTemplates.list.queryOptions({
			input: {
				organizationId: organizationId || "",
				type: "onboarding",
			},
		}),
		enabled: !!organizationId,
	});

	// Create mutation
	const createMutation = useMutation({
		...orpc.workflows.create.mutationOptions(),
		onSuccess: () => {
			toast.success("Onboarding workflow created successfully!");
			queryClient.invalidateQueries({
				queryKey: ["workflows"],
			});
			navigate({ to: "/onboarding" });
		},
		onError: (error: Error) => {
			toast.error(`Failed to create workflow: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!organizationId) {
			toast.error("No organization selected");
			return;
		}

		if (!(formData.employeeId && formData.templateId && formData.startDate)) {
			toast.error("Please fill in all required fields");
			return;
		}

		createMutation.mutate({
			organizationId,
			employeeId: formData.employeeId,
			templateId: formData.templateId,
			type: "onboarding",
			startDate: formData.startDate,
		});
	};

	return (
		<div className="container mx-auto max-w-2xl space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Button
					onClick={() => {
						navigate({ to: "/onboarding" });
					}}
					size="icon"
					variant="ghost"
				>
					<ArrowLeft01Icon className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">Start Onboarding</h1>
					<p className="text-muted-foreground">
						Create a new onboarding workflow for an employee
					</p>
				</div>
			</div>

			<Card className="p-6">
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="employeeId">
							Employee <span className="text-destructive">*</span>
						</Label>
						<Select
							onValueChange={(value) => {
								setFormData({ ...formData, employeeId: value });
							}}
							value={formData.employeeId}
						>
							<SelectTrigger id="employeeId">
								<SelectValue placeholder="Select employee" />
							</SelectTrigger>
							<SelectContent>
								{employees?.map((emp) => (
									<SelectItem key={emp.id} value={emp.id}>
										{emp.firstName} {emp.lastName} ({emp.employeeNumber})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="templateId">
							Onboarding Template <span className="text-destructive">*</span>
						</Label>
						<Select
							onValueChange={(value) => {
								setFormData({ ...formData, templateId: value });
							}}
							value={formData.templateId}
						>
							<SelectTrigger id="templateId">
								<SelectValue placeholder="Select template" />
							</SelectTrigger>
							<SelectContent>
								{templates?.map((template) => (
									<SelectItem key={template.id} value={template.id}>
										{template.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="startDate">
							Start Date <span className="text-destructive">*</span>
						</Label>
						<Input
							id="startDate"
							onChange={(e) => {
								setFormData({ ...formData, startDate: e.target.value });
							}}
							required
							type="date"
							value={formData.startDate}
						/>
						<p className="text-muted-foreground text-xs">
							Target completion date will be automatically calculated based on
							template duration
						</p>
					</div>

					<div className="flex gap-3">
						<Button
							className="flex-1"
							disabled={createMutation.isPending}
							type="submit"
						>
							{createMutation.isPending
								? "Creating..."
								: "Create Onboarding Workflow"}
						</Button>
						<Button
							onClick={() => {
								navigate({ to: "/onboarding" });
							}}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}
