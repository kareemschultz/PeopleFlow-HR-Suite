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
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/leave/new")({
	component: NewLeaveRequestPage,
});

function NewLeaveRequestPage() {
	const navigate = useNavigate();
	const { organizationId } = useOrganization();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		leaveTypeId: "",
		startDate: "",
		endDate: "",
		reason: "",
	});

	// Get leave types
	const { data: leaveTypes } = useQuery({
		...orpc.leaveManagement.listLeaveTypes.queryOptions({
			input: { organizationId: organizationId || "" },
		}),
		enabled: !!organizationId,
	});

	// Create mutation
	const createMutation = useMutation({
		...orpc.leaveManagement.createLeaveRequest.mutationOptions(),
		onSuccess: () => {
			toast.success("Leave request submitted successfully!");
			queryClient.invalidateQueries({
				queryKey: ["leaveManagement", "listLeaveRequests"],
			});
			navigate({ to: "/leave" });
		},
		onError: (error: Error) => {
			toast.error(`Failed to submit leave request: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!organizationId) {
			toast.error("No organization selected");
			return;
		}

		if (
			!(
				formData.leaveTypeId &&
				formData.startDate &&
				formData.endDate &&
				formData.reason
			)
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Calculate total days (simple calculation)
		const start = new Date(formData.startDate);
		const end = new Date(formData.endDate);
		const totalDays =
			Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		createMutation.mutate({
			organizationId,
			leaveTypeId: formData.leaveTypeId,
			employeeId: "current", // TODO: Get from user session
			startDate: formData.startDate,
			endDate: formData.endDate,
			totalDays,
			reason: formData.reason || undefined,
		});
	};

	return (
		<div className="container mx-auto max-w-2xl space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Button
					onClick={() => {
						navigate({ to: "/leave" });
					}}
					size="icon"
					variant="ghost"
				>
					<ArrowLeft01Icon className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">Request Leave</h1>
					<p className="text-muted-foreground">
						Submit a new leave request for approval
					</p>
				</div>
			</div>

			<Card className="p-6">
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="leaveTypeId">
							Leave Type <span className="text-destructive">*</span>
						</Label>
						<Select
							onValueChange={(value) => {
								setFormData({ ...formData, leaveTypeId: value });
							}}
							value={formData.leaveTypeId}
						>
							<SelectTrigger id="leaveTypeId">
								<SelectValue placeholder="Select leave type" />
							</SelectTrigger>
							<SelectContent>
								{leaveTypes?.map((type) => (
									<SelectItem key={type.id} value={type.id}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
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
						</div>

						<div className="space-y-2">
							<Label htmlFor="endDate">
								End Date <span className="text-destructive">*</span>
							</Label>
							<Input
								id="endDate"
								min={formData.startDate}
								onChange={(e) => {
									setFormData({ ...formData, endDate: e.target.value });
								}}
								required
								type="date"
								value={formData.endDate}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reason">
							Reason <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="reason"
							onChange={(e) => {
								setFormData({ ...formData, reason: e.target.value });
							}}
							placeholder="Brief reason for leave request"
							required
							rows={3}
							value={formData.reason}
						/>
					</div>

					<div className="flex gap-3">
						<Button
							className="flex-1"
							disabled={createMutation.isPending}
							type="submit"
						>
							{createMutation.isPending ? "Submitting..." : "Submit Request"}
						</Button>
						<Button
							onClick={() => {
								navigate({ to: "/leave" });
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
