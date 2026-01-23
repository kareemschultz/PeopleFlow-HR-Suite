import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
} from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/leave/$leaveId")({
	component: LeaveDetailPage,
});

function getStatusBadgeVariant(status: string) {
	if (status === "approved") {
		return "default";
	}
	if (status === "pending") {
		return "secondary";
	}
	return "destructive";
}

function LeaveDetailPage() {
	const { leaveId } = Route.useParams();
	const navigate = useNavigate();
	const { organizationId } = useOrganization();
	const queryClient = useQueryClient();
	const [rejectionReason, setRejectionReason] = useState("");

	// Get leave request details (fetch all and filter)
	const { data: leaveRequests, isLoading } = useQuery({
		...orpc.leaveManagement.listLeaveRequests.queryOptions({
			input: { organizationId: organizationId || "" },
		}),
		enabled: !!organizationId && !!leaveId,
	});

	const leaveRequest = leaveRequests?.find((req) => req.id === leaveId);

	// Approve mutation
	const approveMutation = useMutation({
		...orpc.leaveManagement.approveLeaveRequest.mutationOptions(),
		onSuccess: () => {
			toast.success("Leave request approved!");
			queryClient.invalidateQueries({
				queryKey: ["leaveManagement"],
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to approve: ${error.message}`);
		},
	});

	// Reject mutation
	const rejectMutation = useMutation({
		...orpc.leaveManagement.rejectLeaveRequest.mutationOptions(),
		onSuccess: () => {
			toast.success("Leave request rejected");
			queryClient.invalidateQueries({
				queryKey: ["leaveManagement"],
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to reject: ${error.message}`);
		},
	});

	const handleApprove = () => {
		if (!organizationId) {
			return;
		}
		approveMutation.mutate({
			requestId: leaveId,
			approverId: "current", // TODO: Get from user session
		});
	};

	const handleReject = () => {
		if (!(organizationId && rejectionReason.trim())) {
			toast.error("Please provide a reason for rejection");
			return;
		}
		rejectMutation.mutate({
			requestId: leaveId,
			approverId: "current", // TODO: Get from user session
			reason: rejectionReason,
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">Loading leave request...</div>
				</div>
			</div>
		);
	}

	if (!leaveRequest) {
		return (
			<div className="container mx-auto p-6">
				<div className="py-12 text-center">
					<p className="text-muted-foreground">Leave request not found</p>
					<Button
						className="mt-4"
						onClick={() => {
							navigate({ to: "/leave" });
						}}
					>
						Back to Leave Management
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl space-y-6 p-6">
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
				<div className="flex-1">
					<h1 className="font-bold text-3xl">Leave Request Details</h1>
					<p className="text-muted-foreground">
						Review and manage leave request
					</p>
				</div>
				<Badge variant={getStatusBadgeVariant(leaveRequest.status)}>
					{leaveRequest.status}
				</Badge>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Employee Information */}
				<Card>
					<CardHeader>
						<CardTitle>Employee Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<Label className="text-muted-foreground">Name</Label>
							<p className="font-medium">
								{leaveRequest.employee?.firstName}{" "}
								{leaveRequest.employee?.lastName}
							</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Employee Number</Label>
							<p className="font-medium">
								{leaveRequest.employee?.employeeNumber}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Leave Details */}
				<Card>
					<CardHeader>
						<CardTitle>Leave Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<Label className="text-muted-foreground">Leave Type</Label>
							<p className="font-medium">
								{leaveRequest.leaveType?.name || "N/A"}
							</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Duration</Label>
							<p className="font-medium">
								{new Date(leaveRequest.startDate).toLocaleDateString()} -{" "}
								{new Date(leaveRequest.endDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Total Days</Label>
							<p className="font-medium">{leaveRequest.totalDays} days</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Request Information */}
			<Card>
				<CardHeader>
					<CardTitle>Request Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{leaveRequest.reason && (
						<div>
							<Label className="text-muted-foreground">Reason</Label>
							<p className="mt-1">{leaveRequest.reason}</p>
						</div>
					)}
					<div>
						<Label className="text-muted-foreground">Submitted On</Label>
						<p className="mt-1">
							{new Date(leaveRequest.createdAt).toLocaleString()}
						</p>
					</div>
					{leaveRequest.rejectionReason && (
						<div>
							<Label className="text-muted-foreground">Rejection Reason</Label>
							<p className="mt-1">{leaveRequest.rejectionReason}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Action Section - Only show for pending requests */}
			{leaveRequest.status === "pending" && (
				<Card>
					<CardHeader>
						<CardTitle>Review Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="rejectionReason">
								Rejection Reason (required for rejection)
							</Label>
							<Textarea
								id="rejectionReason"
								onChange={(e) => {
									setRejectionReason(e.target.value);
								}}
								placeholder="Provide reason if rejecting"
								rows={3}
								value={rejectionReason}
							/>
						</div>
						<Separator />
						<div className="flex gap-3">
							<Button
								className="flex-1"
								disabled={approveMutation.isPending || rejectMutation.isPending}
								onClick={handleApprove}
							>
								<CheckmarkCircle02Icon className="mr-2 h-4 w-4" />
								Approve
							</Button>
							<Button
								className="flex-1"
								disabled={approveMutation.isPending || rejectMutation.isPending}
								onClick={handleReject}
								variant="destructive"
							>
								<CancelCircleIcon className="mr-2 h-4 w-4" />
								Reject
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
