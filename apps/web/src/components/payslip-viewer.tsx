import {
	AlertCircleIcon,
	BankIcon,
	Calendar03Icon,
	Download04Icon,
	UserIcon,
} from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface EarningsItem {
	code: string;
	name: string;
	amount: number;
	isTaxable: boolean;
	isNisable: boolean;
}

interface DeductionsItem {
	code: string;
	name: string;
	amount: number;
}

interface TaxBandDetail {
	bandName: string;
	amount: number;
	rate: number;
	tax: number;
}

interface TaxDetails {
	jurisdictionId: string;
	taxYear: number;
	annualGross?: number;
	personalDeduction?: number;
	taxableBands?: TaxBandDetail[];
	annualTax?: number;
	monthlyTax?: number;
}

export interface Payslip {
	id: string;
	periodStart: string | Date;
	periodEnd: string | Date;
	payDate: string | Date;

	// Employee info (from joined query)
	employee?: {
		firstName: string;
		lastName: string;
		employeeNumber: string;
		position?: { title: string };
		department?: { name: string };
	};

	// Earnings
	basePay: number;
	overtimePay?: number;
	allowances?: number;
	bonuses?: number;
	commissions?: number;
	otherEarnings?: number;
	grossEarnings: number;
	earningsBreakdown?: EarningsItem[];

	// Deductions
	taxableIncome: number;
	payeAmount: number;
	nisableEarnings: number;
	nisEmployee: number;
	nisEmployer: number;
	unionDues?: number;
	loanRepayments?: number;
	advanceDeductions?: number;
	otherDeductions?: number;
	totalDeductions: number;
	deductionsBreakdown?: DeductionsItem[];
	taxDetails?: TaxDetails;

	// Totals
	netPay: number;

	// YTD
	ytdGrossEarnings?: number;
	ytdNetPay?: number;
	ytdPaye?: number;
	ytdNis?: number;

	// Payment
	paymentMethod?: string;
	paymentStatus?: string;
	paymentReference?: string;

	// Retro
	hasRetroAdjustments?: number;
	retroAdjustmentAmount?: number;
}

interface PayslipViewerProps {
	payslip: Payslip;
	currency?: string;
	onDownload?: () => void;
	className?: string;
}

export function PayslipViewer({
	payslip,
	currency = "GYD",
	onDownload,
	className,
}: PayslipViewerProps) {
	const formatCurrency = (amount: number | null | undefined) => {
		if (amount === null || amount === undefined) return "—";
		const value = amount / 100; // Convert cents to dollars
		return new Intl.NumberFormat("en-GY", {
			style: "currency",
			currency,
		}).format(value);
	};

	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleDateString("en-GY", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const getPaymentStatusBadge = (status: string | undefined) => {
		switch (status) {
			case "paid":
				return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
			case "pending":
				return <Badge variant="secondary">Pending</Badge>;
			case "failed":
				return <Badge variant="destructive">Failed</Badge>;
			case "cancelled":
				return <Badge variant="secondary">Cancelled</Badge>;
			default:
				return <Badge variant="outline">Unknown</Badge>;
		}
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<Card className="p-6">
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<UserIcon className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="font-bold text-2xl">
								{payslip.employee
									? `${payslip.employee.firstName} ${payslip.employee.lastName}`
									: "Payslip"}
							</h2>
							{payslip.employee && (
								<div className="mt-1 space-y-1 text-muted-foreground text-sm">
									<p>Employee #: {payslip.employee.employeeNumber}</p>
									{payslip.employee.position && (
										<p>Position: {payslip.employee.position.title}</p>
									)}
									{payslip.employee.department && (
										<p>Department: {payslip.employee.department.name}</p>
									)}
								</div>
							)}
						</div>
					</div>

					<div className="flex items-start gap-3">
						{getPaymentStatusBadge(payslip.paymentStatus)}
						{onDownload && (
							<Button onClick={onDownload} size="sm" variant="outline">
								<Download04Icon className="mr-2 h-4 w-4" />
								Download PDF
							</Button>
						)}
					</div>
				</div>

				<Separator className="my-4" />

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="flex items-center gap-3">
						<Calendar03Icon className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="text-muted-foreground text-xs">Pay Period</p>
							<p className="font-medium text-sm">
								{formatDate(payslip.periodStart)} -{" "}
								{formatDate(payslip.periodEnd)}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Calendar03Icon className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="text-muted-foreground text-xs">Pay Date</p>
							<p className="font-medium text-sm">
								{formatDate(payslip.payDate)}
							</p>
						</div>
					</div>

					{payslip.paymentMethod && (
						<div className="flex items-center gap-3">
							<BankIcon className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground text-xs">Payment Method</p>
								<p className="font-medium text-sm capitalize">
									{payslip.paymentMethod.replace(/_/g, " ")}
								</p>
							</div>
						</div>
					)}
				</div>
			</Card>

			{/* Retro Adjustments Alert */}
			{payslip.hasRetroAdjustments && payslip.hasRetroAdjustments > 0 && (
				<div className="rounded-lg border-yellow-200 bg-yellow-50 p-4">
					<div className="flex items-start gap-3">
						<AlertCircleIcon className="h-5 w-5 text-yellow-600" />
						<div>
							<h4 className="font-semibold text-sm text-yellow-900">
								Retroactive Adjustment Included
							</h4>
							<p className="mt-1 text-xs text-yellow-800">
								This payslip includes a retroactive adjustment of{" "}
								{formatCurrency(payslip.retroAdjustmentAmount)}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Earnings */}
			<Card className="p-6">
				<h3 className="mb-4 font-semibold text-xl">Earnings</h3>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Description</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payslip.earningsBreakdown &&
						payslip.earningsBreakdown.length > 0 ? (
							payslip.earningsBreakdown.map((item) => (
								<TableRow key={item.code}>
									<TableCell>
										<div>
											<p className="font-medium">{item.name}</p>
											<p className="text-muted-foreground text-xs">
												{item.isTaxable && "Taxable"}
												{item.isTaxable && item.isNisable && " • "}
												{item.isNisable && "NISable"}
											</p>
										</div>
									</TableCell>
									<TableCell className="text-right">
										{formatCurrency(item.amount)}
									</TableCell>
								</TableRow>
							))
						) : (
							<>
								<TableRow>
									<TableCell>Base Pay</TableCell>
									<TableCell className="text-right">
										{formatCurrency(payslip.basePay)}
									</TableCell>
								</TableRow>
								{payslip.overtimePay && payslip.overtimePay > 0 && (
									<TableRow>
										<TableCell>Overtime Pay</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.overtimePay)}
										</TableCell>
									</TableRow>
								)}
								{payslip.allowances && payslip.allowances > 0 && (
									<TableRow>
										<TableCell>Allowances</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.allowances)}
										</TableCell>
									</TableRow>
								)}
								{payslip.bonuses && payslip.bonuses > 0 && (
									<TableRow>
										<TableCell>Bonuses</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.bonuses)}
										</TableCell>
									</TableRow>
								)}
								{payslip.commissions && payslip.commissions > 0 && (
									<TableRow>
										<TableCell>Commissions</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.commissions)}
										</TableCell>
									</TableRow>
								)}
								{payslip.otherEarnings && payslip.otherEarnings > 0 && (
									<TableRow>
										<TableCell>Other Earnings</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.otherEarnings)}
										</TableCell>
									</TableRow>
								)}
							</>
						)}
						<TableRow className="bg-muted/50 font-semibold">
							<TableCell>Gross Earnings</TableCell>
							<TableCell className="text-right">
								{formatCurrency(payslip.grossEarnings)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Card>

			{/* Deductions */}
			<Card className="p-6">
				<h3 className="mb-4 font-semibold text-xl">Deductions</h3>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Description</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Statutory Deductions */}
						<TableRow>
							<TableCell>
								<div>
									<p className="font-medium">PAYE (Income Tax)</p>
									<p className="text-muted-foreground text-xs">
										Taxable Income: {formatCurrency(payslip.taxableIncome)}
									</p>
								</div>
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(payslip.payeAmount)}
							</TableCell>
						</TableRow>

						<TableRow>
							<TableCell>
								<div>
									<p className="font-medium">NIS (Employee Contribution)</p>
									<p className="text-muted-foreground text-xs">
										NISable Earnings: {formatCurrency(payslip.nisableEarnings)}
									</p>
								</div>
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(payslip.nisEmployee)}
							</TableCell>
						</TableRow>

						{/* Other Deductions */}
						{payslip.deductionsBreakdown &&
						payslip.deductionsBreakdown.length > 0 ? (
							payslip.deductionsBreakdown.map((item) => (
								<TableRow key={item.code}>
									<TableCell>{item.name}</TableCell>
									<TableCell className="text-right">
										{formatCurrency(item.amount)}
									</TableCell>
								</TableRow>
							))
						) : (
							<>
								{payslip.unionDues && payslip.unionDues > 0 && (
									<TableRow>
										<TableCell>Union Dues</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.unionDues)}
										</TableCell>
									</TableRow>
								)}
								{payslip.loanRepayments && payslip.loanRepayments > 0 && (
									<TableRow>
										<TableCell>Loan Repayments</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.loanRepayments)}
										</TableCell>
									</TableRow>
								)}
								{payslip.advanceDeductions && payslip.advanceDeductions > 0 && (
									<TableRow>
										<TableCell>Advance Deductions</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.advanceDeductions)}
										</TableCell>
									</TableRow>
								)}
								{payslip.otherDeductions && payslip.otherDeductions > 0 && (
									<TableRow>
										<TableCell>Other Deductions</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payslip.otherDeductions)}
										</TableCell>
									</TableRow>
								)}
							</>
						)}

						<TableRow className="bg-muted/50 font-semibold">
							<TableCell>Total Deductions</TableCell>
							<TableCell className="text-right">
								{formatCurrency(payslip.totalDeductions)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Card>

			{/* Net Pay */}
			<Card className="bg-primary/5 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-xl">Net Pay</h3>
						<p className="text-muted-foreground text-sm">Amount to be paid</p>
					</div>
					<div className="font-bold text-4xl">
						{formatCurrency(payslip.netPay)}
					</div>
				</div>
			</Card>

			{/* YTD Summary */}
			{(payslip.ytdGrossEarnings || payslip.ytdNetPay) && (
				<Card className="p-6">
					<h3 className="mb-4 font-semibold text-xl">Year-to-Date Summary</h3>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{payslip.ytdGrossEarnings !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">YTD Gross</p>
								<p className="mt-1 font-semibold text-lg">
									{formatCurrency(payslip.ytdGrossEarnings)}
								</p>
							</div>
						)}
						{payslip.ytdNetPay !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">YTD Net Pay</p>
								<p className="mt-1 font-semibold text-lg">
									{formatCurrency(payslip.ytdNetPay)}
								</p>
							</div>
						)}
						{payslip.ytdPaye !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">YTD PAYE</p>
								<p className="mt-1 font-semibold text-lg">
									{formatCurrency(payslip.ytdPaye)}
								</p>
							</div>
						)}
						{payslip.ytdNis !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">YTD NIS</p>
								<p className="mt-1 font-semibold text-lg">
									{formatCurrency(payslip.ytdNis)}
								</p>
							</div>
						)}
					</div>
				</Card>
			)}

			{/* Tax Calculation Details */}
			{payslip.taxDetails?.taxableBands && (
				<Card className="p-6">
					<h3 className="mb-4 font-semibold text-xl">
						Tax Calculation Details
					</h3>
					<div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						{payslip.taxDetails.annualGross !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">Annual Gross</p>
								<p className="mt-1 font-medium">
									{formatCurrency(payslip.taxDetails.annualGross)}
								</p>
							</div>
						)}
						{payslip.taxDetails.personalDeduction !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">
									Personal Deduction
								</p>
								<p className="mt-1 font-medium">
									{formatCurrency(payslip.taxDetails.personalDeduction)}
								</p>
							</div>
						)}
						{payslip.taxDetails.annualTax !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">Annual Tax</p>
								<p className="mt-1 font-medium">
									{formatCurrency(payslip.taxDetails.annualTax)}
								</p>
							</div>
						)}
						{payslip.taxDetails.monthlyTax !== undefined && (
							<div>
								<p className="text-muted-foreground text-xs">Monthly Tax</p>
								<p className="mt-1 font-medium">
									{formatCurrency(payslip.taxDetails.monthlyTax)}
								</p>
							</div>
						)}
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Tax Band</TableHead>
								<TableHead className="text-right">Taxable Amount</TableHead>
								<TableHead className="text-right">Rate</TableHead>
								<TableHead className="text-right">Tax</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payslip.taxDetails.taxableBands.map((band, index) => (
								<TableRow key={index}>
									<TableCell>{band.bandName}</TableCell>
									<TableCell className="text-right">
										{formatCurrency(band.amount)}
									</TableCell>
									<TableCell className="text-right">
										{(band.rate * 100).toFixed(2)}%
									</TableCell>
									<TableCell className="text-right">
										{formatCurrency(band.tax)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* Employer Contributions */}
			<Card className="p-6">
				<h3 className="mb-4 font-semibold text-xl">Employer Contributions</h3>
				<div className="space-y-3">
					<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
						<span className="font-medium">NIS (Employer Contribution)</span>
						<span className="font-semibold">
							{formatCurrency(payslip.nisEmployer)}
						</span>
					</div>
					<p className="text-muted-foreground text-xs">
						This amount is contributed by the employer on your behalf and does
						not affect your net pay.
					</p>
				</div>
			</Card>
		</div>
	);
}
