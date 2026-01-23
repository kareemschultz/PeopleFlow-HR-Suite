import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckmarkCircle02Icon,
	Clock03Icon,
	PlusSignIcon,
	UserGroupIcon,
	UserIcon,
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
import { Progress } from "@/components/ui/progress";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

// Type for workflow with employee relation
interface WorkflowWithEmployee {
	id: string;
	status: string;
	startDate: string;
	targetCompletionDate: string | null;
	actualCompletionDate: string | null;
	totalTasks: number | null;
	completedTasks: number | null;
	employee?: {
		firstName: string;
		lastName: string;
		position?: string | null;
		department?: {
			name: string;
		} | null;
	} | null;
}

export const Route = createFileRoute("/onboarding/")({
	component: OnboardingPage,
});

const statusBadgeVariant = {
	completed: "default" as const,
	in_progress: "secondary" as const,
	cancelled: "outline" as const,
};

function getStatusBadgeVariant(status: string) {
	return (
		statusBadgeVariant[status as keyof typeof statusBadgeVariant] || "outline"
	);
}

function OnboardingPage() {
	const { organizationId, hasOrganization } = useOrganization();

	// Get onboarding workflows
	const { data: workflowsData, isLoading } = useQuery({
		...orpc.workflows.list.queryOptions({
			input: {
				organizationId: organizationId || "",
				type: "onboarding",
			},
		}),
		enabled: hasOrganization && !!organizationId,
	});

	const workflows = workflowsData as WorkflowWithEmployee[] | undefined;

	// Get stats
	const { data: stats } = useQuery({
		...orpc.onboardingOffboardingStats.getWorkflowStats.queryOptions({
			input: { organizationId: organizationId || "" },
		}),
		enabled: hasOrganization && !!organizationId,
	});

	const inProgressCount =
		workflows?.filter((w) => w.status === "in_progress").length || 0;
	const completedCount =
		workflows?.filter((w) => w.status === "completed").length || 0;
	const overdueCount =
		workflows?.filter(
			(w) =>
				w.status === "in_progress" &&
				w.targetCompletionDate &&
				new Date(w.targetCompletionDate) < new Date()
		).length || 0;

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">
						Loading onboarding data...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Onboarding Management</h1>
					<p className="text-muted-foreground">
						Streamline new employee onboarding processes
					</p>
				</div>
				<div className="flex gap-2">
					<Link to="/onboarding/new">
						<Button>
							<PlusSignIcon className="mr-2 h-4 w-4" />
							Start Onboarding
						</Button>
					</Link>
					<Button variant="outline">
						<UserGroupIcon className="mr-2 h-4 w-4" />
						Manage Templates
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Onboardings
						</CardTitle>
						<UserIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{inProgressCount}</div>
						<p className="text-muted-foreground text-xs">
							Currently in progress
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Completed This Month
						</CardTitle>
						<CheckmarkCircle02Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{completedCount}</div>
						<p className="text-muted-foreground text-xs">
							Successfully finished
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Overdue Tasks</CardTitle>
						<Clock03Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{overdueCount}</div>
						<p className="text-muted-foreground text-xs">Need attention</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Pending Tasks</CardTitle>
						<Clock03Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.pendingTasks || 0}</div>
						<p className="text-muted-foreground text-xs">
							Across all workflows
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Active Onboarding Workflows */}
			<Card>
				<CardHeader>
					<CardTitle>Active Onboarding Workflows</CardTitle>
					<CardDescription>
						Track progress of new employee onboarding
					</CardDescription>
				</CardHeader>
				<CardContent>
					{workflows && workflows.length > 0 ? (
						<div className="space-y-4">
							{workflows
								.filter((w) => w.status !== "completed")
								.slice(0, 10)
								.map((workflow) => {
									const completedTasks = workflow.completedTasks || 0;
									const totalTasks = workflow.totalTasks || 0;
									const progress = totalTasks
										? Math.round((completedTasks / totalTasks) * 100)
										: 0;
									const isOverdue =
										workflow.status === "in_progress" &&
										workflow.targetCompletionDate &&
										new Date(workflow.targetCompletionDate) < new Date();

									return (
										<div
											className="space-y-3 border-b py-4 last:border-0"
											key={workflow.id}
										>
											<div className="flex items-start justify-between">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<p className="font-medium">
															{workflow.employee?.firstName}{" "}
															{workflow.employee?.lastName}
														</p>
														{isOverdue && (
															<Badge variant="destructive">Overdue</Badge>
														)}
													</div>
													<p className="text-muted-foreground text-sm">
														{workflow.employee?.position || "N/A"} •{" "}
														{workflow.employee?.department?.name || "N/A"}
													</p>
													<p className="text-muted-foreground text-xs">
														Start Date:{" "}
														{new Date(workflow.startDate).toLocaleDateString()}{" "}
														• Target:{" "}
														{workflow.targetCompletionDate
															? new Date(
																	workflow.targetCompletionDate
																).toLocaleDateString()
															: "N/A"}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Badge
														variant={getStatusBadgeVariant(workflow.status)}
													>
														{workflow.status}
													</Badge>
													<Button disabled size="sm" variant="outline">
														View
													</Button>
												</div>
											</div>
											<div className="space-y-1">
												<div className="flex items-center justify-between text-sm">
													<span className="text-muted-foreground">
														Progress
													</span>
													<span className="font-medium">
														{completedTasks} / {totalTasks} tasks
													</span>
												</div>
												<Progress value={progress} />
											</div>
										</div>
									);
								})}
						</div>
					) : (
						<div className="py-12 text-center">
							<p className="text-muted-foreground">
								No active onboarding workflows
							</p>
							<Link to="/onboarding/new">
								<Button className="mt-4" variant="outline">
									<PlusSignIcon className="mr-2 h-4 w-4" />
									Start First Onboarding
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recently Completed */}
			{workflows &&
				workflows.filter((w) => w.status === "completed").length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Recently Completed</CardTitle>
							<CardDescription>
								Successfully completed onboarding workflows
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{workflows
									.filter((w) => w.status === "completed")
									.slice(0, 5)
									.map((workflow) => (
										<div
											className="flex items-center justify-between border-b py-3 last:border-0"
											key={workflow.id}
										>
											<div>
												<p className="font-medium">
													{workflow.employee?.firstName}{" "}
													{workflow.employee?.lastName}
												</p>
												<p className="text-muted-foreground text-sm">
													Completed on{" "}
													{workflow.actualCompletionDate
														? new Date(
																workflow.actualCompletionDate
															).toLocaleDateString()
														: "N/A"}
												</p>
											</div>
											<Button disabled size="sm" variant="ghost">
												View Details
											</Button>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}
		</div>
	);
}
