import { useQuery } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	InformationCircleIcon,
	Loading03Icon,
	Lock01Icon,
} from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrganization } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface DataFreshnessProps {
	/**
	 * Type of data to check freshness for
	 * e.g., "attendance", "payroll", "leave", "metrics", "employee_records"
	 */
	dataType: string;

	/**
	 * Optional entity name for granularity
	 * e.g., "employees", "payroll_runs", "time_entries"
	 */
	entityName?: string;

	/**
	 * Optional className for styling
	 */
	className?: string;

	/**
	 * Show detailed information inline instead of in tooltip
	 */
	detailed?: boolean;
}

export function DataFreshness({
	dataType,
	entityName,
	className,
	detailed = false,
}: DataFreshnessProps) {
	const { organizationId, hasOrganization } = useOrganization();

	const { data: freshnessRecords, isLoading } = useQuery({
		...orpc.metrics.getFreshness.queryOptions({
			organizationId,
			dataType,
			entityName,
		}),
		enabled: hasOrganization,
		refetchInterval: 30_000, // Refresh every 30 seconds
	});

	const freshness = freshnessRecords?.[0]; // Get the most recent record

	const getStatusConfig = (
		status: string | null | undefined
	): {
		variant: "default" | "destructive" | "secondary" | "outline";
		label: string;
		icon: React.ElementType;
		color: string;
	} => {
		switch (status) {
			case "current":
				return {
					variant: "default",
					label: "Up to date",
					icon: CheckmarkCircle02Icon,
					color: "text-green-600",
				};
			case "stale":
				return {
					variant: "secondary",
					label: "Stale",
					icon: AlertCircleIcon,
					color: "text-yellow-600",
				};
			case "calculating":
				return {
					variant: "outline",
					label: "Updating...",
					icon: Loading03Icon,
					color: "text-blue-600",
				};
			case "locked":
				return {
					variant: "secondary",
					label: "Locked",
					icon: Lock01Icon,
					color: "text-gray-600",
				};
			case "error":
				return {
					variant: "destructive",
					label: "Error",
					icon: AlertCircleIcon,
					color: "text-red-600",
				};
			default:
				return {
					variant: "secondary",
					label: "Unknown",
					icon: InformationCircleIcon,
					color: "text-gray-600",
				};
		}
	};

	const formatTimestamp = (timestamp: string | Date | null | undefined) => {
		if (!timestamp) {
			return "Never";
		}
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60_000);
		const diffHours = Math.floor(diffMs / 3_600_000);
		const diffDays = Math.floor(diffMs / 86_400_000);

		if (diffMins < 1) {
			return "Just now";
		}
		if (diffMins < 60) {
			return `${diffMins}m ago`;
		}
		if (diffHours < 24) {
			return `${diffHours}h ago`;
		}
		if (diffDays < 7) {
			return `${diffDays}d ago`;
		}
		return date.toLocaleDateString();
	};

	if (isLoading) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<Loading03Icon className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-muted-foreground text-sm">Checking...</span>
			</div>
		);
	}

	if (!freshness) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<InformationCircleIcon className="h-4 w-4 text-muted-foreground" />
				<span className="text-muted-foreground text-sm">No data</span>
			</div>
		);
	}

	const statusConfig = getStatusConfig(freshness.status);
	const StatusIcon = statusConfig.icon;

	if (detailed) {
		return (
			<div className={cn("space-y-2 rounded-lg border p-4", className)}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
						<span className="font-medium">{statusConfig.label}</span>
					</div>
					<Badge variant={statusConfig.variant}>{freshness.status}</Badge>
				</div>

				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-muted-foreground text-xs">Last Updated</p>
						<div className="mt-1 flex items-center gap-1">
							<Clock01Icon className="h-3 w-3 text-muted-foreground" />
							<span>{formatTimestamp(freshness.lastUpdatedAt)}</span>
						</div>
						{freshness.updater && (
							<p className="mt-1 text-muted-foreground text-xs">
								by {freshness.updater.firstName} {freshness.updater.lastName}
							</p>
						)}
					</div>

					{freshness.nextRefreshAt && (
						<div>
							<p className="text-muted-foreground text-xs">Next Refresh</p>
							<div className="mt-1 flex items-center gap-1">
								<Clock01Icon className="h-3 w-3 text-muted-foreground" />
								<span>{formatTimestamp(freshness.nextRefreshAt)}</span>
							</div>
						</div>
					)}

					{freshness.isLocked && (
						<div className="col-span-2">
							<p className="text-muted-foreground text-xs">Locked</p>
							<div className="mt-1 flex items-center gap-1">
								<Lock01Icon className="h-3 w-3 text-muted-foreground" />
								<span>
									{formatTimestamp(freshness.lockedAt)}
									{freshness.locker &&
										` by ${freshness.locker.firstName} ${freshness.locker.lastName}`}
								</span>
							</div>
						</div>
					)}

					{freshness.updateMetadata?.recordsUpdated !== undefined && (
						<div>
							<p className="text-muted-foreground text-xs">Records Updated</p>
							<p className="mt-1">
								{freshness.updateMetadata.recordsUpdated.toLocaleString()}
							</p>
						</div>
					)}

					{freshness.updateMetadata?.updateDuration !== undefined && (
						<div>
							<p className="text-muted-foreground text-xs">Update Duration</p>
							<p className="mt-1">
								{freshness.updateMetadata.updateDuration < 1000
									? `${freshness.updateMetadata.updateDuration}ms`
									: `${(freshness.updateMetadata.updateDuration / 1000).toFixed(1)}s`}
							</p>
						</div>
					)}

					{freshness.updateMetadata?.errors &&
						freshness.updateMetadata.errors.length > 0 && (
							<div className="col-span-2">
								<p className="text-destructive text-xs">Errors</p>
								<ul className="mt-1 list-inside list-disc text-xs">
									{freshness.updateMetadata.errors.map((error, index) => (
										<li className="text-destructive" key={index}>
											{error}
										</li>
									))}
								</ul>
							</div>
						)}
				</div>
			</div>
		);
	}

	// Compact view with tooltip
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className={cn("inline-flex items-center gap-2", className)}>
						<StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
						<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
					</div>
				</TooltipTrigger>
				<TooltipContent className="max-w-xs">
					<div className="space-y-2">
						<div>
							<p className="font-medium text-sm">Data Freshness</p>
							<p className="text-muted-foreground text-xs">
								{dataType}
								{entityName && ` • ${entityName}`}
							</p>
						</div>

						<div className="space-y-1 text-xs">
							<div className="flex items-center justify-between gap-4">
								<span className="text-muted-foreground">Last Updated:</span>
								<span>{formatTimestamp(freshness.lastUpdatedAt)}</span>
							</div>

							{freshness.updater && (
								<div className="flex items-center justify-between gap-4">
									<span className="text-muted-foreground">Updated By:</span>
									<span>
										{freshness.updater.firstName} {freshness.updater.lastName}
									</span>
								</div>
							)}

							{freshness.nextRefreshAt && (
								<div className="flex items-center justify-between gap-4">
									<span className="text-muted-foreground">Next Refresh:</span>
									<span>{formatTimestamp(freshness.nextRefreshAt)}</span>
								</div>
							)}

							{freshness.isLocked && (
								<div className="flex items-center gap-1 text-yellow-600">
									<Lock01Icon className="h-3 w-3" />
									<span>Locked - no updates allowed</span>
								</div>
							)}

							{freshness.updateMetadata?.recordsUpdated !== undefined && (
								<div className="flex items-center justify-between gap-4">
									<span className="text-muted-foreground">Records:</span>
									<span>
										{freshness.updateMetadata.recordsUpdated.toLocaleString()}
									</span>
								</div>
							)}
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
