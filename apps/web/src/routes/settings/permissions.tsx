import { createFileRoute } from "@tanstack/react-router";
import { PermissionsSettings } from "@/components/permissions-settings";

export const Route = createFileRoute("/settings/permissions")({
	component: PermissionsSettingsPage,
});

function PermissionsSettingsPage() {
	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Permissions</h1>
				<p className="text-muted-foreground text-sm">
					Manage organization members and their access levels.
				</p>
			</div>

			<div className="space-y-6">
				<PermissionsSettings />
			</div>
		</div>
	);
}
