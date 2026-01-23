import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	Building03Icon as Building,
	Calendar01Icon as Calendar,
	Coins01Icon as Coins,
	UserGroupIcon as Users,
} from "hugeicons-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organization";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Type for route context
interface DashboardContext {
	session: Awaited<ReturnType<typeof authClient.getSession>>;
	customerState: Awaited<ReturnType<typeof authClient.customer.state>>["data"];
}

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async (): Promise<DashboardContext> => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		const { data: customerState } = await authClient.customer.state();
		return { session, customerState };
	},
});

function RouteComponent() {
	const { session, customerState } =
		Route.useRouteContext() as DashboardContext;

	const { organizationId, organization, hasOrganization } = useOrganization();

	const _privateData = useQuery(orpc.privateData.queryOptions());

	// Fetch employee summary
	const { data: employeeSummary, isLoading: isEmployeeLoading } = useQuery({
		...orpc.reports.employeeSummary.queryOptions({
			input: {
				organizationId,
			},
		}),
		enabled: hasOrganization,
	});

	// Fetch recent payroll runs
	const { data: recentPayrollRuns, isLoading: isPayrollLoading } = useQuery({
		...orpc.reports.recentPayrollRuns.queryOptions({
			input: {
				organizationId,
				limit: 5,
			},
		}),
		enabled: hasOrganization,
	});

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	const currencySymbol = organization?.currencySymbol ?? "$";

	return (
		<div className="container-padding section-spacing py-4 md:py-6 lg:py-8">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-responsive-2xl">Dashboard</h1>
					<p className="text-muted-foreground text-responsive-sm">
						Welcome back, {session.data?.user.name}
					</p>
				</div>
				<div className="flex-shrink-0">
					{hasProSubscription ? (
						<Button
							className="w-full sm:w-auto"
							onClick={async () => await authClient.customer.portal()}
							size="sm"
							variant="outline"
						>
							Manage Subscription
						</Button>
					) : (
						<Button
							className="w-full sm:w-auto"
							onClick={async () => await authClient.checkout({ slug: "pro" })}
							size="sm"
						>
							Upgrade to Pro
						</Button>
					)}
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					bgColor="bg-blue-100"
					icon={<Users className="h-6 w-6 text-blue-600" />}
					label="Total Employees"
					value={
						isEmployeeLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							(employeeSummary?.totalEmployees ?? 0)
						)
					}
				/>
				<StatCard
					bgColor="bg-green-100"
					icon={<Users className="h-6 w-6 text-green-600" />}
					label="Active Employees"
					value={
						isEmployeeLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							(employeeSummary?.activeEmployees ?? 0)
						)
					}
				/>
				<StatCard
					bgColor="bg-purple-100"
					icon={<Building className="h-6 w-6 text-purple-600" />}
					label="Departments"
					value={
						isEmployeeLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							(employeeSummary?.byDepartment?.length ?? 0)
						)
					}
				/>
				<StatCard
					bgColor="bg-orange-100"
					icon={<Coins className="h-6 w-6 text-orange-600" />}
					label="Recent Payroll Runs"
					value={
						isPayrollLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							(recentPayrollRuns?.length ?? 0)
						)
					}
				/>
			</div>

			{/* Department Breakdown */}
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Employees by Department</h2>
				{isEmployeeLoading && (
					<div className="space-y-2">
						{[1, 2, 3].map((id) => (
							<Skeleton
								className="h-10 w-full"
								key={`employee-skeleton-${id}`}
							/>
						))}
					</div>
				)}
				{!isEmployeeLoading && employeeSummary?.byDepartment?.length && (
					<div className="space-y-2">
						{employeeSummary.byDepartment.map((dept) => (
							<div
								className="flex items-center justify-between rounded-lg bg-muted p-3"
								key={dept.departmentId}
							>
								<span className="font-medium">{dept.departmentName}</span>
								<span className="text-muted-foreground">
									{dept.count} employee{dept.count !== 1 ? "s" : ""}
								</span>
							</div>
						))}
					</div>
				)}
				{!(isEmployeeLoading || employeeSummary?.byDepartment?.length) && (
					<p className="text-muted-foreground">No departments yet</p>
				)}
			</Card>

			{/* Recent Payroll Activity */}
			<Card className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Recent Payroll Runs</h2>
					<Link to="/payroll">
						<Button size="sm" variant="outline">
							View All
						</Button>
					</Link>
				</div>
				{isPayrollLoading && (
					<div className="space-y-2">
						{[1, 2, 3].map((id) => (
							<Skeleton
								className="h-16 w-full"
								key={`payroll-skeleton-${id}`}
							/>
						))}
					</div>
				)}
				{!isPayrollLoading && recentPayrollRuns?.length && (
					<div className="space-y-2">
						{recentPayrollRuns.map((run) => (
							<Link
								key={run.id}
								params={{ payrollRunId: run.id }}
								to="/payroll/$payrollRunId"
							>
								<div className="flex items-center justify-between rounded-lg bg-muted p-4 transition-colors hover:bg-muted/80">
									<div className="flex items-center gap-3">
										<Calendar className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">
												{new Date(run.periodStart).toLocaleDateString()} -{" "}
												{new Date(run.periodEnd).toLocaleDateString()}
											</p>
											<p className="text-muted-foreground text-sm">
												Status: <span className="capitalize">{run.status}</span>
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold">
											{run.totalNetPay != null
												? `${currencySymbol}${run.totalNetPay.toLocaleString()}`
												: "—"}
										</p>
										<p className="text-muted-foreground text-sm">
											{run.employeeCount ?? 0} employee
											{run.employeeCount !== 1 ? "s" : ""}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
				{!(isPayrollLoading || recentPayrollRuns?.length) && (
					<p className="text-muted-foreground">No payroll runs yet</p>
				)}
			</Card>

			{/* Quick Actions */}
			<Card className="p-4 sm:p-6">
				<h2 className="mb-4 font-semibold text-responsive-xl">Quick Actions</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Link to="/employees/new">
						<Button className="tap-target w-full" variant="outline">
							Add Employee
						</Button>
					</Link>
					<Link to="/departments/new">
						<Button className="tap-target w-full" variant="outline">
							Create Department
						</Button>
					</Link>
					<Link to="/payroll/new">
						<Button className="tap-target w-full" variant="outline">
							Run Payroll
						</Button>
					</Link>
				</div>
			</Card>
		</div>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	bgColor: string;
}

function StatCard({ icon, label, value, bgColor }: StatCardProps) {
	return (
		<Card className="p-6">
			<div className="flex items-center gap-4">
				<div
					className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}
				>
					{icon}
				</div>
				<div>
					<p className="text-muted-foreground text-sm">{label}</p>
					<p className="font-semibold text-2xl">{value}</p>
				</div>
			</div>
		</Card>
	);
}
