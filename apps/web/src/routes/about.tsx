import { createFileRoute } from "@tanstack/react-router";
import {
	EyeIcon,
	Rocket01Icon,
	Target03Icon,
	UserGroupIcon,
} from "hugeicons-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
	component: AboutPage,
});

function AboutPage() {
	const values = [
		{
			icon: Target03Icon,
			title: "Customer First",
			description:
				"We build features our customers need, not what we think is cool. Every decision starts with customer impact.",
		},
		{
			icon: Rocket01Icon,
			title: "Innovation",
			description:
				"HR software doesn't have to be boring. We leverage modern technology to create delightful experiences.",
		},
		{
			icon: UserGroupIcon,
			title: "Transparency",
			description:
				"No hidden fees, no surprise charges. What you see is what you get - simple, honest pricing.",
		},
		{
			icon: EyeIcon,
			title: "Data Privacy",
			description:
				"Your employees' data is sacred. We implement bank-level security and never sell your data.",
		},
	];

	const team = [
		{
			name: "Leadership Team",
			count: "15+",
			description: "Years of combined HR & payroll expertise",
		},
		{
			name: "Engineering",
			count: "50+",
			description: "Developers building world-class software",
		},
		{
			name: "Support",
			count: "24/7",
			description: "Customer success team always available",
		},
		{
			name: "Global",
			count: "12",
			description: "Countries supported for payroll processing",
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-6 py-24 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
				<div className="mx-auto max-w-4xl text-center">
					<h1 className="font-bold text-4xl tracking-tight sm:text-6xl">
						<span className="text-gray-900 dark:text-white">About</span>
						<br />
						<span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
							PeopleFlow
						</span>
					</h1>
					<p className="mt-6 text-gray-600 text-lg leading-8 dark:text-gray-300">
						We're on a mission to make HR and payroll management simple,
						accurate, and accessible for businesses worldwide.
					</p>
				</div>
			</section>

			{/* Mission & Vision */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid gap-12 lg:grid-cols-2">
						<Card className="border-2 p-8">
							<div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 dark:bg-blue-950">
								<Target03Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-bold text-3xl">Our Mission</h2>
							<p className="mt-4 text-gray-600 leading-relaxed dark:text-gray-300">
								To empower businesses of all sizes with enterprise-grade HR and
								payroll tools that are affordable, accurate, and easy to use. We
								believe great HR software shouldn't require a Fortune 500 budget
								or a dedicated IT team.
							</p>
						</Card>
						<Card className="border-2 p-8">
							<div className="mb-4 inline-flex rounded-lg bg-cyan-100 p-3 dark:bg-cyan-950">
								<EyeIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
							</div>
							<h2 className="font-bold text-3xl">Our Vision</h2>
							<p className="mt-4 text-gray-600 leading-relaxed dark:text-gray-300">
								A world where every business can manage their people operations
								with confidence, compliance, and care. We're building the global
								standard for HR management - one that adapts to your business,
								not the other way around.
							</p>
						</Card>
					</div>
				</div>
			</section>

			{/* Values */}
			<section className="bg-muted/50 px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl">Our Values</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Principles that guide everything we do
						</p>
					</div>
					<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
						{values.map((value, index) => (
							<Card
								className="border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
								key={value.title}
								style={{
									animationDelay: `${index * 100}ms`,
								}}
							>
								<div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
									<value.icon className="h-8 w-8 text-primary" />
								</div>
								<h3 className="font-semibold text-xl">{value.title}</h3>
								<p className="mt-3 text-muted-foreground leading-relaxed">
									{value.description}
								</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Team Stats */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl">Built by Experts</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Our team combines deep industry expertise with modern technology
						</p>
					</div>
					<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
						{team.map((stat, index) => (
							<div
								className="text-center"
								key={stat.name}
								style={{
									animationDelay: `${index * 100}ms`,
								}}
							>
								<div className="font-bold text-5xl text-primary">
									{stat.count}
								</div>
								<div className="mt-2 font-semibold text-lg">{stat.name}</div>
								<div className="mt-1 text-muted-foreground text-sm">
									{stat.description}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Story */}
			<section className="bg-muted/50 px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-3xl">
					<h2 className="text-center font-bold text-3xl">Our Story</h2>
					<div className="mt-8 space-y-6 text-gray-600 leading-relaxed dark:text-gray-300">
						<p>
							PeopleFlow was born from a simple frustration: why is HR software
							so complicated and expensive? Our founders spent years working
							with legacy payroll systems that were clunky, error-prone, and
							required constant manual intervention.
						</p>
						<p>
							In 2023, we set out to build something better. Not just another HR
							system, but a complete platform that combines the power of
							enterprise software with the simplicity of consumer apps. We
							wanted to create tools that people actually enjoy using.
						</p>
						<p>
							Today, PeopleFlow serves hundreds of businesses across 12
							countries, processing millions in payroll every month. But we're
							just getting started. We're constantly listening to our customers,
							shipping new features, and expanding to new markets.
						</p>
						<p>
							Whether you're a 5-person startup or a 5,000-employee corporation,
							we're here to help you manage your people with confidence. Join us
							on this journey.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
