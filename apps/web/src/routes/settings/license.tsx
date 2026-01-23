import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckmarkCircle02Icon } from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/settings/license")({
	component: LicenseSettingsPage,
});

function LicenseSettingsPage() {
	const { organizationId, hasOrganization } = useOrganization();

	const { data: license, isLoading: isLicenseLoading } = useQuery({
		...orpc.licensing.getCurrentLicense.queryOptions({
			input: {
				organizationId,
			},
		}),
		enabled: hasOrganization,
	});

	const { data: subscription, isLoading: isSubLoading } = useQuery({
		...orpc.licensing.getActiveSubscription.queryOptions({
			input: {
				organizationId,
			},
		}),
		enabled: hasOrganization,
	});

	const isLoading = isLicenseLoading || isSubLoading;

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-bold text-3xl">License & Subscription</h1>
				<p className="text-muted-foreground">
					Manage your PeopleFlow HR Suite license and subscription
				</p>
			</div>

			{isLoading ? (
				<Card className="p-6">
					<Skeleton className="h-40 w-full" />
				</Card>
			) : license ? (
				<Card className="p-6">
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-3">
								<h2 className="font-semibold text-2xl capitalize">
									{license.tier} Plan
								</h2>
								{license.isActive ? (
									<Badge className="bg-green-100 text-green-700">Active</Badge>
								) : (
									<Badge variant="destructive">Inactive</Badge>
								)}
							</div>
							<p className="mt-2 text-muted-foreground capitalize">
								{license.type.replace(/_/g, " ")}
							</p>
						</div>
						<Button>Upgrade Plan</Button>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
						<div>
							<p className="text-muted-foreground text-sm">License Type</p>
							<p className="mt-1 font-medium capitalize">
								{license.type.replace(/_/g, " ")}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Employee Seats</p>
							<p className="mt-1 font-medium">
								{license.usedSeats ?? 0} / {license.seats}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Expires</p>
							<p className="mt-1 font-medium">
								{license.expiresAt
									? new Date(license.expiresAt).toLocaleDateString()
									: "Never (Perpetual)"}
							</p>
						</div>
					</div>

					{license.type === "on_prem_perpetual" && license.licenseKey && (
						<div className="mt-6 rounded-lg bg-muted p-4">
							<p className="font-medium text-sm">License Key</p>
							<p className="mt-1 font-mono text-muted-foreground text-sm">
								{license.licenseKey}
							</p>
						</div>
					)}
				</Card>
			) : (
				<Card className="p-12 text-center">
					<h2 className="font-semibold text-xl">No Active License</h2>
					<p className="mt-2 text-muted-foreground">
						Contact sales to activate your license
					</p>
					<Button className="mt-4">Contact Sales</Button>
				</Card>
			)}

			{subscription && (
				<Card className="p-6">
					<h2 className="mb-4 font-semibold text-xl">Subscription Details</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<p className="text-muted-foreground text-sm">Plan</p>
							<p className="mt-1 font-medium capitalize">
								{subscription.plan.replace(/_/g, " ")}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Status</p>
							<p className="mt-1 font-medium capitalize">
								{subscription.status}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Billing Cycle</p>
							<p className="mt-1 font-medium capitalize">
								{subscription.billingCycle}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Next Billing Date</p>
							<p className="mt-1 font-medium">
								{new Date(subscription.currentPeriodEnd).toLocaleDateString()}
							</p>
						</div>
					</div>

					<div className="mt-6 flex gap-3">
						<Button variant="outline">Manage Billing</Button>
						<Button variant="outline">Cancel Subscription</Button>
					</div>
				</Card>
			)}

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Features Included</h2>
				<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<li className="flex items-start gap-2">
						<CheckmarkCircle02Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
						<span>Unlimited payroll runs</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckmarkCircle02Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
						<span>Multi-jurisdiction tax support</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckmarkCircle02Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
						<span>Advanced analytics</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckmarkCircle02Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
						<span>Priority support</span>
					</li>
				</ul>
			</Card>
		</div>
	);
}
