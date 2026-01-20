import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar01Icon as Calendar,
	Coins01Icon as DollarCircle,
	Search01Icon as Search,
} from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/payroll/")({
	component: PayrollPage,
});

function PayrollPage() {
	const [search, setSearch] = useState("");
	const [organizationId] = useState(""); // TODO: Get from auth context

	// TODO: Integrate with payroll API when ready
	const { data: payrollRuns, isLoading } = useQuery({
		queryKey: ["payroll", "list", { organizationId, search }],
		queryFn: () => {
			// Placeholder - will integrate with oRPC when payroll router is ready
			return [];
		},
		enabled: false, // Disabled until payroll API is implemented
	});

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Payroll</h1>
					<p className="text-muted-foreground">
						Manage payroll runs and employee payslips
					</p>
				</div>
				<Link to="/payroll/new">
					<Button>New Payroll Run</Button>
				</Link>
			</div>

			{/* Search and Filters */}
			<div className="mb-6 flex gap-4">
				<div className="relative flex-1">
					<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search payroll runs..."
						type="search"
						value={search}
					/>
				</div>
			</div>

			{/* Payroll Runs Grid */}
			<div className="grid grid-cols-1 gap-4">
				{isLoading ? (
					// Loading skeletons
					Array.from({ length: 4 }).map((_, i) => (
						<Card className="p-6" key={i}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<Skeleton className="h-12 w-12 rounded-lg" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-32" />
									</div>
								</div>
								<Skeleton className="h-8 w-24" />
							</div>
						</Card>
					))
				) : payrollRuns && payrollRuns.length > 0 ? (
					payrollRuns.map((run: any) => (
						<Link
							key={run.id}
							params={{ payrollRunId: run.id }}
							to="/payroll/$payrollRunId"
						>
							<Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<DollarCircle className="h-6 w-6 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold">
												Payroll {run.periodStart} - {run.periodEnd}
											</h3>
											<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
												<Calendar className="h-4 w-4" />
												<span>Pay Date: {run.payDate}</span>
											</div>
											<div className="mt-2 flex items-center gap-2">
												<span
													className={`rounded px-2 py-1 text-xs ${
														run.status === "approved"
															? "bg-green-100 text-green-700"
															: run.status === "draft"
																? "bg-gray-100 text-gray-700"
																: run.status === "processing"
																	? "bg-blue-100 text-blue-700"
																	: "bg-red-100 text-red-700"
													}`}
												>
													{run.status}
												</span>
											</div>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold text-2xl">
											{run.totals?.totalNetPay?.toLocaleString("en-GY", {
												style: "currency",
												currency: "GYD",
											})}
										</p>
										<p className="text-muted-foreground text-sm">
											{run.employeeCount} employees
										</p>
									</div>
								</div>
							</Card>
						</Link>
					))
				) : (
					<Card className="p-12">
						<div className="text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
								<DollarCircle className="h-8 w-8 text-primary" />
							</div>
							<h3 className="mt-4 font-semibold text-lg">
								No Payroll Runs Yet
							</h3>
							<p className="mt-2 text-muted-foreground">
								{search
									? "No payroll runs found matching your search."
									: "Create your first payroll run to process employee payments."}
							</p>
							<Link to="/payroll/new">
								<Button className="mt-4">Create Payroll Run</Button>
							</Link>
						</div>
					</Card>
				)}
			</div>

			{/* Quick Stats */}
			<div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-6">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
							<DollarCircle className="h-6 w-6 text-green-600" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Total Paid (YTD)</p>
							<p className="font-semibold text-2xl">G$0</p>
						</div>
					</div>
				</Card>
				<Card className="p-6">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
							<DollarCircle className="h-6 w-6 text-blue-600" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">
								Tax Withheld (YTD)
							</p>
							<p className="font-semibold text-2xl">G$0</p>
						</div>
					</div>
				</Card>
				<Card className="p-6">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
							<DollarCircle className="h-6 w-6 text-purple-600" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">
								NIS Contributions (YTD)
							</p>
							<p className="font-semibold text-2xl">G$0</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
