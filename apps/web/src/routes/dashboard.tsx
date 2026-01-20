import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Type for route context
interface DashboardContext {
	session: Awaited<ReturnType<typeof authClient.getSession>>;
	customerState: Awaited<ReturnType<typeof authClient.customer.state>>["data"];
}

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async (): Promise<DashboardContext> => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		const { data: customerState } = await authClient.customer.state();
		return { session, customerState };
	},
});

function RouteComponent() {
	const { session, customerState } =
		Route.useRouteContext() as DashboardContext;

	const privateData = useQuery(orpc.privateData.queryOptions());

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.data?.user.name}</p>
			<p>API: {privateData.data?.message}</p>
			<p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
			{hasProSubscription ? (
				<Button onClick={async () => await authClient.customer.portal()}>
					Manage Subscription
				</Button>
			) : (
				<Button
					onClick={async () => await authClient.checkout({ slug: "pro" })}
				>
					Upgrade to Pro
				</Button>
			)}
		</div>
	);
}
