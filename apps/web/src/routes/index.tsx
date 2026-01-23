import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		// Redirect to employees page as the main app page
		throw redirect({
			to: "/employees",
		});
	},
});
