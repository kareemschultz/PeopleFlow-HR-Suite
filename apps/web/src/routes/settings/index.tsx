import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building02Icon,
	LicenseIcon,
	SecurityCheckIcon,
	Settings01Icon,
	UserIcon,
} from "hugeicons-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPage() {
	const settingsCategories = [
		{
			title: "Organization",
			description: "Manage organization details and preferences",
			icon: Building02Icon,
			href: "/settings/organization",
		},
		{
			title: "Permissions",
			description: "Manage user roles and access control",
			icon: SecurityCheckIcon,
			href: "/settings/permissions",
		},
		{
			title: "Tax Jurisdictions",
			description: "Configure tax rules and jurisdictions",
			icon: Settings01Icon,
			href: "/settings/jurisdictions",
		},
		{
			title: "License",
			description: "View and manage your license",
			icon: LicenseIcon,
			href: "/settings/license",
		},
		{
			title: "Users",
			description: "Manage system users and invitations",
			icon: UserIcon,
			href: "/settings/users",
			disabled: true,
		},
	];

	return (
		<div className="container mx-auto space-y-6 py-8">
			<div>
				<h1 className="font-bold text-3xl">Settings</h1>
				<p className="mt-2 text-muted-foreground">
					Manage your organization settings and preferences
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{settingsCategories.map((category) => (
					<Link
						className={category.disabled ? "pointer-events-none" : ""}
						key={category.href}
						to={category.href}
					>
						<Card
							className={`group p-6 transition-all hover:border-primary hover:shadow-md ${
								category.disabled ? "opacity-50" : ""
							}`}
						>
							<div className="flex items-start gap-4">
								<div className="rounded-lg bg-primary/10 p-3">
									<category.icon className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-lg group-hover:text-primary">
										{category.title}
									</h3>
									<p className="mt-1 text-muted-foreground text-sm">
										{category.description}
									</p>
									{category.disabled && (
										<p className="mt-2 text-muted-foreground text-xs">
											Coming soon
										</p>
									)}
								</div>
							</div>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
