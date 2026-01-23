import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CalendarCheckIn01Icon,
	CalendarCheckOut01Icon,
	Clock03Icon,
	PlusSignIcon,
	UserGroupIcon,
} from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/leave/")({
	component: LeaveManagementPage,
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

function LeaveManagementPage() {
	const { organizationId, hasOrganization } = useOrganization();

	// Get leave requests
	const { data: leaveRequests, isLoading } = useQuery({
		...orpc.leaveManagement.listLeaveRequests.queryOptions({
			input: { organizationId: organizationId || "" },
		}),
		enabled: hasOrganization && !!organizationId,
	});

	// Get leave balances for current user
	const { data: leaveBalances } = useQuery({
		...orpc.leaveManagement.getEmployeeBalances.queryOptions({
			input: {
				organizationId: organizationId || "",
				employeeId: "current", // TODO: Get from user session
			},
		}),
		enabled: hasOrganization && !!organizationId,
	});

	// Get pending requests count
	const pendingRequests = leaveRequests?.filter(
		(req) => req.status === "pending"
	);

	// Get approved upcoming leaves
	const upcomingLeaves = leaveRequests?.filter(
		(req) =>
			req.status === "approved" &&
			new Date(req.startDate) > new Date() &&
			new Date(req.startDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
	);

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">Loading leave data...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Leave Management</h1>
					<p className="text-muted-foreground">
						Manage employee time off and leave requests
					</p>
				</div>
				<div className="flex gap-2">
					<Link to="/leave/new">
						<Button>
							<PlusSignIcon className="mr-2 h-4 w-4" />
							Request Leave
						</Button>
					</Link>
					<Button variant="outline">
						<UserGroupIcon className="mr-2 h-4 w-4" />
						Manage Policies
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<Clock03Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{pendingRequests?.length || 0}
						</div>
						<p className="text-muted-foreground text-xs">Awaiting approval</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Leaves
						</CardTitle>
						<CalendarCheckIn01Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{upcomingLeaves?.length || 0}
						</div>
						<p className="text-muted-foreground text-xs">Next 30 days</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Annual Leave Balance
						</CardTitle>
						<CalendarCheckOut01Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{leaveBalances?.find((b) => b.leaveType?.code === "ANNUAL")
								?.available || 0}
						</div>
						<p className="text-muted-foreground text-xs">Days remaining</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Sick Leave Balance
						</CardTitle>
						<CalendarCheckOut01Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{leaveBalances?.find((b) => b.leaveType?.code === "SICK")
								?.available || 0}
						</div>
						<p className="text-muted-foreground text-xs">Days remaining</p>
					</CardContent>
				</Card>
			</div>

			{/* Recent Requests */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Leave Requests</CardTitle>
					<CardDescription>
						View and manage employee leave requests
					</CardDescription>
				</CardHeader>
				<CardContent>
					{leaveRequests && leaveRequests.length > 0 ? (
						<div className="space-y-4">
							{leaveRequests.slice(0, 10).map((request) => (
								<div
									className="flex items-center justify-between border-b py-3 last:border-0"
									key={request.id}
								>
									<div className="space-y-1">
										<p className="font-medium">
											{request.employee?.firstName} {request.employee?.lastName}
										</p>
										<p className="text-muted-foreground text-sm">
											{request.leaveType?.name || "Leave"} •{" "}
											{new Date(request.startDate).toLocaleDateString()} -{" "}
											{new Date(request.endDate).toLocaleDateString()}
										</p>
										<p className="text-muted-foreground text-xs">
											{request.totalDays} days
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={getStatusBadgeVariant(request.status)}>
											{request.status}
										</Badge>
										<Link params={{ leaveId: request.id }} to="/leave/$leaveId">
											<Button size="sm" variant="outline">
												View
											</Button>
										</Link>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="py-12 text-center">
							<p className="text-muted-foreground">No leave requests found</p>
							<Link to="/leave/new">
								<Button className="mt-4" variant="outline">
									<PlusSignIcon className="mr-2 h-4 w-4" />
									Create First Request
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Leave Balances */}
			{leaveBalances && leaveBalances.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Your Leave Balances</CardTitle>
						<CardDescription>Current leave entitlements</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{leaveBalances.map((balance) => (
								<Card key={balance.id}>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm">
											{balance.leaveType?.name || "Leave Type"}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Entitled:</span>
												<span className="font-medium">
													{balance.totalEntitled} days
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Used:</span>
												<span className="font-medium">{balance.used} days</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Pending:</span>
												<span className="font-medium">
													{balance.pending} days
												</span>
											</div>
											<div className="flex justify-between border-t pt-2">
												<span className="font-medium">Available:</span>
												<span className="font-bold">
													{balance.available} days
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
