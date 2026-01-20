import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * Hook to get the current user's organizations and active organization ID.
 *
 * Returns the first organization the user is a member of as the active one.
 * Can be extended to support organization switching via URL params or local storage.
 */
export function useOrganization() {
	const { data: session, isPending: isSessionLoading } = useQuery({
		queryKey: ["auth", "session"],
		queryFn: async () => {
			const result = await authClient.getSession();
			return result.data;
		},
	});

	const {
		data: memberships,
		isPending: isMembershipsLoading,
		error,
	} = useQuery({
		...orpc.organizations.myOrganizations.queryOptions(),
		enabled: !!session?.user,
	});

	// Get the first active organization (could be extended to support org switching)
	const activeOrganization = memberships?.[0]?.organization ?? null;
	const organizationId = activeOrganization?.id ?? "";
	const membership = memberships?.[0] ?? null;

	const isLoading = isSessionLoading || isMembershipsLoading;
	const hasOrganization = !!organizationId;

	return {
		// Session data
		session,
		user: session?.user ?? null,

		// Organization data
		organizationId,
		organization: activeOrganization,
		membership,
		memberships: memberships ?? [],

		// State
		isLoading,
		hasOrganization,
		error,
	};
}
