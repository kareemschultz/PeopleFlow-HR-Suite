import { useQuery } from "@tanstack/react-query";
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	Loading03Icon,
	TrendUp02Icon,
} from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface MetricCardProps {
	title: string;
	value: string | number;
	change?: {
		absolute: number;
		percent: number;
	};
	unit?: string;
	category?: string;
	confidence?: number;
	isEstimated?: boolean;
	className?: string;
}

function MetricCard({
	title,
	value,
	change,
	unit,
	category,
	confidence,
	isEstimated,
	className,
}: MetricCardProps) {
	const getTrendIcon = () => {
		if (!change) return null;

		if (change.percent > 0) {
			return <ArrowUp01Icon className="h-4 w-4 text-green-600" />;
		}
		if (change.percent < 0) {
			return <ArrowDown01Icon className="h-4 w-4 text-red-600" />;
		}
		return null;
	};

	const getTrendColor = () => {
		if (!change) return "";

		if (change.percent > 0) {
			return "text-green-600";
		}
		if (change.percent < 0) {
			return "text-red-600";
		}
		return "text-muted-foreground";
	};

	const getCategoryColor = (cat: string | undefined) => {
		switch (cat) {
			case "payroll":
				return "bg-blue-100 text-blue-700";
			case "hr":
				return "bg-purple-100 text-purple-700";
			case "compliance":
				return "bg-yellow-100 text-yellow-700";
			case "finance":
				return "bg-green-100 text-green-700";
			case "operations":
				return "bg-orange-100 text-orange-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<Card className={cn("p-6", className)}>
			<div className="space-y-3">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-muted-foreground text-sm">{title}</p>
						{category && (
							<Badge
								className={cn("mt-1", getCategoryColor(category))}
								variant="outline"
							>
								{category}
							</Badge>
						)}
					</div>
					{confidence !== undefined && confidence < 1 && (
						<Badge variant="outline">
							{(confidence * 100).toFixed(0)}% confidence
						</Badge>
					)}
				</div>

				<div className="flex items-end gap-2">
					<div className="flex items-baseline gap-2">
						<span className="font-bold text-3xl">{value}</span>
						{unit && (
							<span className="text-muted-foreground text-sm">{unit}</span>
						)}
					</div>
					{isEstimated && (
						<Badge className="mb-1" variant="secondary">
							Est
						</Badge>
					)}
				</div>

				{change && (
					<div className={cn("flex items-center gap-2", getTrendColor())}>
						{getTrendIcon()}
						<span className="font-medium text-sm">
							{change.percent > 0 ? "+" : ""}
							{change.percent.toFixed(1)}%
						</span>
						<span className="text-muted-foreground text-xs">
							vs last period
						</span>
					</div>
				)}
			</div>
		</Card>
	);
}

interface MetricsDashboardProps {
	/**
	 * Time period for metrics
	 */
	periodStart?: string;
	periodEnd?: string;

	/**
	 * Filter by category
	 */
	category?: "payroll" | "hr" | "compliance" | "finance" | "operations";

	/**
	 * Filter by specific metric keys
	 */
	metricKeys?: string[];

	/**
	 * Number of metrics to display
	 */
	limit?: number;

	/**
	 * Optional className for styling
	 */
	className?: string;
}

export function MetricsDashboard({
	periodStart,
	periodEnd,
	category,
	metricKeys,
	limit = 8,
	className,
}: MetricsDashboardProps) {
	const { organizationId, hasOrganization } = useOrganization();

	const { data: metrics, isLoading } = useQuery({
		...orpc.metrics.listValues.queryOptions({
			organizationId,
			periodStart,
			periodEnd,
			category,
			status: "current",
			limit,
		}),
		enabled: hasOrganization,
		select: (data) => {
			// Filter by metricKeys if provided
			if (metricKeys && metricKeys.length > 0) {
				return data.filter((m) => metricKeys.includes(m.metricKey));
			}
			return data;
		},
	});

	const formatValue = (
		valueStr: string,
		valueType: string,
		unit: string | null
	): string => {
		const value = Number.parseFloat(valueStr);

		switch (valueType) {
			case "currency":
				return new Intl.NumberFormat("en-GY", {
					style: "currency",
					currency: unit || "GYD",
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(value);

			case "percentage":
				return `${value.toFixed(1)}%`;

			case "count":
				return value.toLocaleString();

			case "ratio":
				return value.toFixed(2);

			default:
				return value.toLocaleString();
		}
	};

	if (isLoading) {
		return (
			<div
				className={cn(
					"grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
					className
				)}
			>
				{Array.from({ length: 4 }).map((_, i) => (
					<Card className="p-6" key={i}>
						<Skeleton className="h-20 w-full" />
					</Card>
				))}
			</div>
		);
	}

	if (!metrics || metrics.length === 0) {
		return (
			<Card className={cn("p-12 text-center", className)}>
				<TrendUp02Icon className="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 className="mt-4 font-semibold text-lg">No Metrics Available</h3>
				<p className="mt-2 text-muted-foreground text-sm">
					Metrics will appear here once data is calculated
				</p>
			</Card>
		);
	}

	return (
		<div className={cn("space-y-6", className)}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Metrics Dashboard</h2>
					<p className="text-muted-foreground text-sm">
						{periodStart && periodEnd
							? `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`
							: "Current period"}
					</p>
				</div>
				{category && (
					<Badge variant="outline">Showing {category} metrics</Badge>
				)}
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric) => (
					<MetricCard
						category={metric.category ?? undefined}
						change={
							metric.changePercent
								? {
										absolute: Number.parseFloat(metric.changeAbsolute ?? "0"),
										percent: Number.parseFloat(metric.changePercent),
									}
								: undefined
						}
						confidence={
							metric.confidence
								? Number.parseFloat(metric.confidence)
								: undefined
						}
						isEstimated={metric.isEstimated}
						key={metric.id}
						title={metric.metricName}
						unit={
							metric.valueType === "currency"
								? undefined
								: (metric.unit ?? undefined)
						}
						value={formatValue(metric.value, metric.valueType, metric.unit)}
					/>
				))}
			</div>

			{/* Additional Insights */}
			<Card className="p-6">
				<h3 className="mb-4 font-semibold text-lg">Metric Insights</h3>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="rounded-lg bg-muted/50 p-4">
						<div className="flex items-center gap-3">
							<Loading03Icon className="h-5 w-5 text-primary" />
							<div>
								<p className="font-medium text-sm">Total Metrics Tracked</p>
								<p className="mt-1 font-bold text-2xl">{metrics.length}</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg bg-muted/50 p-4">
						<div className="flex items-center gap-3">
							<TrendUp02Icon className="h-5 w-5 text-green-600" />
							<div>
								<p className="font-medium text-sm">Improving Metrics</p>
								<p className="mt-1 font-bold text-2xl">
									{
										metrics.filter((m) => {
											const change = m.changePercent
												? Number.parseFloat(m.changePercent)
												: 0;
											return change > 0;
										}).length
									}
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
