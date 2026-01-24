import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight01Icon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	DashboardSquare02Icon,
	FileAttachmentIcon,
	MoneyBag02Icon,
	SecurityCheckIcon,
	UserGroupIcon,
	WorkHistoryIcon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const features = [
		{
			icon: UserGroupIcon,
			title: "Employee Management",
			description:
				"Complete employee lifecycle management with departments, positions, and organizational hierarchy.",
		},
		{
			icon: MoneyBag02Icon,
			title: "Advanced Payroll",
			description:
				"Automated payroll processing with multi-jurisdiction tax support, retroactive adjustments, and YTD tracking.",
		},
		{
			icon: SecurityCheckIcon,
			title: "Tax Compliance",
			description:
				"Built-in PAYE and NIS calculations with support for multiple tax jurisdictions and filing requirements.",
		},
		{
			icon: Calendar03Icon,
			title: "Leave Management",
			description:
				"Track leave balances, approve requests, and manage annual, sick, and custom leave types.",
		},
		{
			icon: WorkHistoryIcon,
			title: "Time & Attendance",
			description:
				"Clock-in/out tracking, shift management, and overtime calculations with geofencing support.",
		},
		{
			icon: FileAttachmentIcon,
			title: "Onboarding Workflows",
			description:
				"Streamline new hire onboarding with customizable templates, task tracking, and progress monitoring.",
		},
		{
			icon: DashboardSquare02Icon,
			title: "Analytics & Reports",
			description:
				"Comprehensive metrics dashboard with data freshness indicators and customizable reports.",
		},
		{
			icon: CheckmarkCircle02Icon,
			title: "Audit & Compliance",
			description:
				"Complete audit trails, permission snapshots, and compliance-ready data retention policies.",
		},
	];

	const stats = [
		{ value: "99.9%", label: "Uptime SLA" },
		{ value: "14-Day", label: "Free Trial" },
		{ value: "Multi-Country", label: "Tax Support" },
		{ value: "24/7", label: "Support" },
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-white px-6 py-32 lg:px-8 dark:bg-slate-900">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20" />
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
				<div className="relative z-10 mx-auto max-w-7xl text-center">
					<div>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-blue-600 bg-blue-600 px-5 py-2.5 font-bold text-sm text-white shadow-lg dark:border-cyan-400 dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
							</span>
							Now available: Multi-country payroll support
						</div>
						<h1 className="font-bold text-6xl tracking-tight sm:text-8xl">
							<span className="block font-black text-black dark:text-white">
								Complete HR & Payroll
							</span>
							<span className="mt-2 block bg-gradient-to-r from-blue-800 via-cyan-600 to-blue-800 bg-clip-text font-black text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-cyan-300">
								Management Suite
							</span>
						</h1>
					</div>
					<p className="mx-auto mt-8 max-w-2xl font-bold text-2xl text-gray-900 leading-9 dark:text-gray-100">
						Streamline your entire HR workflow with PeopleFlow - from hiring to
						retirement. Advanced payroll processing, compliance, and analytics
						in one powerful platform.
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						<Link to="/pricing">
							<Button
								className="shadow-lg shadow-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-primary/60 hover:shadow-xl"
								size="lg"
							>
								Start 14-Day Free Trial
								<ArrowRight01Icon className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Link to="/dashboard">
							<Button
								className="transition-transform duration-200 hover:scale-105"
								size="lg"
								variant="outline"
							>
								View Demo Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="border-y bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 px-6 py-16 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
						{stats.map((stat) => (
							<div className="group text-center" key={stat.label}>
								<div className="font-bold text-5xl text-primary transition-transform duration-200 group-hover:scale-110">
									{stat.value}
								</div>
								<div className="mt-3 font-medium text-foreground/70 text-sm">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl sm:text-4xl">
							Everything You Need to Manage Your Workforce
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Comprehensive HR features designed for businesses of all sizes
						</p>
					</div>

					<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<Card
								className="group border-2 border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
								key={feature.title}
							>
								<div className="w-fit rounded-lg bg-primary/10 p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
									<feature.icon className="h-8 w-8 text-primary" />
								</div>
								<h3 className="mt-4 font-semibold text-foreground text-lg transition-colors duration-200 group-hover:text-primary">
									{feature.title}
								</h3>
								<p className="mt-2 text-foreground/70 text-sm leading-relaxed">
									{feature.description}
								</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Payroll Highlight */}
			<section className="bg-muted/50 px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
						<div>
							<h2 className="font-bold text-3xl sm:text-4xl">
								Advanced Payroll Processing
							</h2>
							<p className="mt-4 text-lg text-muted-foreground">
								Process payroll with confidence using our advanced calculation
								engine built for multi-jurisdiction compliance.
							</p>
							<div className="mt-8 space-y-4">
								<div className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">Progressive Tax Calculations</p>
										<p className="text-muted-foreground text-sm">
											Automatic PAYE and NIS calculations with support for
											complex tax bands and thresholds
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">Retroactive Adjustments</p>
										<p className="text-muted-foreground text-sm">
											Delta-based corrections with approval workflows and
											complete audit trails
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">Multi-Jurisdiction Support</p>
										<p className="text-muted-foreground text-sm">
											Configure tax rules for multiple countries and regions
											with ease
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">YTD Tracking</p>
										<p className="text-muted-foreground text-sm">
											Automatic year-to-date calculations for all earnings,
											deductions, and taxes
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center">
							<Card className="w-full border-2 p-8">
								<h3 className="font-semibold text-xl">Sample Payslip</h3>
								<div className="mt-6 space-y-4">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Gross Salary</span>
										<span className="font-medium">$5,000.00</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">PAYE Tax</span>
										<span>-$850.00</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">NIS</span>
										<span>-$250.00</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											Health Insurance
										</span>
										<span>-$150.00</span>
									</div>
									<div className="border-t pt-4">
										<div className="flex justify-between">
											<span className="font-semibold">Net Pay</span>
											<span className="font-bold text-green-600 text-xl">
												$3,750.00
											</span>
										</div>
									</div>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="font-bold text-3xl sm:text-4xl">
						Ready to Transform Your HR Operations?
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						Start your 14-day free trial today. No credit card required.
					</p>
					<div className="mt-8 flex items-center justify-center gap-4">
						<Link to="/pricing">
							<Button size="lg">
								Get Started Free
								<ArrowRight01Icon className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Link to="/dashboard">
							<Button size="lg" variant="outline">
								View Live Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
