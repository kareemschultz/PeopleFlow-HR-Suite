import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	Coins01Icon as Coins,
	Download01Icon as Download,
	File01Icon as FileText,
	UserGroupIcon as Users,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/reports/")({
	component: ReportsPage,
});

const reports = [
	{
		id: "payroll-summary",
		title: "Payroll Summary",
		description:
			"Detailed breakdown of payroll runs, gross pay, deductions, and net pay.",
		icon: Coins,
		color: "text-green-500",
		bg: "bg-green-500/10",
	},
	{
		id: "employee-list",
		title: "Employee Directory",
		description: "Complete list of active employees, departments, and roles.",
		icon: Users,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		id: "tax-liability",
		title: "Tax Liability",
		description:
			"Overview of PAYE, NIS, and other tax obligations per jurisdiction.",
		icon: FileText,
		color: "text-orange-500",
		bg: "bg-orange-500/10",
	},
];

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

function ReportsPage() {
	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Reports</h1>
				<p className="text-muted-foreground text-sm">
					Generate and download reports for your organization.
				</p>
			</div>

			<motion.div
				animate="visible"
				className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
				initial="hidden"
				variants={containerVariants}
			>
				{reports.map((report) => (
					<motion.div key={report.id} variants={itemVariants}>
						<Card
							className="flex h-full cursor-pointer flex-col border-l-4 transition-shadow hover:shadow-md"
							style={{ borderLeftColor: report.color.replace("text-", "") }}
						>
							{" "}
							{/* Tailwind arbitrary value hack or need lookup */}
							<CardHeader className="flex flex-row items-start gap-4 space-y-0">
								<div className={`rounded-md p-2 ${report.bg}`}>
									<report.icon className={`h-6 w-6 ${report.color}`} />
								</div>
								<div className="space-y-1">
									<CardTitle className="text-base">{report.title}</CardTitle>
									<CardDescription className="text-xs">
										{report.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="mt-auto flex justify-end pt-4">
								<Button className="gap-2" size="sm" variant="ghost">
									<Download className="h-4 w-4" />
									Generate
								</Button>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</motion.div>

			<div className="mt-12">
				<h2 className="mb-4 font-medium text-lg">Recent Reports</h2>
				<Card>
					<CardContent className="p-0">
						<div className="m-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 py-12 text-muted-foreground">
							<FileText className="mb-2 h-10 w-10 opacity-20" />
							<p>No reports generated recently.</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
