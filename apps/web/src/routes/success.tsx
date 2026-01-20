import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	checkout_id: z.string().optional(),
});

export const Route = createFileRoute("/success")({
	component: SuccessPage,
	validateSearch: searchSchema,
});

function SuccessPage() {
	const search = Route.useSearch();
	const checkout_id = "checkout_id" in search ? search.checkout_id : undefined;

	return (
		<div className="container mx-auto px-4 py-8">
			<h1>Payment Successful!</h1>
			{checkout_id && <p>Checkout ID: {checkout_id}</p>}
		</div>
	);
}
