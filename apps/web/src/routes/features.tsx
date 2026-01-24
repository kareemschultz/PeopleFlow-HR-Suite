import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight01Icon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	DashboardSquare02Icon,
	FileAttachmentIcon,
	Globe02Icon,
	MoneyBag02Icon,
	Rocket01Icon,
	SecurityCheckIcon,
	UserGroupIcon,
	WorkHistoryIcon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/features")({
	component: FeaturesPage,
});

function FeaturesPage() {
	const coreFeatures = [
		{
			icon: UserGroupIcon,
			title: "Employee Management",
			description: "Complete employee lifecycle from onboarding to offboarding",
			features: [
				"Organizational hierarchy and reporting structures",
				"Department and position management",
				"Employee profiles with custom fields",
				"Document management and e-signatures",
				"Performance reviews and goal tracking",
			],
		},
		{
			icon: MoneyBag02Icon,
			title: "Advanced Payroll",
			description: "Automated, accurate payroll processing",
			features: [
				"Multi-frequency payroll runs (weekly, biweekly, monthly)",
				"Automatic tax calculations (PAYE, NIS, etc.)",
				"Retroactive adjustments with audit trails",
				"YTD tracking and reporting",
				"Direct deposit and payment processing",
			],
		},
		{
			icon: SecurityCheckIcon,
			title: "Tax & Compliance",
			description: "Stay compliant across multiple jurisdictions",
			features: [
				"Multi-country tax rule configuration",
				"Progressive tax band calculations",
				"Statutory filing requirements",
				"Compliance reporting and alerts",
				"Audit-ready documentation",
			],
		},
		{
			icon: Calendar03Icon,
			title: "Leave Management",
			description: "Streamline time-off requests and tracking",
			features: [
				"Multiple leave types (annual, sick, personal)",
				"Leave balance tracking and accruals",
				"Approval workflows",
				"Calendar integration",
				"Carry-over and expiry rules",
			],
		},
		{
			icon: WorkHistoryIcon,
			title: "Time & Attendance",
			description: "Track time accurately with modern tools",
			features: [
				"Clock in/out with geofencing",
				"Shift scheduling and planning",
				"Overtime calculations",
				"Break time tracking",
				"Mobile app access",
			],
		},
		{
			icon: FileAttachmentIcon,
			title: "Onboarding",
			description: "Get new hires productive faster",
			features: [
				"Customizable onboarding templates",
				"Task checklists with assignments",
				"Document collection and signing",
				"Progress tracking",
				"Welcome packet generation",
			],
		},
		{
			icon: DashboardSquare02Icon,
			title: "Analytics & Reporting",
			description: "Data-driven insights for better decisions",
			features: [
				"Real-time metrics dashboard",
				"Custom report builder",
				"Data freshness indicators",
				"Export to Excel, PDF, CSV",
				"Scheduled report delivery",
			],
		},
		{
			icon: CheckmarkCircle02Icon,
			title: "Audit & Security",
			description: "Enterprise-grade security and compliance",
			features: [
				"Complete audit trails",
				"Permission snapshots",
				"Role-based access control (RBAC)",
				"Data encryption at rest and in transit",
				"SOC 2 Type II certified",
			],
		},
	];

	const platformFeatures = [
		{
			icon: Rocket01Icon,
			title: "Fast & Reliable",
			description:
				"99.9% uptime SLA with automatic backups and disaster recovery",
		},
		{
			icon: Globe02Icon,
			title: "Global Ready",
			description:
				"Support for 12+ countries with localized tax rules and currencies",
		},
		{
			icon: SecurityCheckIcon,
			title: "Bank-Level Security",
			description: "AES-256 encryption, SOC 2 certified, GDPR compliant",
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-6 py-24 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
				<div className="mx-auto max-w-4xl text-center">
					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700 text-sm dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
						🚀 All features included in every plan
					</div>
					<h1 className="font-bold text-4xl tracking-tight sm:text-6xl">
						<span className="text-gray-900 dark:text-white">
							Everything You Need to Manage
						</span>
						<br />
						<span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
							Your Workforce
						</span>
					</h1>
					<p className="mt-6 text-gray-600 text-lg leading-8 dark:text-gray-300">
						Comprehensive HR features designed for businesses of all sizes. From
						payroll to performance reviews, we've got you covered.
					</p>
				</div>
			</section>

			{/* Core Features Grid */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-1 gap-12 md:grid-cols-2">
						{coreFeatures.map((feature, index) => (
							<Card
								className="border-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
								key={feature.title}
								style={{
									animationDelay: `${index * 50}ms`,
								}}
							>
								<div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
									<feature.icon className="h-10 w-10 text-primary" />
								</div>
								<h3 className="font-bold text-2xl">{feature.title}</h3>
								<p className="mt-2 text-muted-foreground">
									{feature.description}
								</p>
								<ul className="mt-6 space-y-3">
									{feature.features.map((item) => (
										<li className="flex items-start gap-3" key={item}>
											<CheckmarkCircle02Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
											<span className="text-sm">{item}</span>
										</li>
									))}
								</ul>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Platform Features */}
			<section className="bg-muted/50 px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl">Enterprise Platform</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Built for reliability, security, and scale
						</p>
					</div>
					<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
						{platformFeatures.map((feature, index) => (
							<Card
								className="border-2 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
								key={feature.title}
								style={{
									animationDelay: `${index * 100}ms`,
								}}
							>
								<div className="mx-auto mb-4 inline-flex rounded-lg bg-primary/10 p-4">
									<feature.icon className="h-12 w-12 text-primary" />
								</div>
								<h3 className="font-bold text-xl">{feature.title}</h3>
								<p className="mt-3 text-muted-foreground text-sm">
									{feature.description}
								</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Integration & API */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
						<div>
							<h2 className="font-bold text-3xl">
								Powerful API & Integrations
							</h2>
							<p className="mt-4 text-lg text-muted-foreground">
								Connect PeopleFlow with your existing tools or build custom
								integrations using our comprehensive REST API.
							</p>
							<ul className="mt-8 space-y-4">
								<li className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">RESTful API</p>
										<p className="text-muted-foreground text-sm">
											Complete programmatic access to all features
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">Webhook Events</p>
										<p className="text-muted-foreground text-sm">
											Real-time notifications for important events
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">OAuth 2.0</p>
										<p className="text-muted-foreground text-sm">
											Secure authentication for third-party apps
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<CheckmarkCircle02Icon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
									<div>
										<p className="font-medium">Developer Portal</p>
										<p className="text-muted-foreground text-sm">
											Comprehensive docs, SDKs, and testing tools
										</p>
									</div>
								</li>
							</ul>
						</div>
						<Card className="flex flex-col justify-center border-2 p-8">
							<h3 className="font-semibold text-xl">Popular Integrations</h3>
							<div className="mt-6 grid grid-cols-2 gap-4">
								{[
									"Slack",
									"Microsoft Teams",
									"Google Workspace",
									"QuickBooks",
									"Xero",
									"Stripe",
									"Zoom",
									"Salesforce",
								].map((integration) => (
									<div
										className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3"
										key={integration}
									>
										<div className="h-8 w-8 rounded bg-primary/10" />
										<span className="font-medium text-sm">{integration}</span>
									</div>
								))}
							</div>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-6 py-24 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="font-bold text-3xl sm:text-4xl">
						<span className="text-gray-900 dark:text-white">
							Ready to see it in action?
						</span>
					</h2>
					<p className="mt-4 text-gray-600 text-lg dark:text-gray-300">
						Start your free trial today. No credit card required.
					</p>
					<div className="mt-8 flex items-center justify-center gap-4">
						<Link to="/pricing">
							<Button size="lg">
								Start Free Trial
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
