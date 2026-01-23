// biome-ignore lint/style/useFilenamingConvention: TanStack Router requires $param syntax for dynamic routes
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	ArrowLeft02Icon as ArrowLeft,
	CheckmarkCircle02Icon as CheckCircle,
	Coins01Icon as DollarCircle,
	File01Icon as FileText,
	Loading03Icon as Loader2,
	PlayIcon as Play,
	UserGroupIcon as Users,
} from "hugeicons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/payroll/$payrollRunId")({
	component: PayrollDetailPage,
});

function formatCurrency(
	amount: number | null | undefined,
	currency = "GYD"
): string {
	if (amount == null) {
		return "$0";
	}
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function getPayrollStatusStyle(status: string): string {
	if (status === "paid") {
		return "bg-green-100 text-green-800";
	}
	if (status === "approved") {
		return "bg-blue-100 text-blue-800";
	}
	if (status === "calculated") {
		return "bg-yellow-100 text-yellow-800";
	}
	return "bg-gray-100 text-gray-800";
}

function PayrollDetailPage() {
	const { payrollRunId } = Route.useParams() as { payrollRunId: string };
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { organization } = useOrganization();
	const currency = organization?.currency ?? "GYD";

	const { data: payrollRun, isLoading } = useQuery({
		...orpc.payroll.get.queryOptions({ input: { id: payrollRunId } }),
	});

	const processMutation = useMutation({
		mutationFn: () => {
			return orpc.payroll.process.call({ payrollRunId });
		},
		onSuccess: () => {
			toast.success("Payroll processed", {
				description: "Payslips have been calculated for all employees.",
			});
			queryClient.invalidateQueries({ queryKey: ["payroll"] });
		},
		onError: (error) => {
			toast.error("Failed to process payroll", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const approveMutation = useMutation({
		mutationFn: () => {
			return orpc.payroll.approve.call({ payrollRunId });
		},
		onSuccess: () => {
			toast.success("Payroll approved", {
				description: "The payroll run has been approved for payment.",
			});
			queryClient.invalidateQueries({ queryKey: ["payroll"] });
		},
		onError: (error) => {
			toast.error("Failed to approve payroll", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.1 },
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1 },
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Skeleton className="mb-6 h-8 w-48" />
				<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton className="h-32" key={i} />
					))}
				</div>
			</div>
		);
	}

	if (!payrollRun) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="p-12 text-center">
					<h2 className="font-semibold text-xl">Payroll Run Not Found</h2>
					<p className="mt-2 text-muted-foreground">
						The requested payroll run could not be found.
					</p>
					<Button className="mt-4" onClick={() => navigate({ to: "/payroll" })}>
						Back to Payroll
					</Button>
				</Card>
			</div>
		);
	}

	const isDraft = payrollRun.status === "draft";
	const isCalculated = payrollRun.status === "calculated";

	return (
		<div className="container mx-auto px-4 py-8">
			<Button
				className="mb-6 gap-2"
				onClick={() => navigate({ to: "/payroll" })}
				variant="ghost"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Payroll
			</Button>

			<motion.div
				animate="visible"
				className="space-y-6"
				initial="hidden"
				variants={containerVariants}
			>
				{/* Header */}
				<motion.div
					className="flex items-start justify-between"
					variants={itemVariants}
				>
					<div>
						<h1 className="font-bold text-3xl">
							Payroll: {payrollRun.periodStart} - {payrollRun.periodEnd}
						</h1>
						<p className="text-muted-foreground">
							Pay Date: {payrollRun.payDate} | Type: {payrollRun.runType}
						</p>
						<div className="mt-2">
							<span
								className={`inline-flex rounded-full px-3 py-1 font-medium text-sm ${getPayrollStatusStyle(payrollRun.status)}`}
							>
								{payrollRun.status}
							</span>
						</div>
					</div>
					<div className="flex gap-2">
						{isDraft && (
							<Button
								className="gap-2"
								disabled={processMutation.isPending}
								onClick={() => processMutation.mutate()}
							>
								{processMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Play className="h-4 w-4" />
								)}
								Process Payroll
							</Button>
						)}
						{isCalculated && (
							<Button
								className="gap-2"
								disabled={approveMutation.isPending}
								onClick={() => approveMutation.mutate()}
							>
								{approveMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<CheckCircle className="h-4 w-4" />
								)}
								Approve Payroll
							</Button>
						)}
					</div>
				</motion.div>

				{/* Summary Cards */}
				<motion.div
					className="grid grid-cols-1 gap-4 md:grid-cols-4"
					variants={itemVariants}
				>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-sm">
								Gross Earnings
							</CardTitle>
							<DollarCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{formatCurrency(payrollRun.totalGrossEarnings, currency)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-sm">Net Pay</CardTitle>
							<DollarCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{formatCurrency(payrollRun.totalNetPay, currency)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-sm">
								Total Deductions
							</CardTitle>
							<FileText className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{formatCurrency(payrollRun.totalDeductions, currency)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-sm">Employees</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{payrollRun.employeeCount}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Tax Summary */}
				<motion.div variants={itemVariants}>
					<Card>
						<CardHeader>
							<CardTitle>Tax Summary</CardTitle>
							<CardDescription>
								Statutory deductions for this payroll run
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">PAYE</p>
									<p className="font-bold text-xl">
										{formatCurrency(payrollRun.totalPaye, currency)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">
										NIS (Employee)
									</p>
									<p className="font-bold text-xl">
										{formatCurrency(payrollRun.totalNisEmployee, currency)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">
										NIS (Employer)
									</p>
									<p className="font-bold text-xl">
										{formatCurrency(payrollRun.totalNisEmployer, currency)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">
										Other Deductions
									</p>
									<p className="font-bold text-xl">
										{formatCurrency(
											(payrollRun.totalDeductions ?? 0) -
												(payrollRun.totalPaye ?? 0) -
												(payrollRun.totalNisEmployee ?? 0),
											currency
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<Separator />

				{/* Payslips Table */}
				<motion.div variants={itemVariants}>
					<Card>
						<CardHeader>
							<CardTitle>Payslips</CardTitle>
							<CardDescription>
								Individual employee payslips for this payroll run
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{payrollRun.payslips && payrollRun.payslips.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Employee #</TableHead>
											<TableHead>Name</TableHead>
											<TableHead className="text-right">Gross</TableHead>
											<TableHead className="text-right">PAYE</TableHead>
											<TableHead className="text-right">NIS</TableHead>
											<TableHead className="text-right">Deductions</TableHead>
											<TableHead className="text-right">Net Pay</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{payrollRun.payslips.map((slip) => (
											<TableRow key={slip.id}>
												<TableCell>{slip.employee?.employeeNumber}</TableCell>
												<TableCell>
													{slip.employee?.firstName} {slip.employee?.lastName}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(slip.grossEarnings, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(slip.payeAmount, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(slip.nisEmployee, currency)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(slip.totalDeductions, currency)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(slip.netPay, currency)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
									<FileText className="mb-2 h-10 w-10 opacity-20" />
									<p>No payslips generated yet.</p>
									{isDraft && (
										<p className="mt-1 text-sm">
											Click "Process Payroll" to calculate payslips.
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Notes */}
				{payrollRun.notes && (
					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>Notes</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">{payrollRun.notes}</p>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
