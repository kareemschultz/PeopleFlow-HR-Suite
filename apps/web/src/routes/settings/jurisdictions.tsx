import { createFileRoute } from "@tanstack/react-router";
import { JurisdictionSettings } from "@/components/jurisdiction-settings";

export const Route = createFileRoute("/settings/jurisdictions")({
	component: JurisdictionSettingsPage,
});

function JurisdictionSettingsPage() {
	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
				<p className="text-muted-foreground text-sm">
					Manage your organization settings and preferences.
				</p>
			</div>

			<div className="space-y-6">
				<JurisdictionSettings />
			</div>
		</div>
	);
}
