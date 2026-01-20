import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	Calendar03Icon as Calendar,
	Coins01Icon as Coins,
	Download01Icon as Download,
	File01Icon as FileText,
	UserGroupIcon as Users,
} from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/reports/")({
	component: ReportsPage,
});

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
	},
};

function formatCurrency(amount: number, currency = "GYD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function getStatusStyle(status: string): string {
	if (status === "paid") {
		return "bg-green-100 text-green-800";
	}
	if (status === "approved") {
		return "bg-blue-100 text-blue-800";
	}
	if (status === "draft") {
		return "bg-gray-100 text-gray-800";
	}
	return "bg-yellow-100 text-yellow-800";
}

interface PayrollRun {
	id: string;
	periodStart: string;
	periodEnd: string;
	payDate: string;
	employeeCount: number | null;
	totalGrossEarnings: number | null;
	totalNetPay: number | null;
	status: string;
}

function RecentPayrollRunsTable({
	isLoading,
	runs,
	currency,
}: {
	isLoading: boolean;
	runs: PayrollRun[] | undefined;
	currency: string;
}) {
	if (isLoading) {
		return (
			<div className="p-4">
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (!runs || runs.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<FileText className="mb-2 h-10 w-10 opacity-20" />
				<p>No payroll runs found.</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Period</TableHead>
					<TableHead>Pay Date</TableHead>
					<TableHead>Employees</TableHead>
					<TableHead>Gross</TableHead>
					<TableHead>Net Pay</TableHead>
					<TableHead>Status</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{runs.map((run) => (
					<TableRow key={run.id}>
						<TableCell>
							{run.periodStart} - {run.periodEnd}
						</TableCell>
						<TableCell>{run.payDate}</TableCell>
						<TableCell>{run.employeeCount}</TableCell>
						<TableCell>
							{formatCurrency(run.totalGrossEarnings ?? 0, currency)}
						</TableCell>
						<TableCell>
							{formatCurrency(run.totalNetPay ?? 0, currency)}
						</TableCell>
						<TableCell>
							<span
								className={`inline-flex rounded-full px-2 py-1 font-medium text-xs ${getStatusStyle(run.status)}`}
							>
								{run.status}
							</span>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex page with multiple tabs and data sources
function ReportsPage() {
	const {
		organizationId,
		organization,
		isLoading: orgLoading,
	} = useOrganization();
	const currentYear = new Date().getFullYear();
	const [dateRange, setDateRange] = useState({
		startDate: `${currentYear}-01-01`,
		endDate: `${currentYear}-12-31`,
	});

	const { data: payrollSummary, isLoading: payrollLoading } = useQuery({
		...orpc.reports.payrollSummary.queryOptions({
			input: {
				organizationId,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
			},
		}),
		enabled: !!organizationId,
	});

	const { data: employeeSummary, isLoading: employeeLoading } = useQuery({
		...orpc.reports.employeeSummary.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const { data: ytdTaxReport, isLoading: taxLoading } = useQuery({
		...orpc.reports.ytdTaxReport.queryOptions({
			input: {
				organizationId,
				year: currentYear,
			},
		}),
		enabled: !!organizationId,
	});

	const { data: recentPayrollRuns, isLoading: recentLoading } = useQuery({
		...orpc.reports.recentPayrollRuns.queryOptions({
			input: {
				organizationId,
				limit: 5,
			},
		}),
		enabled: !!organizationId,
	});

	const currency = organization?.currency ?? "GYD";

	if (orgLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton className="h-32" key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Reports</h1>
					<p className="text-muted-foreground text-sm">
						Generate and download reports for{" "}
						{organization?.name ?? "your organization"}.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-sm">Date Range:</Label>
						<Input
							className="w-36"
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
							}
							type="date"
							value={dateRange.startDate}
						/>
						<span>to</span>
						<Input
							className="w-36"
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
							}
							type="date"
							value={dateRange.endDate}
						/>
					</div>
				</div>
			</div>

			<Separator />

			<Tabs className="space-y-6" defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
					<TabsTrigger value="employees">Employee Summary</TabsTrigger>
					<TabsTrigger value="tax">YTD Tax Report</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<motion.div
						animate="visible"
						className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
						initial="hidden"
						variants={containerVariants}
					>
						<motion.div variants={itemVariants}>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">
										Total Employees
									</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{employeeLoading ? (
										<Skeleton className="h-8 w-16" />
									) : (
										<div className="font-bold text-2xl">
											{employeeSummary?.totalEmployees ?? 0}
										</div>
									)}
									<p className="text-muted-foreground text-xs">
										{employeeSummary?.activeEmployees ?? 0} active
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">
										Gross Earnings (YTD)
									</CardTitle>
									<Coins className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{payrollLoading ? (
										<Skeleton className="h-8 w-24" />
									) : (
										<div className="font-bold text-2xl">
											{formatCurrency(
												payrollSummary?.totalGrossEarnings ?? 0,
												currency
											)}
										</div>
									)}
									<p className="text-muted-foreground text-xs">
										{payrollSummary?.payrollRunCount ?? 0} payroll runs
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">
										Total PAYE (YTD)
									</CardTitle>
									<FileText className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{payrollLoading ? (
										<Skeleton className="h-8 w-24" />
									) : (
										<div className="font-bold text-2xl">
											{formatCurrency(payrollSummary?.totalPaye ?? 0, currency)}
										</div>
									)}
									<p className="text-muted-foreground text-xs">
										Income tax withheld
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">
										Total NIS (YTD)
									</CardTitle>
									<Calendar className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{payrollLoading ? (
										<Skeleton className="h-8 w-24" />
									) : (
										<div className="font-bold text-2xl">
											{formatCurrency(
												(payrollSummary?.totalNisEmployee ?? 0) +
													(payrollSummary?.totalNisEmployer ?? 0),
												currency
											)}
										</div>
									)}
									<p className="text-muted-foreground text-xs">
										Employee + Employer contributions
									</p>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>

					<div className="mt-8">
						<h2 className="mb-4 font-medium text-lg">Recent Payroll Runs</h2>
						<Card>
							<CardContent className="p-0">
								<RecentPayrollRunsTable
									currency={currency}
									isLoading={recentLoading}
									runs={recentPayrollRuns}
								/>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="payroll">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Payroll Summary Report</CardTitle>
								<CardDescription>
									Summary of payroll for {dateRange.startDate} to{" "}
									{dateRange.endDate}
								</CardDescription>
							</div>
							<Button className="gap-2" size="sm" variant="outline">
								<Download className="h-4 w-4" />
								Export CSV
							</Button>
						</CardHeader>
						<CardContent>
							{payrollLoading ? (
								<Skeleton className="h-64 w-full" />
							) : payrollSummary ? (
								<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											Gross Earnings
										</p>
										<p className="font-bold text-xl">
											{formatCurrency(
												payrollSummary.totalGrossEarnings,
												currency
											)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">Net Pay</p>
										<p className="font-bold text-xl">
											{formatCurrency(payrollSummary.totalNetPay, currency)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											PAYE Withheld
										</p>
										<p className="font-bold text-xl">
											{formatCurrency(payrollSummary.totalPaye, currency)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											NIS (Employee)
										</p>
										<p className="font-bold text-xl">
											{formatCurrency(
												payrollSummary.totalNisEmployee,
												currency
											)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											NIS (Employer)
										</p>
										<p className="font-bold text-xl">
											{formatCurrency(
												payrollSummary.totalNisEmployer,
												currency
											)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											Total Deductions
										</p>
										<p className="font-bold text-xl">
											{formatCurrency(payrollSummary.totalDeductions, currency)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											Payroll Runs
										</p>
										<p className="font-bold text-xl">
											{payrollSummary.payrollRunCount}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-sm">
											Employees Paid
										</p>
										<p className="font-bold text-xl">
											{payrollSummary.employeeCount}
										</p>
									</div>
								</div>
							) : (
								<p className="text-muted-foreground">
									No payroll data available.
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="employees">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Employee Summary Report</CardTitle>
								<CardDescription>
									Current employee statistics and breakdown
								</CardDescription>
							</div>
							<Button className="gap-2" size="sm" variant="outline">
								<Download className="h-4 w-4" />
								Export CSV
							</Button>
						</CardHeader>
						<CardContent className="space-y-6">
							{employeeLoading ? (
								<Skeleton className="h-64 w-full" />
							) : employeeSummary ? (
								<>
									<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
										<div className="space-y-1">
											<p className="text-muted-foreground text-sm">
												Total Employees
											</p>
											<p className="font-bold text-xl">
												{employeeSummary.totalEmployees}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-muted-foreground text-sm">Active</p>
											<p className="font-bold text-green-600 text-xl">
												{employeeSummary.activeEmployees}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-muted-foreground text-sm">On Leave</p>
											<p className="font-bold text-xl text-yellow-600">
												{employeeSummary.onLeaveEmployees}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-muted-foreground text-sm">
												Terminated
											</p>
											<p className="font-bold text-red-600 text-xl">
												{employeeSummary.terminatedEmployees}
											</p>
										</div>
									</div>

									<Separator />

									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<h3 className="mb-3 font-medium">By Department</h3>
											{employeeSummary.byDepartment.length > 0 ? (
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Department</TableHead>
															<TableHead className="text-right">
																Count
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{employeeSummary.byDepartment.map((dept) => (
															<TableRow key={dept.departmentId}>
																<TableCell>{dept.departmentName}</TableCell>
																<TableCell className="text-right">
																	{dept.count}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											) : (
												<p className="text-muted-foreground text-sm">
													No department data available
												</p>
											)}
										</div>

										<div>
											<h3 className="mb-3 font-medium">By Employment Type</h3>
											{employeeSummary.byEmploymentType.length > 0 ? (
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Type</TableHead>
															<TableHead className="text-right">
																Count
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{employeeSummary.byEmploymentType.map((type) => (
															<TableRow key={type.type}>
																<TableCell className="capitalize">
																	{type.type.replace("_", " ")}
																</TableCell>
																<TableCell className="text-right">
																	{type.count}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											) : (
												<p className="text-muted-foreground text-sm">
													No employment type data available
												</p>
											)}
										</div>
									</div>
								</>
							) : (
								<p className="text-muted-foreground">
									No employee data available.
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="tax">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Year-to-Date Tax Report</CardTitle>
								<CardDescription>
									Tax summary per employee for {currentYear}
								</CardDescription>
							</div>
							<Button className="gap-2" size="sm" variant="outline">
								<Download className="h-4 w-4" />
								Export CSV
							</Button>
						</CardHeader>
						<CardContent>
							{taxLoading ? (
								<Skeleton className="h-64 w-full" />
							) : ytdTaxReport && ytdTaxReport.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Employee #</TableHead>
											<TableHead>Name</TableHead>
											<TableHead className="text-right">Gross (YTD)</TableHead>
											<TableHead className="text-right">PAYE (YTD)</TableHead>
											<TableHead className="text-right">NIS (YTD)</TableHead>
											<TableHead className="text-right">Net (YTD)</TableHead>
											<TableHead className="text-right">Payslips</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{ytdTaxReport.map((employee) => (
											<TableRow key={employee.employeeId}>
												<TableCell>{employee.employeeNumber}</TableCell>
												<TableCell>{employee.employeeName}</TableCell>
												<TableCell className="text-right">
													{formatCurrency(employee.totalGross, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(employee.totalPaye, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(employee.totalNis, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(employee.totalNet, currency)}
												</TableCell>
												<TableCell className="text-right">
													{employee.payslipCount}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
									<FileText className="mb-2 h-10 w-10 opacity-20" />
									<p>No tax data available for {currentYear}.</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
