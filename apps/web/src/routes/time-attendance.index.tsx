import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar03Icon,
	CircleLockCheck02Icon as ClockCheckIcon,
	FingerprintScanIcon,
	UserGroupIcon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/time-attendance/")({
	component: TimeAttendancePage,
});

function TimeAttendancePage() {
	const { organizationId, hasOrganization } = useOrganization();

	// Get active time entry if any
	const { data: activeEntry } = useQuery({
		...orpc.timeAttendance.getActiveEntry.queryOptions({
			input: { employeeId: "current" }, // TODO: Get from user session
		}),
		enabled: hasOrganization && !!organizationId,
	});

	// Get today's entries
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const endOfDay = new Date(today);
	endOfDay.setHours(23, 59, 59, 999);

	const { data: todayEntries } = useQuery({
		...orpc.timeAttendance.listEntries.queryOptions({
			input: {
				organizationId: organizationId || "",
				startDate: today.toISOString(),
				endDate: endOfDay.toISOString(),
			},
		}),
		enabled: hasOrganization && !!organizationId,
	});

	// Get pending entries count
	const { data: pendingEntries } = useQuery({
		...orpc.timeAttendance.listEntries.queryOptions({
			input: {
				organizationId: organizationId || "",
				status: "pending",
			},
		}),
		enabled: hasOrganization && !!organizationId,
	});
	const pendingCount = pendingEntries?.length || 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Time & Attendance</h1>
					<p className="text-muted-foreground">
						Manage employee time tracking and attendance
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">View All Entries</Button>
					<Button variant="outline">Manage Shifts</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Clock Status</CardTitle>
						<ClockCheckIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{activeEntry ? "Clocked In" : "Clocked Out"}
						</div>
						<p className="text-muted-foreground text-xs">
							{activeEntry
								? `Since ${new Date(activeEntry.clockIn).toLocaleTimeString()}`
								: "Not currently working"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Today's Entries
						</CardTitle>
						<Calendar03Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{todayEntries?.length || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							Clock in/out records
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Approvals
						</CardTitle>
						<UserGroupIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingCount || 0}</div>
						<p className="text-muted-foreground text-xs">Awaiting review</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Devices</CardTitle>
						<FingerprintScanIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">-</div>
						<p className="text-muted-foreground text-xs">Biometric devices</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card className="transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle>Clock In/Out</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Record your work hours with manual or biometric clock in/out
						</p>
						<Link to="/time-attendance/clock">
							<Button className="w-full">
								Go to Clock <ClockCheckIcon className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle>Time Entries</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							View, edit, and approve employee time entries
						</p>
						<Button className="w-full" variant="outline">
							View Entries <Calendar03Icon className="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle>Shift Management</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Define work shifts and assign employees to schedules
						</p>
						<Button className="w-full" variant="outline">
							Manage Shifts <UserGroupIcon className="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					{todayEntries && todayEntries.length > 0 ? (
						<div className="space-y-2">
							{todayEntries.slice(0, 5).map((entry) => (
								<div
									className="flex items-center justify-between border-b py-2 last:border-0"
									key={entry.id}
								>
									<div>
										<p className="font-medium">
											{entry.employee?.firstName} {entry.employee?.lastName}
										</p>
										<p className="text-muted-foreground text-sm">
											{entry.employee?.employeeNumber}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium text-sm">
											{new Date(entry.clockIn).toLocaleTimeString()}
											{entry.clockOut &&
												` - ${new Date(entry.clockOut).toLocaleTimeString()}`}
										</p>
										<p className="text-muted-foreground text-xs">
											{entry.totalHours
												? `${entry.totalHours.toFixed(2)} hours`
												: "In progress"}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="py-8 text-center text-muted-foreground">
							No time entries recorded today
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
