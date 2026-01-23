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
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="bg-gradient-to-b from-primary/10 via-background to-background px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl text-center">
					<h1 className="font-bold text-5xl tracking-tight sm:text-7xl">
						Complete HR & Payroll
						<br />
						<span className="text-primary">Management Suite</span>
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-8">
						Streamline your entire HR workflow with PeopleFlow - from hiring to
						retirement. Advanced payroll processing, compliance, and analytics
						in one powerful platform.
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						<Link to="/pricing">
							<Button size="lg">
								Start 14-Day Free Trial
								<ArrowRight01Icon className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Link to="/dashboard">
							<Button size="lg" variant="outline">
								View Demo Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="border-y bg-muted/50 px-6 py-12 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
						{stats.map((stat) => (
							<div className="text-center" key={stat.label}>
								<div className="font-bold text-4xl text-primary">
									{stat.value}
								</div>
								<div className="mt-2 text-muted-foreground text-sm">
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
							<Card className="p-6" key={feature.title}>
								<feature.icon className="h-10 w-10 text-primary" />
								<h3 className="mt-4 font-semibold text-lg">{feature.title}</h3>
								<p className="mt-2 text-muted-foreground text-sm">
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
